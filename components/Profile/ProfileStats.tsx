"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Trophy, Activity, TrendingUp, Award } from "lucide-react";
import { toArabicDigits } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  points: number;
  activitiesCount: number;
  rank?: number | null;
  multiplierTotal?: number;
}

export default function ProfileStats({
  points,
  activitiesCount,
  rank,
  multiplierTotal,
}: Props) {
  const stats = [
    {
      label: "إجمالي النقاط",
      value: toArabicDigits(points),
      icon: <Trophy className="w-4 h-4" strokeWidth={2.2} />,
      accent: true,
    },
    {
      label: "الأنشطة",
      value: toArabicDigits(activitiesCount),
      icon: <Activity className="w-4 h-4" strokeWidth={2.2} />,
    },
    {
      label: "المضاعفات",
      value: toArabicDigits(multiplierTotal ?? 0),
      icon: <TrendingUp className="w-4 h-4" strokeWidth={2.2} />,
    },
    {
      label: "الترتيب",
      value: rank ? toArabicDigits(rank) : "—",
      icon: <Award className="w-4 h-4" strokeWidth={2.2} />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl px-4 py-4 border flex items-center gap-3 ${
            stat.accent
              ? "bg-[#BEE663] border-[#043F2E]/15 text-[#043F2E]"
              : "bg-[#F7FBEA] border-[#043F2E]/8 text-[#043F2E]"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              stat.accent ? "bg-[#043F2E]/10" : "bg-[#043F2E]/5"
            }`}
          >
            {stat.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-[11px] font-medium opacity-80`}>
              {stat.label}
            </span>
            <span className={`${lalezar.className} text-xl leading-tight`}>
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
