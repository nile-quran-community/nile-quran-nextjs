"use client";

import React from "react";
import Image from "next/image";
import Arrow from "@/public/goalArrow.png";
import { Lalezar, Tajawal } from "next/font/google";
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
    <div
      className="relative mt-[88px] max-sm:mt-0 w-[327px] max-sm:w-full max-h-fit rounded-[17px] bg-[#043F2E] flex flex-col text-white p-4 gap-4 overflow-hidden"
      dir="rtl"
    >
      {/* Background Arrow */}
      <div className="absolute w-[283px] h-[120px] -z-10 -left-10 opacity-30 pointer-events-none">
        <div className="w-full h-full relative">
          <Image src={Arrow} alt="" fill priority />
        </div>
      </div>

      {/* Header */}
      <p className={`text-[40px] ${lalezar.className} text-white leading-none`}>هدف الشهر</p>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-3/4" />
          <div className="h-4 bg-white/20 rounded w-1/2" />
          <div className="h-10 bg-white/20 rounded w-full mt-2" />
        </div>
      ) : (
        <>
          {/* Description */}
          <p
            className={`${tajawal.className} font-medium text-white min-h-12 text-[15px] leading-relaxed`}
          >
            {goalData?.description || "لا يوجد هدف لهذا الشهر"}
          </p>

          {/* Progress Bar + Numbers */}
          {hasData ? (
            <div className="flex flex-col gap-2.5">
              <Progress
                value={progressValue}
                className="h-10 bg-[#DEFF90]"
                className2="bg-[#9ADD00]"
              />
              <div
                className={`${tajawal.className} flex items-center justify-between text-sm font-bold`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-[#BEE663] text-lg leading-none">
                    {formatNumber(current!)}
                  </span>
                  <span className="text-white/60 text-xs font-medium">
                    من {formatNumber(target!)}
                  </span>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs ${
                    isComplete ? "bg-[#BEE663] text-[#043F2E]" : "bg-white/10 text-white/80"
                  }`}
                >
                  {formatNumber(Math.round(progressValue))}٪
                </div>
              </div>
            </div>
          ) : (
            <div className="h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/50 text-sm">لا توجد بيانات للتقدم</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
