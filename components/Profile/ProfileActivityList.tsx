"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Calendar, Inbox } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";

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

export default function ProfileActivityList({ activities, emptyMessage }: Props) {
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-[#043F2E]/40" strokeWidth={1.8} />
          </div>
          <h3 className={`${lalezar.className} text-lg text-[#043F2E] mb-1`}>
            {emptyMessage || "لا توجد أنشطة"}
          </h3>
        </div>
      ) : (
        activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 p-3.5 hover:border-[#043F2E]/20 transition-colors"
          >
            {/* Category badge */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
              <span className={`${tajawal.className} text-xs font-bold`}>
                {toArabicDigits(activity.category)}
              </span>
            </div>

            {/* Activity info */}
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
                {activity.category_name || `تصنيف ${toArabicDigits(activity.category)}`}
              </p>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#043F2E]/40" strokeWidth={2.2} />
                <span className={`${tajawal.className} text-xs text-[#043F2E]/50`}>
                  {formatDateArabic(activity.date)}
                </span>
              </div>
            </div>

            {/* Multiplier */}
            {activity.multiplier > 1 && (
              <span className={`${tajawal.className} shrink-0 text-[11px] font-bold text-[#043F2E] bg-[#BEE663] rounded-full px-2 py-0.5`}>
                ×{toArabicDigits(activity.multiplier)}
              </span>
            )}

            {/* Points */}
            {activity.points !== undefined && (
              <div className={`${tajawal.className} shrink-0 min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm bg-[#BEE663] text-[#043F2E]`}>
                +{toArabicDigits(activity.points)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
