"use client";

import React from "react";
import Image from "next/image";
import Arrow from "@/public/goalArrow.png";
import { Lalezar, Tajawal } from "next/font/google";
import { Progress } from "../ui/progress";

const lalezar = Lalezar({
  subsets: ["latin"],
  weight: "400",
});

const tajawal = Tajawal({
  subsets: ["latin"],
  weight: "700",
});

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

export default function MonthGoalClient({ goalData, isLoading }: Props) {
  const calculateProgress = () => {
    if (!goalData || goalData.target === undefined || goalData.current === undefined) {
      return 0;
    }

    const { target, current } = goalData;

    if (target <= 0) return 0;

    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const progressValue = calculateProgress();

  return (
    <div
      className="relative mt-[88px] max-sm:mt-0 w-[327px] max-sm:w-full max-h-fit rounded-[17px] bg-[#043F2E] flex flex-col text-white p-4 gap-5 overflow-hidden"
      dir="rtl"
    >
      {/* Background Arrow */}
      <div className="absolute w-[283px] h-[120px] -z-10 -left-10 opacity-30">
        <div className="w-full h-full relative">
          <Image src={Arrow} alt="" fill priority />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={`text-[40px] ${lalezar.className} text-white`}>هدف الشهر</p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
          <div className="h-10 bg-white/20 rounded w-full mt-2"></div>
        </div>
      ) : (
        <>
          {/* Description */}
          <p className={`font-medium ${tajawal.className} text-white min-h-12`}>
            {goalData?.description || "لا يوجد هدف لهذا الشهر"}
          </p>

          {/* Progress Bar */}
          {goalData && goalData.target !== undefined && goalData.current !== undefined ? (
            <div className="flex flex-col gap-2">
              <Progress
                value={progressValue}
                className="h-10 bg-[#DEFF90]"
                className2="bg-[#9ADD00]"
              />
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
