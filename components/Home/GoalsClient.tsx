"use client";

import { Lalezar, Tajawal } from "next/font/google";
import { Target, CheckCircle2 } from "lucide-react";
import { Progress } from "../ui/progress";
import { formatArabicNumber, getGoalProgress } from "@/lib/utils";
import type { Goal } from "@/actions/goal";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

interface Props {
  goals: Goal[];
}

export default function GoalsClient({ goals }: Props) {
  return (
    <div className="w-full lg:w-[360px] xl:w-[400px] lg:shrink-0 lg:mt-[88px]" dir="rtl">
      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
            <Target className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <h2 className={`${lalezar.className} text-2xl text-[#043F2E] leading-tight`}>
            الأهداف الحالية
          </h2>
        </div>

        <div className="h-px bg-[#043F2E]/8" />

        {goals.length === 0 ? (
          <div className="h-10 rounded-2xl bg-[#F7FBEA] border border-[#043F2E]/8 flex items-center justify-center">
            <span className={`${tajawal.className} text-[#043F2E]/50 text-sm font-medium`}>
              لا يوجد هدف قائم حالياً
            </span>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#043F2E]/8">
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GoalItem({ goal }: { goal: Goal }) {
  const { current, target, title, description } = goal;
  const hasData = target > 0;
  const progressValue = getGoalProgress(current, target);
  const isComplete = hasData && current >= target;

  return (
    <div className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className={`${lalezar.className} text-lg text-[#043F2E] leading-tight truncate`}>
          {title}
        </h3>
        {isComplete && (
          <span
            role="status"
            className={`${tajawal.className} shrink-0 flex items-center gap-1 rounded-full bg-[#DEFF90] px-2 py-0.5 text-[11px] font-bold text-[#043F2E]`}
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.6} />
            تم التحقيق
          </span>
        )}
      </div>

      {description && (
        <p
          className={`${tajawal.className} text-xs font-medium text-[#043F2E]/60 leading-relaxed line-clamp-2`}
        >
          {description}
        </p>
      )}

      {hasData ? (
        <div className="flex flex-col gap-1.5">
          <Progress value={progressValue} className="h-2 bg-[#DEFF90]" className2="bg-[#9ADD00]" />
          <div className="flex items-center justify-between">
            <span className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>
              {formatArabicNumber(current)} / {formatArabicNumber(target)}
            </span>
            <span className={`${lalezar.className} text-sm text-[#043F2E]`}>
              {formatArabicNumber(Math.round(progressValue))}٪
            </span>
          </div>
        </div>
      ) : (
        <span className={`${tajawal.className} text-xs text-[#043F2E]/50 font-medium`}>
          لا توجد بيانات للتقدم
        </span>
      )}
    </div>
  );
}
