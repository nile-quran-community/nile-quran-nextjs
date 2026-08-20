"use client";

import { Lalezar, Tajawal } from "next/font/google";
import {
  Sparkles,
  Target,
  Trophy,
  Activity,
  TrendingUp,
  BookOpen,
  Award,
  UserCheck,
  UserPlus,
  Calendar,
} from "lucide-react";
import ProfileActivityList from "../ProfileActivityList";
import { toArabicDigits, getHijriMonth } from "@/lib/utils";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import type { UserActivity } from "@/lib/profile-types";
import Link from "next/link";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  points: number;
  activities: UserActivity[];
  rank?: number | null;
  supervisorName?: string;
  supervisorId?: number | null;
  referrerName?: string;
  dateJoined?: string;
}

function formatDateArabic(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    return `${toArabicDigits(d.getDate())} ${months[d.getMonth()]} ${toArabicDigits(d.getFullYear())}`;
  } catch {
    return dateStr;
  }
}

export default function StudentProfileView({
  points,
  activities,
  rank,
  supervisorName,
  supervisorId,
  referrerName,
  dateJoined,
}: Props) {
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const now = new Date();
  const hijriDate = gregorianToHijri({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
  const monthLabel = `${getHijriMonth(hijriDate.month - 1)} ${toArabicDigits(hijriDate.year)}`;

  // Group activities by category
  const categoryMap = new Map<number, { count: number; points: number; name?: string }>();
  for (const a of activities) {
    const existing = categoryMap.get(a.category) || { count: 0, points: 0, name: a.category_name };
    existing.count++;
    existing.points += a.points || 0;
    categoryMap.set(a.category, existing);
  }

  // Calculate attendance: activities with category_name containing "حضور"
  const attendanceActivities = activities.filter(
    (a) => a.category_name?.includes("حضور") || a.category_name?.includes("اجتماع")
  );
  // Assume ~4 sessions per month as baseline for percentage
  const attendanceBaseline = 4;
  const attendancePercent = Math.min(
    Math.round((attendanceActivities.length / attendanceBaseline) * 100),
    100
  );

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Hero stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HeroStat
          label="نقاطي"
          value={toArabicDigits(points)}
          icon={<Trophy className="w-5 h-5" strokeWidth={2.2} />}
          accent
        />
        <HeroStat
          label="أنشطتي"
          value={toArabicDigits(activities.length)}
          icon={<Activity className="w-5 h-5" strokeWidth={2.2} />}
        />
        <HeroStat
          label="نسبة الحضور"
          value={`${toArabicDigits(attendancePercent)}٪`}
          icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} />}
        />
        <HeroStat
          label="ترتيبي"
          value={rank ? toArabicDigits(rank) : "—"}
          icon={<Award className="w-5 h-5" strokeWidth={2.2} />}
        />
      </div>

      {/* Progress + Month info */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-l from-[#043F2E] to-[#065f46] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#BEE663] flex items-center justify-center">
              <Target className="w-4 h-4 text-[#043F2E]" strokeWidth={2.4} />
            </div>
            <div>
              <h3 className={`${lalezar.className} text-lg text-white leading-tight`}>تقدمي هذا الشهر</h3>
              <p className={`${tajawal.className} text-[11px] text-[#BEE663]/80`}>{monthLabel} هـ</p>
            </div>
          </div>
          <div className="text-left">
            <span className={`${lalezar.className} text-3xl text-[#BEE663]`}>{toArabicDigits(points)}</span>
            <span className={`${tajawal.className} text-xs text-white/60 mr-1`}>نقطة</span>
          </div>
        </div>

        {/* Attendance progress bar */}
        <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>نسبة الحضور</span>
            <span className={`${tajawal.className} text-xs font-bold text-[#043F2E]`}>
              {toArabicDigits(attendancePercent)}٪
            </span>
          </div>
          <div className="h-2.5 bg-[#F7FBEA] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full transition-all"
              style={{ width: `${attendancePercent}%` }}
            />
          </div>
        </div>

        {/* Category breakdown */}
        {categoryMap.size > 0 && (
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-[#043F2E]/60" strokeWidth={2.2} />
              <h4 className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>تفصيل الأنشطة</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Array.from(categoryMap.entries()).map(([catId, info]) => (
                <div
                  key={catId}
                  className="flex items-center justify-between bg-[#F7FBEA] rounded-xl border border-[#043F2E]/8 px-4 py-2.5"
                >
                  <span className={`${tajawal.className} text-xs font-medium text-[#043F2E]/70 truncate`}>
                    {info.name || `تصنيف ${toArabicDigits(catId)}`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`${tajawal.className} text-[10px] text-[#043F2E]/50`}>
                      {toArabicDigits(info.count)} نشاط
                    </span>
                    <span className={`${tajawal.className} text-xs font-bold text-[#043F2E] bg-[#BEE663] rounded-full px-2 py-0.5`}>
                      +{toArabicDigits(info.points)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info section — supervisor, referrer, date joined */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6">
        <h3 className={`${lalezar.className} text-lg text-[#043F2E] mb-4`}>معلومات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {supervisorName && (
            supervisorId ? (
              <Link href={`/profile/${supervisorId}`} className="block">
                <InfoCard
                  icon={<UserCheck className="w-4 h-4" strokeWidth={2.2} />}
                  label="المشرف"
                  value={supervisorName}
                  clickable
                />
              </Link>
            ) : (
              <InfoCard
                icon={<UserCheck className="w-4 h-4" strokeWidth={2.2} />}
                label="المشرف"
                value={supervisorName}
              />
            )
          )}
          {referrerName && (
            <InfoCard
              icon={<UserPlus className="w-4 h-4" strokeWidth={2.2} />}
              label="الجهة المرجعة"
              value={referrerName}
            />
          )}
          {dateJoined && (
            <InfoCard
              icon={<Calendar className="w-4 h-4" strokeWidth={2.2} />}
              label="تاريخ الانضمام"
              value={formatDateArabic(dateJoined)}
            />
          )}
        </div>
      </div>

      {/* Recent activities */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
              <Sparkles className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>آخر الأنشطة</h3>
          </div>
          <span className={`${tajawal.className} text-xs text-[#043F2E]/40`}>
            {toArabicDigits(recentActivities.length)} من {toArabicDigits(activities.length)}
          </span>
        </div>
        <ProfileActivityList
          activities={recentActivities}
          emptyMessage="لم تسجل أي نشاط بعد"
        />
      </div>
    </div>
  );
}

// ============================
// Hero Stat Card
// ============================
function HeroStat({
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

// ============================
// Info Card (supervisor / referrer / date)
// ============================
function InfoCard({
  icon,
  label,
  value,
  clickable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  clickable?: boolean;
}) {
  return (
    <div
      className={`bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 flex items-center gap-3 transition-colors ${
        clickable ? "hover:border-[#043F2E]/30 hover:bg-white cursor-pointer" : ""
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-[#043F2E]/5 flex items-center justify-center shrink-0 text-[#043F2E]/70">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>{label}</span>
        <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate ${clickable ? "hover:underline" : ""}`}>{value}</span>
      </div>
    </div>
  );
}
