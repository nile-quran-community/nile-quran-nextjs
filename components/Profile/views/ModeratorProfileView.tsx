"use client";

import { useState, useMemo } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Search,
  Users,
  TrendingUp,
  Award,
  User,
  BookOpen,
  Inbox,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toArabicDigits } from "@/lib/utils";
import type { SupervisedStudent } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  students: SupervisedStudent[];
  moderatorName: string;
}

export default function ModeratorProfileView({ students, moderatorName }: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "name">("points");

  const filtered = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        return fullName.includes(q) || s.username.toLowerCase().includes(q);
      });
    }

    if (sortBy === "points") {
      result.sort((a, b) => b.points - a.points);
    } else {
      result.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.trim();
        const nameB = `${b.first_name} ${b.last_name}`.trim();
        return nameA.localeCompare(nameB, "ar");
      });
    }

    return result;
  }, [students, search, sortBy]);

  const stats = useMemo(() => {
    const total = students.length;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const avg = total > 0 ? Math.round(totalPoints / total) : 0;
    const activeStudents = students.filter((s) => s.activities_count > 0).length;
    return { total, totalPoints, avg, activeStudents };
  }, [students]);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="الطلاب المشرف عليهم"
          value={toArabicDigits(stats.total)}
          icon={<Users className="w-5 h-5" strokeWidth={2.2} />}
          accent
        />
        <StatCard
          label="إجمالي نقاط الفريق"
          value={toArabicDigits(stats.totalPoints)}
          icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />}
        />
        <StatCard
          label="متوسط النقاط"
          value={toArabicDigits(stats.avg)}
          icon={<Award className="w-5 h-5" strokeWidth={2.2} />}
        />
        <StatCard
          label="الطلاب النشطون"
          value={toArabicDigits(stats.activeStudents)}
          icon={<BookOpen className="w-5 h-5" strokeWidth={2.2} />}
        />
      </div>

      {/* Students list */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#043F2E]/8 flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-[#043F2E]" strokeWidth={2.2} />
          <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>طلابي</h3>
          <span className={`${tajawal.className} text-xs text-[#043F2E]/50 mr-auto`}>
            تحت إشراف {moderatorName}
          </span>
        </div>

        {/* Search + Sort */}
        <div className="px-5 py-4 border-b border-[#043F2E]/8 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
              strokeWidth={2.2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن طالب بالاسم..."
              className={`${tajawal.className} w-full h-11 pr-11 pl-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors text-sm font-medium`}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1.5">
            <button
              onClick={() => setSortBy("points")}
              className={`${tajawal.className} h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                sortBy === "points"
                  ? "bg-[#043F2E] text-white"
                  : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
              }`}
            >
              الأعلى نقاطاً
            </button>
            <button
              onClick={() => setSortBy("name")}
              className={`${tajawal.className} h-8 px-3 rounded-xl text-xs font-bold transition-colors ${
                sortBy === "name"
                  ? "bg-[#043F2E] text-white"
                  : "text-[#043F2E]/60 hover:bg-[#BEE663]/30"
              }`}
            >
              الاسم
            </button>
          </div>
        </div>

        {/* Students */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
            </div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
              {search ? "لا توجد نتائج" : "لا يوجد طلاب"}
            </h3>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
              {search ? "جرب البحث بكلمة مختلفة" : "لم يتم إسناد أي طلاب لإشرافك بعد"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Desktop header */}
            <div className="hidden md:flex bg-[#F7FBEA] border-b border-[#043F2E]/10 px-5 py-3 gap-3">
              <div className="w-[44px] shrink-0" />
              <div className="w-[180px] shrink-0">
                <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الطالب</span>
              </div>
              <div className="w-[100px] shrink-0 text-center">
                <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الأنشطة</span>
              </div>
              <div className="w-[140px] shrink-0 text-center">
                <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الحضور</span>
              </div>
              <div className="flex-1 text-center">
                <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>النقاط</span>
              </div>
              <div className="w-[120px] shrink-0 text-center">
                <span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>عرض الملف</span>
              </div>
            </div>

            {filtered.map((student, idx) => {
              const fullName = `${student.first_name} ${student.last_name}`.trim();
              const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
              const attendance = Math.min(Math.round((student.activities_count / 8) * 100), 100);
              const isLast = idx === filtered.length - 1;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 px-5 py-3.5 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${
                    !isLast ? "border-b border-[#043F2E]/8" : ""
                  }`}
                >
                  {/* Avatar — circular */}
                  <div className="w-[44px] h-[44px] shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className={`${tajawal.className} text-sm font-bold`}>
                      {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="w-[180px] shrink-0 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
                      {fullName || student.username}
                    </p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>
                      @{student.username}
                    </p>
                  </div>

                  {/* Activities count */}
                  <div className="w-[100px] shrink-0 text-center">
                    <span className={`${tajawal.className} text-xs font-medium text-[#043F2E]/60`}>
                      {toArabicDigits(student.activities_count)} نشاط
                    </span>
                  </div>

                  {/* Attendance bar */}
                  <div className="w-[140px] shrink-0 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[#F7FBEA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full transition-all"
                        style={{ width: `${attendance}%` }}
                      />
                    </div>
                    <span className={`${tajawal.className} text-[10px] font-bold text-[#043F2E]/60 shrink-0`}>
                      {toArabicDigits(attendance)}٪
                    </span>
                  </div>

                  {/* Points */}
                  <div className="flex-1 flex justify-center">
                    <span
                      className={`${tajawal.className} min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${
                        student.points > 0
                          ? "bg-[#BEE663] text-[#043F2E]"
                          : "bg-[#F7FBEA] text-[#043F2E]/40"
                      }`}
                    >
                      {toArabicDigits(student.points)}
                    </span>
                  </div>

                  {/* View Profile button */}
                  <div className="w-[120px] shrink-0 flex justify-center">
                    <Link
                      href={`/profile/${student.id}`}
                      className={`${tajawal.className} inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#043F2E] text-white text-xs font-bold hover:bg-[#065f46] transition-colors`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
                      عرض الملف
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3 p-4">
              {filtered.map((student) => {
                const fullName = `${student.first_name} ${student.last_name}`.trim();
                const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
                const attendance = Math.min(Math.round((student.activities_count / 8) * 100), 100);

                return (
                  <div
                    key={student.id}
                    className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/10 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                        <span className={`${tajawal.className} text-base font-bold`}>
                          {initials || <User className="w-5 h-5" strokeWidth={2.2} />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${tajawal.className} text-base font-bold text-[#043F2E] truncate`}>
                          {fullName || student.username}
                        </p>
                        <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>
                          @{student.username}
                        </p>
                      </div>
                      <span
                        className={`${tajawal.className} shrink-0 min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${
                          student.points > 0
                            ? "bg-[#BEE663] text-[#043F2E]"
                            : "bg-white text-[#043F2E]/40 border border-[#043F2E]/10"
                        }`}
                      >
                        {toArabicDigits(student.points)}
                      </span>
                    </div>

                    {/* Attendance */}
                    <div className="flex items-center gap-2">
                      <span className={`${tajawal.className} text-[11px] text-[#043F2E]/50 shrink-0`}>الحضور</span>
                      <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full"
                          style={{ width: `${attendance}%` }}
                        />
                      </div>
                      <span className={`${tajawal.className} text-[10px] font-bold text-[#043F2E]/60`}>
                        {toArabicDigits(attendance)}٪
                      </span>
                    </div>

                    <Link
                      href={`/profile/${student.id}`}
                      className={`${tajawal.className} flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#043F2E] text-white text-xs font-bold hover:bg-[#065f46] transition-colors`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.4} />
                      عرض الملف الشخصي
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${
        accent
          ? "bg-[#043F2E] text-[#BEE663] border-[#043F2E]/15"
          : "bg-white text-[#043F2E] border-[#043F2E]/10 shadow-sm"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-white/10" : "bg-[#F7FBEA]"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium opacity-70`}>{label}</span>
        <span className={`${lalezar.className} text-2xl leading-tight`}>{value}</span>
      </div>
    </div>
  );
}
