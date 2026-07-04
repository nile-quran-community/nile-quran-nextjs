"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getHijriMonth, toArabicDigits } from "@/lib/utils";
import { Lalezar } from "next/font/google";

const lalezar = Lalezar({ subsets: ["latin"], weight: "400" });

interface LeaderboardUser {
  id: number;
  name: string;
  username: string;
  points: number;
  groups: string[];
}

interface Props {
  leaderboardData: LeaderboardUser[];
  isLoading: boolean;
  error: string | null;
  canGoNext: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onRetry: () => void;
  month: number;
  year: number;
}

export default function PerformanceBoardClient({
  leaderboardData,
  isLoading,
  error,
  canGoNext,
  month,
  year,
  onPreviousMonth,
  onNextMonth,
  onRetry,
}: Props) {
  const monthIndex = month - 1;
  const sortedData = [...leaderboardData].sort((a, b) => a.points - b.points);

  const maxPoints =
    sortedData.length > 0 ? Math.max(...sortedData.map((u) => u.points)) : 0;
  const minPoints =
    sortedData.length > 0 ? Math.min(...sortedData.map((u) => u.points)) : 0;

  const getBarColors = (points: number) => {
    if (sortedData.length === 1) {
      return "bg-[#9ADD00] border-2 border-[#043F2E]";
    }
    if (points === maxPoints) {
      return "bg-[#9ADD00] border-2 border-[#043F2E]";
    } else if (points === minPoints) {
      return "bg-[#B4C197] border-2 border-[#043F2E]";
    } else {
      return "bg-[#B5CF7C] border-2 border-[#043F2E]";
    }
  };

  const NavigationButtons = () => (
    <div className="flex items-center justify-between w-full mt-4">
      <button
        onClick={onPreviousMonth}
        disabled={isLoading}
        className="p-2 rounded-lg bg-[#E6EECD] hover:opacity-70 cursor-pointer shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="الشهر السابق"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={onNextMonth}
        disabled={isLoading || !canGoNext}
        className="p-2 rounded-lg bg-[#E6EECD] hover:opacity-70 cursor-pointer shadow-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="الشهر التالي"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="flex items-end justify-evenly gap-4 w-full px-4 h-full max-sm:px-0 overflow-hidden">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-end gap-2 w-28"
        >
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-300 mb-2"></div>
            <div className="h-3 w-16 bg-gray-300 rounded mb-4"></div>
            <div
              className="w-20 bg-gray-200 rounded-t-lg"
              style={{ height: `${80 + index * 30}px` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div
        className="w-[800px] max-sm:w-full   p-6 h-full overflow-hidden max-sm:p-0"
        dir="rtl"
      >
        <h2
          className={`${lalezar.className} text-4xl font-bold text-center mb-8 text-[#2C5234]`}
        >
          لوحة الاداءات - {getHijriMonth(monthIndex)}-{year}
        </h2>
        <div className="bg-[#F7FBEA] rounded-xl p-8 shadow-sm border border-[#043F2E]">
          <div className="border-b-2 border-b-[#043F2E] pb-4">
            <LoadingSkeleton />
          </div>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="w-[800px] max-sm:w-full max-w-6xl  p-6 h-[530px]"
        dir="rtl"
      >
        <h2
          className={`${lalezar.className} text-4xl font-bold text-center mb-8 text-[#2C5234]`}
        >
          لوحة الاداءات - {getHijriMonth(monthIndex)} - {toArabicDigits(year)}
        </h2>
        <div className="bg-[#F7FBEA] rounded-xl p-8 shadow-sm border border-[#043F2E]">
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-red-400">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-sm">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                حاول مرة أخرى
              </button>
            </div>
          </div>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="w-[800px] max-w-6xl  p-6 h-[530px]" dir="rtl">
        <h2
          className={`${lalezar.className} text-4xl font-bold text-center mb-8 text-[#2C5234]`}
        >
          لوحة الاداءات - {getHijriMonth(monthIndex)} - {toArabicDigits(year)}
        </h2>
        <div className="bg-[#F7FBEA] rounded-xl p-8 shadow-sm border border-[#043F2E]">
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-gray-600 text-lg font-medium mb-2">
                لا توجد بيانات لعرضها
              </p>
              <p className="text-gray-400 text-sm">
                لا توجد نقاط مسجلة لهذا الشهر، جرب التنقل إلى شهر آخر
              </p>
            </div>
          </div>
          <NavigationButtons />
        </div>
      </div>
    );
  }

  return (
    <div className="w-[800px] h-full p-6 max-sm:p-0 max-sm:w-full" dir="rtl">
      <h2
        className={`${lalezar.className} text-4xl font-bold text-center mb-8 text-[#2C5234]`}
      >
        لوحة الاداءات - {getHijriMonth(monthIndex)} - {toArabicDigits(year)}
      </h2>

      <div className="bg-[#F7FBEA] rounded-xl p-8 shadow-sm relative border border-[#043F2E] ">
        <div className="w-full overflow-x-auto overflow-y-hidden max-sm:pb-4">
          <div className="relative flex items-end justify-evenly gap-8 border-b-2 border-b-[#043F2E] min-w-full w-max px-4">
            {sortedData.map((user, index) => {
              if (user?.groups?.includes("Student")) {
                const maxBarHeight = 200;
                const minBarHeight = 50;
                const normalized = maxPoints > 0 ? user.points / maxPoints : 0;
                const heightPx = Math.max(
                  normalized * maxBarHeight,
                  minBarHeight,
                );

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="flex flex-col items-center justify-end gap-2 w-28 relative"
                  >
                    <div className="flex flex-col items-center justify-end">
                      <div className="relative flex flex-col items-center">
                        <div className="flex items-end justify-center h-[280px]">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPx}px` }}
                            transition={{
                              duration: 0.6,
                              ease: "easeOut",
                              delay: index * 0.08,
                            }}
                            className={`w-20 ${getBarColors(
                              user.points,
                            )} rounded-t-lg flex items-center justify-center relative`}
                          >
                            <div className="absolute -top-20 flex flex-col items-center">
                              <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-[#9ADD00] flex items-center justify-center shadow-md">
                                <span className="text-lg font-bold text-gray-600">
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                              <p className="text-xs text-[#043F2E] font-bold mt-1 text-center whitespace-nowrap max-w-[90px] flex justify-center">
                                {user.name}
                              </p>
                            </div>

                            <span className="text-[#043F2E] font-bold text-sm whitespace-nowrap">
                              {user.points}
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }
            })}
          </div>
        </div>
        <NavigationButtons />
      </div>
    </div>
  );
}
