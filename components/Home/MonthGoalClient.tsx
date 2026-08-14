"use client";

import React from "react";
import { Lalezar, Tajawal } from "next/font/google";
import { Target, Flag, TrendingUp, Percent, CheckCircle2 } from "lucide-react";
import { Progress } from "../ui/progress";
import { toArabicDigits } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

interface GoalData {
  id?: number;
  description?: string;
  target?: number;
  current?: number;
}

interface Props {
  goalData: GoalData | null;
  isLoading: boolean;
}

function formatNumber(n: number): string {
  return toArabicDigits(n.toLocaleString("en-US"));
}

export default function MonthGoalClient({ goalData, isLoading }: Props) {
  const { current, target } = goalData || {};
  const hasData = target !== undefined && current !== undefined && target > 0;
  const progressValue = hasData
    ? Math.min(Math.max(((current as number) / (target as number)) * 100, 0), 100)
    : 0;
  const isComplete = hasData && current! >= target!;

  return (
    <div className="w-full lg:w-[360px] xl:w-[400px] lg:shrink-0 lg:mt-[88px]" dir="rtl">
      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
            <Target className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span
              className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
            >
              هدف المجتمع
            </span>
            <h2 className={`${lalezar.className} text-2xl text-[#043F2E] leading-tight`}>
              هدف الشهر
            </h2>
          </div>
        </div>

        <div className="h-px bg-[#043F2E]/8" />

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Description */}
            <p
              className={`${tajawal.className} text-sm font-medium text-[#043F2E]/70 leading-relaxed min-h-12`}
            >
              {goalData?.description || "لا يوجد هدف لهذا الشهر"}
            </p>

            {hasData ? (
              <div className="flex flex-col gap-4">
                <Progress
                  value={progressValue}
                  className="h-3 bg-[#DEFF90]"
                  className2="bg-[#9ADD00]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <StatChip
                    label="المُنجَز"
                    value={formatNumber(current!)}
                    icon={<TrendingUp className="w-4 h-4" strokeWidth={2.2} />}
                  />
                  <StatChip
                    label="الهدف"
                    value={formatNumber(target!)}
                    icon={<Flag className="w-4 h-4" strokeWidth={2.2} />}
                  />
                  <StatChip
                    label="الإنجاز"
                    value={`${formatNumber(Math.round(progressValue))}٪`}
                    icon={<Percent className="w-4 h-4" strokeWidth={2.2} />}
                    accent={isComplete}
                  />
                </div>
                {isComplete && (
                  <div
                    role="status"
                    className={`${tajawal.className} flex items-center gap-2 rounded-xl bg-[#DEFF90] border border-[#9ADD00]/40 p-3 text-sm text-[#043F2E] font-bold`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.4} />
                    <span>تم تحقيق هدف هذا الشهر، تقبل الله منكم.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-10 rounded-2xl bg-[#F7FBEA] border border-[#043F2E]/8 flex items-center justify-center">
                <span className={`${tajawal.className} text-[#043F2E]/50 text-sm font-medium`}>
                  لا توجد بيانات للتقدم
                </span>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ============================
// Stat Chip
// ============================
function StatChip({
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
      className={`rounded-2xl px-3 py-3 border ${
        accent ? "bg-[#BEE663] border-[#043F2E]/15" : "bg-[#F7FBEA] border-[#043F2E]/8"
      } flex flex-col gap-1.5`}
    >
      <div
        className={`flex items-center gap-1.5 ${accent ? "text-[#043F2E]" : "text-[#043F2E]/60"}`}
      >
        {icon}
        <span className={`${tajawal.className} text-[11px] font-medium truncate`}>{label}</span>
      </div>
      <span className={`${lalezar.className} text-lg text-[#043F2E] leading-none`}>{value}</span>
    </div>
  );
}

// ============================
// Loading Skeleton (mirrors the real layout)
// ============================
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-4 bg-[#F7FBEA] rounded w-3/4" />
      <div className="h-4 bg-[#F7FBEA] rounded w-1/2" />
      <div className="h-3 bg-[#F7FBEA] rounded-full w-full mt-1" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[68px] rounded-2xl bg-[#F7FBEA]" />
        ))}
      </div>
    </div>
  );
}
