"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Users, BookOpen, TrendingUp, Inbox } from "lucide-react";
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
  const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
  const activeStudents = students.filter((s) => s.activities_count > 0).length;
  const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="الطلاب المشرف عليهم" value={toArabicDigits(students.length)} icon={<Users className="w-4 h-4" strokeWidth={2.2} />} accent />
        <StatCard label="إجمالي نقاطهم" value={toArabicDigits(totalPoints)} icon={<TrendingUp className="w-4 h-4" strokeWidth={2.2} />} />
        <StatCard label="الطلاب النشطون" value={toArabicDigits(activeStudents)} icon={<BookOpen className="w-4 h-4" strokeWidth={2.2} />} />
        <StatCard label="متوسط النقاط" value={toArabicDigits(avgPoints)} icon={<TrendingUp className="w-4 h-4" strokeWidth={2.2} />} />
      </div>

      {/* Students list */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#043F2E]/8 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#043F2E]" strokeWidth={2.2} />
          <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>طلابك</h3>
          <span className={`${tajawal.className} text-xs text-[#043F2E]/50 mr-auto`}>
            تحت إشراف {moderatorName}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
            </div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>لا يوجد طلاب</h3>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
              لم يتم إسناد أي طلاب لإشرافك بعد
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Desktop header */}
            <div className="hidden md:flex bg-[#F7FBEA] border-b border-[#043F2E]/10 px-4 py-3 gap-3">
              <div className="w-[44px] shrink-0" />
              <div className="w-[160px] shrink-0"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الاسم</span></div>
              <div className="flex-1"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>الأنشطة</span></div>
              <div className="w-[90px] shrink-0 text-center"><span className={`${tajawal.className} text-[12px] font-bold text-[#043F2E]`}>النقاط</span></div>
            </div>

            {students.map((student, idx) => {
              const fullName = `${student.first_name} ${student.last_name}`.trim();
              const initials = `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
              const isLast = idx === students.length - 1;

              return (
                <Link
                  key={student.id}
                  href={`/profile/${student.id}`}
                  className={`flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${!isLast ? "border-b border-[#043F2E]/8" : ""} cursor-pointer`}
                >
                  <div className="w-[44px] h-[44px] shrink-0 rounded-xl bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
                    <span className={`${tajawal.className} text-sm font-bold`}>{initials || "؟"}</span>
                  </div>
                  <div className="w-[160px] shrink-0 min-w-0">
                    <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>{fullName || student.username}</p>
                    <p className={`${tajawal.className} text-[10px] text-[#043F2E]/40`}>@{student.username}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`${tajawal.className} text-xs text-[#043F2E]/60`}>
                      {toArabicDigits(student.activities_count)} نشاط
                    </span>
                  </div>
                  <div className="w-[90px] shrink-0 flex justify-center">
                    <span className={`${tajawal.className} min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${student.points > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"}`}>
                      {toArabicDigits(student.points)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${accent ? "bg-[#BEE663] border-[#043F2E]/15 text-[#043F2E]" : "bg-[#F7FBEA] border-[#043F2E]/8 text-[#043F2E]"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ? "bg-[#043F2E]/10" : "bg-[#043F2E]/5"}`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium opacity-80`}>{label}</span>
        <span className={`${lalezar.className} text-xl leading-tight`}>{value}</span>
      </div>
    </div>
  );
}
