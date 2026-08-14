"use client";

import React from "react";
import MonthGoalClient from "./MonthGoalClient";
import PerformanceBoardClient from "./PerformanceBoardClient";
import { getLeaderboardData } from "@/actions/PerformanceBoard";
import { getGoalOfTheMonth } from "@/actions/goal";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";

interface LeaderboardUser {
  id: number;
  name: string;
  username: string;
  points: number;
  groups: string[];
}

interface GoalData {
  id?: number;
  description?: string;
  target?: number;
  current?: number;
}

function getPreviousHijriMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export default function DashboardContainer() {
  const date = new Date();
  const hijriDate = gregorianToHijri({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  // 1. Move into State
  const [currentMonth] = React.useState(hijriDate.month); // Keep reference for "Next" limit
  const [currentYear] = React.useState(hijriDate.year); // Keep reference for "Next" limit
  const [month, setMonth] = React.useState(hijriDate.month);
  const [year, setYear] = React.useState(hijriDate.year);

  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardUser[]>([]);
  const [previousRanks, setPreviousRanks] = React.useState<Record<number, number>>({});
  const [goalData, setGoalData] = React.useState<GoalData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 2. Fetcher depends on state year/month
  const fetchDataForMonth = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prev = getPreviousHijriMonth(year, month);

      const [currentResult, previousResult, goalResult] = await Promise.all([
        getLeaderboardData(year, month),
        getLeaderboardData(prev.year, prev.month),
        getGoalOfTheMonth(year, month),
      ]);

      if (currentResult.success) setLeaderboardData(currentResult.data);
      if (goalResult.success) setGoalData(goalResult.data);

      if (previousResult.success) {
        // The API returns Students only, pre-sorted by points, so these ranks
        // align exactly with the ranks the leaderboard displays.
        const ranks: Record<number, number> = {};
        previousResult.data.forEach((user, idx) => {
          ranks[user.id] = idx + 1;
        });
        setPreviousRanks(ranks);
      } else {
        // No prior data (e.g. first month) → no movement shown
        setPreviousRanks({});
      }
    } catch (err) {
      console.log("fetch error", err);
      setError("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  React.useEffect(() => {
    fetchDataForMonth();
  }, [fetchDataForMonth]);

  const canGoNext = () => {
    if (year < currentYear) return true;
    if (year === currentYear) return month < currentMonth;
    return false; // year > currentYear shouldn't happen, but guard anyway
  };

  // 3. Update state to trigger re-renders
  const handlePreviousMonth = () => {
    if (isLoading) return;
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (isLoading || !canGoNext()) return;
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full h-full flex items-start gap-10 justify-center max-sm:px-5 max-sm:flex-col-reverse">
      <MonthGoalClient goalData={goalData} isLoading={isLoading} />
      <PerformanceBoardClient
        leaderboardData={leaderboardData}
        isLoading={isLoading}
        error={error}
        canGoNext={canGoNext()}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onRetry={fetchDataForMonth}
        month={month}
        year={year}
        previousRanks={previousRanks}
      />
    </div>
  );
}
