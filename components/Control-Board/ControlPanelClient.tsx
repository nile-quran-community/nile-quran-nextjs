"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Lalezar, Tajawal } from "next/font/google";
import { Progress } from "@/components/ui/progress";
import { getUsers, getCategories, getPoints } from "@/actions/ControlBoard";
import UserRow from "./userRow";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";

// 🟢 Fonts
const lalezar = Lalezar({ subsets: ["latin"], weight: "400" });
const tajawal = Tajawal({ subsets: ["latin"], weight: "700" });

// 🟢 Types
type Category = { id: number; name: string };
type User = {
  id: number;
  first_name: string;
  last_name: string;
  groups: string[];
  points: number;
  supervisor: string;
};
type UserPoints = {
  user: number;
  points: number;
  activities: Activity[];
};
type PointsResponse = {
  points: UserPoints[];
};
type Activity = {
  id: number;
  category: number;
  date: string;
};

export interface ControlPanelData {
  users: User[];
  categories: Category[];
  points: PointsResponse;
  error?: string | unknown;
}

// 🟢 Assets
import ArrwoLeft from "@/public/ArrowLeft.png";
import ArrwoRight from "@/public/Arrowright.png";
import Mask1 from "@/public/Mask.png";
import Mask2 from "@/public/Mask2.png";
import { getHijriMonth, toArabicDigits } from "@/lib/utils";

// ============================
// 🟢 Module-level category cache
// ============================
let cachedCategories: Category[] | null = null;
let categoriesFetchedAt: number | null = null;
const CACHE_DURATION = 60 * 60 * 1000;

async function fetchCategoriesCached(): Promise<Category[]> {
  const now = Date.now();
  if (cachedCategories && categoriesFetchedAt && now - categoriesFetchedAt < CACHE_DURATION) {
    return cachedCategories;
  }

  const res = await getCategories();
  if (res?.success) {
    cachedCategories = Array.isArray(res.categories)
      ? res.categories
      : (res.categories as { results?: Category[] })?.results || [];
    categoriesFetchedAt = now;
  }

  return cachedCategories || [];
}

// 🟢 Component
export default function ControlPanelClient() {
  const date = new Date();
  const hijriDate = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  const getInitialWeekIndex = () => {
    if (hijriDate.day <= 28) {
      return Math.ceil(hijriDate.day / 7);
    }
    return 5;
  };

  const currentWeek = getInitialWeekIndex();
  const weekArabicNames = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

  const [data, setData] = useState<ControlPanelData>({
    users: [],
    categories: [],
    points: { points: [] },
  });

  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(hijriDate.month);
  const [year, setYear] = useState(hijriDate.year);
  const [weekIndex, setWeekIndex] = useState<number>(getInitialWeekIndex);

  const categoriesRef = useRef<Category[]>([]);

  const fetchWeekData = useCallback(
    async (week: number) => {
      try {
        const [usersRes, categories, pointsRes] = await Promise.all([
          getUsers(year, month, week),
          categoriesRef.current.length > 0
            ? Promise.resolve(categoriesRef.current)
            : fetchCategoriesCached(),
          getPoints(year, month, week),
        ]);

        if (categories.length > 0) {
          categoriesRef.current = categories;
        }

        setData((prev) => {
          const newData = { ...prev };

          if (usersRes && usersRes.success) {
            const rawUsers = usersRes.users;
            newData.users = Array.isArray(rawUsers) ? rawUsers : rawUsers?.results || [];
          } else {
            newData.error = usersRes?.error || "Error loading users";
          }

          // ✅ pointsRes.points is the PointsResponse object { points: UserPoints[] }
          if (pointsRes && pointsRes.success) {
            const raw = pointsRes.points;
            newData.points = {
              points: Array.isArray(raw) ? raw : (raw as { results?: UserPoints[] })?.results || [],
            };
          }

          newData.categories = categories;

          return newData;
        });
      } catch (error) {
        console.error("Fetch error:", error);
        setData((prev) => ({ ...prev, error: "System error loading data" }));
      }
    },
    [year, month],
  );

  // ✅ Single useEffect — triggers on week/month/year change
  useEffect(() => {
    setLoading(true);
    fetchWeekData(weekIndex).finally(() => setLoading(false));
  }, [weekIndex, fetchWeekData]);

  const handleWeekChange = (dir: "prev" | "next") => {
    if (loading) return;

    if (dir === "next") {
      if (weekIndex < 5) {
        setWeekIndex((prev) => prev + 1);
      } else {
        setWeekIndex(1);
        if (month === 12) {
          setMonth(1);
          setYear((prev) => prev + 1);
        } else {
          setMonth((prev) => prev + 1);
        }
      }
    } else {
      if (weekIndex > 1) {
        setWeekIndex((prev) => prev - 1);
      } else {
        setWeekIndex(5);
        if (month === 1) {
          setMonth(12);
          setYear((prev) => prev - 1);
        } else {
          setMonth((prev) => prev - 1);
        }
      }
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen items-center bg-[#EBF0EB] overflow-hidden">
      {/* 🟢 Header */}
      <div className="absolute top-0 left-0 w-full h-[207px] bg-[#BEE663] py-6 z-10">
        <p className={`${tajawal.className} text-4xl font-bold text-end pr-28 text-[#043F2E]`}>
          لوحة التحكم
        </p>
      </div>

      {/* 🟢 Content */}
      <div className="relative z-20 container mt-28 p-6 flex flex-col gap-15">
        {/* Progress Bar */}
        <div className="w-full h-[123px] bg-[#F7FBEA] p-7 gap-5 border border-[#043F2E] rounded-2xl flex">
          <div className="relative flex-1 h-[35px]">
            <Progress
              value={(weekIndex / 5) * 100}
              className="h-[35px] bg-[#DEFF90]"
              className2="bg-[#9ADD00]"
            />
          </div>
          <div className="flex flex-col text-[#043F2E]">
            <p className={`${lalezar.className} text-[28.5px]`}>
              {getHijriMonth(month - 1)} -{toArabicDigits(year)}
            </p>
            <p className={`${lalezar.className} text-[17px] text-end`}>
              الأسبوع {weekArabicNames[weekIndex - 1]}
            </p>
          </div>
        </div>

        {/* Main Table */}
        <div className="relative w-full bg-[#F7FBEA] p-7 border border-[#043F2E] rounded-2xl flex flex-col overflow-auto">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 top-0 right-0 bg-white/70 backdrop-blur-sm flex flex-col justify-center items-center z-50">
              <div className="w-10 h-10 border-4 border-[#043F2E] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-[#043F2E] font-bold">جارِ تحميل البيانات...</p>
            </div>
          )}
          <div className="min-w-[1200px] flex flex-col">
            {/* Header Row */}
            <div className="relative h-8 w-full flex">
              <div className="w-[200px] pr-3 h-full border-b border-r border-black flex justify-end items-center gap-2">
                <div className={`${tajawal.className} font-bold text-[15px] text-[#043F2E]`}>
                  مجموع الشهر
                </div>
              </div>

              <div className="flex-1 flex gap-3 pr-3 justify-center items-center h-full border-b border-r border-black">
                <button
                  onClick={() => handleWeekChange("next")}
                  disabled={loading}
                  className="relative w-[18px] h-[18px] flex justify-center items-center rounded-[3px] bg-[#043F2E] disabled:opacity-40 hover:bg-[#065f46] transition-colors"
                >
                  <Image src={ArrwoLeft} alt="previous" width={5} height={5} />
                </button>

                <div
                  className={`${tajawal.className} font-bold text-[15px] text-[#043F2E] min-w-[100px] text-center`}
                >
                  الأسبوع {weekArabicNames[weekIndex - 1]}
                </div>

                <button
                  onClick={() => handleWeekChange("prev")}
                  disabled={loading}
                  className="relative w-[18px] h-[18px] flex justify-center items-center rounded-[3px] bg-[#043F2E] disabled:opacity-40 hover:bg-[#065f46] transition-colors"
                >
                  <Image src={ArrwoRight} alt="next" width={5} height={5} />
                </button>
              </div>

              <div className="w-[400px] h-full border-b border-black flex">
                <div
                  className={`w-[150px] border-r border-black ${tajawal.className} font-bold text-[15px] text-[#043F2E] flex justify-center items-center`}
                >
                  المجموعة
                </div>
                <div
                  className={`w-[250px] ${tajawal.className} font-bold text-[15px] text-[#043F2E] flex justify-center items-center`}
                >
                  الاسم
                </div>
              </div>
            </div>

            {/* Category Header */}
            <div className="relative w-full h-8 flex">
              <div className="relative w-[200px] pr-3 border-b border-r border-black flex justify-end items-center gap-2">
                <Image src={Mask1} alt="Previous Week" fill className="object-cover" />
              </div>

              <div className="flex-1 flex justify-center items-center h-full border-b border-r border-black">
                {data?.categories?.map((category: Category) => (
                  <div
                    key={category.id}
                    className={`flex-1 flex h-full justify-center items-center border-r border-black ${tajawal.className} text-[12px] font-bold text-[#043F2E] px-1 text-center`}
                  >
                    {category.name}
                  </div>
                ))}
              </div>

              <div className="relative w-[400px] h-full border-b border-black flex">
                <div className="absolute w-full h-8 top-0 left-0 z-10">
                  <Image src={Mask2} alt="Next Week" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* User Rows */}
            {!data?.users || data.users.length === 0 ? (
              <div className="relative w-full h-32 flex justify-center items-center">
                <p className={`${tajawal.className} text-2xl font-bold text-[#043F2E]`}>
                  لا يوجد أشخاص
                </p>
              </div>
            ) : (
              data.users.map((user) => {
                if (user?.groups?.includes("Student")) {
                  return (
                    <UserRow
                      key={user.id}
                      userId={user.id}
                      points={data.points.points} // ✅ Pass UserPoints[] array
                      firstname={user.first_name}
                      lastname={user.last_name}
                      supervisor={user.supervisor}
                      categories={data.categories}
                      setLoading={setLoading}
                      weekIndex={weekIndex}
                      fetchWeekData={fetchWeekData}
                      loading={loading}
                      currentYear={year}
                      currentMonth={month}
                      currentWeek={currentWeek}
                    />
                  );
                }
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
