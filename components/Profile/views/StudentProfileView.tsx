"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Sparkles, Target } from "lucide-react";
import ProfileStats from "../ProfileStats";
import ProfileActivityList from "../ProfileActivityList";
import { toArabicDigits } from "@/lib/utils";
import type { UserActivity } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  points: number;
  activities: UserActivity[];
  rank?: number | null;
  multiplierTotal?: number;
  monthLabel?: string;
}

export default function StudentProfileView({
  points,
  activities,
  rank,
  multiplierTotal,
  monthLabel,
}: Props) {
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Stats */}
      <ProfileStats
        points={points}
        activitiesCount={activities.length}
        rank={rank}
        multiplierTotal={multiplierTotal}
      />

      {/* Progress card */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
            <Target className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>تقدمي</h3>
          {monthLabel && (
            <span className={`${tajawal.className} text-xs text-[#043F2E]/50 mr-auto`}>{monthLabel}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 p-4 flex flex-col gap-1">
            <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>نقاطي</span>
            <span className={`${lalezar.className} text-2xl text-[#043F2E]`}>{toArabicDigits(points)}</span>
          </div>
          <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 p-4 flex flex-col gap-1">
            <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>أنشطتي</span>
            <span className={`${lalezar.className} text-2xl text-[#043F2E]`}>{toArabicDigits(activities.length)}</span>
          </div>
        </div>
      </div>

      {/* Recent activities */}
      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>آخر الأنشطة</h3>
        </div>
        <ProfileActivityList
          activities={recentActivities}
          emptyMessage="لم تسجل أي نشاط بعد"
        />
      </div>
    </div>
  );
}
