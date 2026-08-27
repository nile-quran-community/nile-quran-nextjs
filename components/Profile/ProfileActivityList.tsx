"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Calendar, Inbox } from "lucide-react";
import { toArabicDigits, formatHijriDate } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface ActivityItem {
  id: number;
  category: number;
  category_name?: string;
  date: string;
  multiplier: number;
  points?: number;
}

interface Props {
  activities: ActivityItem[];
  emptyMessage?: string;
}

export default function ProfileActivityList({ activities, emptyMessage }: Props) {
  return (
    <div className="flex flex-col gap-2.5" dir="rtl">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-[#043F2E]/50" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
            {emptyMessage || "لا توجد أنشطة"}
          </p>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 hover:border-[#043F2E]/20 transition-colors motion-reduce:transition-none"
          >
            {/* What it was, and when. The category id used to be printed in a dark
                chip here, which read as a quantity and told a member nothing. */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
                {activity.category_name || "نشاط"}
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#043F2E]/60" strokeWidth={2.2} aria-hidden="true" />
                <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
                  {formatHijriDate(activity.date)}
                  {activity.multiplier > 1 && ` · ${toArabicDigits(activity.multiplier)} مرات`}
                </span>
              </div>
            </div>

            {/* A plain figure, not a lime pill: this list sits under a card that
                already owns the screen's one emphasis surface. */}
            {activity.points !== undefined && (
              <span className={`${lalezar.className} shrink-0 text-lg text-[#043F2E] leading-none`}>
                +{toArabicDigits(activity.points)}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
