"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Inbox,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getUsers, getCategories, getPoints } from "@/actions/ControlBoard";
import UserRow from "./userRow";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import { getHijriMonth, toArabicDigits } from "@/lib/utils";

// 🟢 Fonts
const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

// 🟢 Types
type Category = { id: number; name: string };
type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  groups: string[];
  points: number;
  supervisor: string | null;
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
  multiplier: number;
};

export interface ControlPanelData {
  users: User[];
  categories: Category[];
  points: PointsResponse;
  error?: string | unknown;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [supervisors, setSupervisors] = useState<User[]>([]);

  const categoriesRef = useRef<Category[]>([]);

  const fetchWeekData = useCallback(
    async (week: number) => {
      try {
        const [usersRes, categories, pointsRes, supervisorsRes] = await Promise.all([
          getUsers(year, month, week, "Student"),
          categoriesRef.current.length > 0
            ? Promise.resolve(categoriesRef.current)
            : fetchCategoriesCached(),
          getPoints(year, month, week),
          getUsers(year, month, week, "Supervisor"),
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

          if (pointsRes && pointsRes.success) {
            const raw = pointsRes.points;
            newData.points = {
              points: Array.isArray(raw) ? raw : (raw as { results?: UserPoints[] })?.results || [],
            };
          }

          newData.categories = categories;

          return newData;
        });

        if (supervisorsRes && supervisorsRes.success) {
          const rawSupervisors = supervisorsRes.users;
          setSupervisors(
            Array.isArray(rawSupervisors) ? rawSupervisors : rawSupervisors?.results || [],
          );
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setData((prev) => ({ ...prev, error: "System error loading data" }));
      }
    },
    [year, month],
  );

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

  // 🟢 Filtered & sorted users (by points desc)
  const filteredUsers = useMemo(() => {
    const students = data?.users || [];

    if (!searchQuery.trim()) return students;

    const q = searchQuery.trim().toLowerCase();
    return students.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const supervisorUser = supervisors.find((s) => s.username === u.supervisor);
      const supervisorName = supervisorUser
        ? `${supervisorUser.first_name} ${supervisorUser.last_name}`.toLowerCase()
        : "";
      return fullName.includes(q) || supervisorName.includes(q);
    });
  }, [data?.users, searchQuery, supervisors]);

  // 🟢 Summary statistics
  const summary = useMemo(() => {
    const students = data?.users || [];

    const totalStudents = students.length;
    const totalPoints = data.points?.points?.reduce((sum, p) => sum + (p.points || 0), 0);
    const activeStudents =
      data.points?.points?.filter((p) => (p.activities?.length || 0) > 0).length || 0;
    const completionRate =
      totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

    return { totalStudents, totalPoints, activeStudents, completionRate };
  }, [data?.users, data.points]);

  return (
    <div className="relative flex flex-col min-h-screen bg-[#EBF0EB]" dir="rtl">
      {/* 🟢 Hero Header */}
      <div className="relative w-full bg-[#043F2E] overflow-hidden">
        {/* Decorative geometric accents */}
        <div
          aria-hidden
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#BEE663]/10 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-[#BEE663]/5 blur-3xl"
        />

        <div className="relative container mx-auto px-6 lg:px-12 py-10 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#BEE663] flex items-center justify-center shadow-md">
                <Sparkles className="w-7 h-7 text-[#043F2E]" strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <h1
                  className={`${lalezar.className} text-3xl md:text-4xl text-white leading-tight`}
                >
                  لوحة التحكم
                </h1>
                <p
                  className={`${tajawal.className} text-sm md:text-base text-[#BEE663]/80 font-medium`}
                >
                  إدارة نقاط الطلاب والمتابعة الأسبوعية
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 Main content */}
      <div className="container mx-auto px-4 lg:px-12 -mt-6 pb-12 relative z-10 flex flex-col gap-6">
        {/* 🟢 Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryStat
            icon={<Users className="w-5 h-5" strokeWidth={2.2} />}
            label="إجمالي الطلاب"
            value={toArabicDigits(summary.totalStudents)}
            tone="primary"
            loading={loading}
          />
          <SummaryStat
            icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />}
            label="إجمالي النقاط"
            value={toArabicDigits(summary.totalPoints)}
            tone="accent"
            loading={loading}
          />
          <SummaryStat
            icon={<CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />}
            label="الطلاب النشطون"
            value={toArabicDigits(summary.activeStudents)}
            tone="muted"
            loading={loading}
          />
          <SummaryStat
            icon={<Sparkles className="w-5 h-5" strokeWidth={2.2} />}
            label="نسبة الإنجاز"
            value={`${toArabicDigits(summary.completionRate)}٪`}
            tone="primary"
            loading={loading}
          />
        </div>

        {/* 🟢 Filter + Progress card */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm p-5 md:p-6 flex flex-col gap-5">
          {/* Month progress */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`${lalezar.className} text-2xl md:text-[28px] text-[#043F2E] leading-none`}
                >
                  {getHijriMonth(month - 1)} <span className="text-[#043F2E]/40">—</span>{" "}
                  {toArabicDigits(year)}
                </div>
                <span className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
                  الأسبوع {weekArabicNames[weekIndex - 1]}
                </span>
              </div>
            </div>

            <Progress
              value={(weekIndex / 5) * 100}
              className="h-3 bg-[#DEFF90]"
              className2="bg-[#9ADD00]"
            />

            {/* Week dots */}
            <div className="flex items-center justify-between px-1">
              {weekArabicNames.map((name, idx) => {
                const isActive = idx + 1 === weekIndex;
                const isPast = idx + 1 < weekIndex;
                return (
                  <div key={name} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full transition-all ${
                        isActive
                          ? "bg-[#9ADD00] ring-4 ring-[#BEE663]/40 scale-110"
                          : isPast
                            ? "bg-[#9ADD00]"
                            : "bg-[#DEFF90]"
                      }`}
                    />
                    <span
                      className={`${tajawal.className} text-[11px] md:text-xs font-medium ${
                        isActive ? "text-[#043F2E]" : "text-[#043F2E]/40"
                      }`}
                    >
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#043F2E]/10" />

          {/* Search + Navigation */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
                strokeWidth={2.2}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طالب أو مشرف..."
                className={`${tajawal.className} w-full h-12 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
              />
            </div>

            {/* Week navigation */}
            <div className="flex justify-between items-center gap-2 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5">
              <button
                onClick={() => handleWeekChange("prev")}
                disabled={loading}
                aria-label="الأسبوع السابق"
                className="w-10 h-10 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.4} />
              </button>

              <div
                className={`${tajawal.className} px-4 min-w-[120px] text-center text-sm font-bold text-[#043F2E]`}
              >
                الأسبوع {weekArabicNames[weekIndex - 1]}
              </div>

              <button
                onClick={() => handleWeekChange("next")}
                disabled={loading}
                aria-label="الأسبوع التالي"
                className="w-10 h-10 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>

        {/* 🟢 Table Card */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/15 shadow-sm overflow-hidden">
          {/* Table Header (sticky) */}
          <div className="hidden lg:block">
            {data.categories.length > 0 && <TableHeader categories={data.categories} />}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="p-4 md:p-6 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 md:h-14 rounded-2xl bg-[#F7FBEA] animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
              </div>
              <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
                {searchQuery ? "لا توجد نتائج" : "لا يوجد طلاب"}
              </h3>
              <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
                {searchQuery ? "جرب البحث بكلمة مختلفة" : "لم يتم العثور على طلاب لهذا الأسبوع"}
              </p>
            </div>
          )}

          {/* Desktop table rows */}
          {!loading && filteredUsers.length > 0 && (
            <div className="hidden lg:flex flex-col">
              {filteredUsers.map((user, index) => (
                <UserRow
                  key={user.id}
                  variant="desktop"
                  isLast={index === filteredUsers.length - 1}
                  userId={user.id}
                  points={data.points.points}
                  firstname={user.first_name}
                  lastname={user.last_name}
                  supervisor={user.supervisor}
                  supervisors={supervisors}
                  categories={data.categories}
                  setLoading={setLoading}
                  weekIndex={weekIndex}
                  fetchWeekData={fetchWeekData}
                  loading={loading}
                  currentYear={year}
                  currentMonth={month}
                  currentWeek={currentWeek}
                />
              ))}
            </div>
          )}

          {/* Mobile cards */}
          {!loading && filteredUsers.length > 0 && (
            <div className="lg:hidden flex flex-col gap-3 p-4">
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  variant="mobile"
                  userId={user.id}
                  points={data.points.points}
                  firstname={user.first_name}
                  lastname={user.last_name}
                  supervisor={user.supervisor}
                  supervisors={supervisors}
                  categories={data.categories}
                  setLoading={setLoading}
                  weekIndex={weekIndex}
                  fetchWeekData={fetchWeekData}
                  loading={loading}
                  currentYear={year}
                  currentMonth={month}
                  currentWeek={currentWeek}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// 🟢 Summary Stat Card
// ============================
function SummaryStat({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "primary" | "accent" | "muted";
  loading: boolean;
}) {
  const toneClasses = {
    primary: "bg-[#043F2E] text-white",
    accent: "bg-[#BEE663] text-[#043F2E]",
    muted: "bg-[#F7FBEA] text-[#043F2E]",
  };

  return (
    <div
      className={`${toneClasses[tone]} rounded-2xl px-4 py-4 md:px-5 md:py-5 shadow-sm border border-[#043F2E]/10 flex items-center gap-3 md:gap-4 transition-transform hover:scale-[1.01]`}
    >
      <div
        className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
          tone === "primary"
            ? "bg-white/10"
            : tone === "accent"
              ? "bg-[#043F2E]/10"
              : "bg-[#043F2E]/5"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className={`${tajawal.className} text-[11px] md:text-xs font-medium opacity-80 truncate`}
        >
          {label}
        </span>
        {loading ? (
          <div className="h-6 md:h-7 w-12 mt-1 rounded-md bg-current/20 animate-pulse" />
        ) : (
          <span className={`${lalezar.className} text-2xl md:text-[28px] leading-tight`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================
// 🟢 Table Header (desktop)
// ============================
function TableHeader({ categories }: { categories: Category[] }) {
  return (
    <div className="bg-[#F7FBEA] border-b border-[#043F2E]/10 px-4 py-3 flex items-center gap-3">
      {/* Student avatar column header */}
      <div className="w-[44px] shrink-0" />

      {/* Name */}
      <div className="w-[150px] shrink-0">
        <HeaderLabel>الاسم</HeaderLabel>
      </div>

      {/* Group */}
      <div className="w-[120px] shrink-0">
        <HeaderLabel>المجموعة</HeaderLabel>
      </div>

      {/* Categories */}
      <div className="flex-1 flex items-start gap-1 min-w-0">
        {[...categories]
          .sort((a, b) => (a.id === 5 ? 1 : b.id === 5 ? -1 : 0))
          .map((cat) => (
            <div
              key={cat.id}
              className={`${tajawal.className} flex-1 min-w-0 text-center text-[11px] font-bold text-[#043F2E] px-1 leading-tight break-words`}
            >
              {cat.name}
            </div>
          ))}
      </div>

      {/* Total */}
      <div className="w-[90px] shrink-0">
        <HeaderLabel>مجموع الأسبوع</HeaderLabel>
      </div>
    </div>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E] block truncate`}>
      {children}
    </span>
  );
}
