"use client";

import React from "react";
import GoalsClient from "./GoalsClient";
import PerformanceBoardClient from "./PerformanceBoardClient";
import { getLeaderboardData } from "@/actions/PerformanceBoard";
import { getPreviousHijriMonth } from "@/lib/utils";
import type { Goal } from "@/actions/goal";

interface LeaderboardUser {
  id: number;
  name: string;
  username: string;
  points: number;
  groups: string[];
}

interface Props {
  initialYear: number;
  initialMonth: number;
  initialLeaderboardData: LeaderboardUser[];
  initialPreviousRanks: Record<number, number>;
  goals: Goal[];
}

export default function DashboardContainer({
  initialYear,
  initialMonth,
  initialLeaderboardData,
  initialPreviousRanks,
  goals,
}: Props) {
  // Keep reference for the "Next" limit
  const [currentMonth] = React.useState(initialMonth);
  const [currentYear] = React.useState(initialYear);
  const [month, setMonth] = React.useState(initialMonth);
  const [year, setYear] = React.useState(initialYear);

  const [leaderboardData, setLeaderboardData] =
    React.useState<LeaderboardUser[]>(initialLeaderboardData);
  const [previousRanks, setPreviousRanks] =
    React.useState<Record<number, number>>(initialPreviousRanks);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadMonth = React.useCallback(async (targetYear: number, targetMonth: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const prev = getPreviousHijriMonth(targetYear, targetMonth);

      const [currentResult, previousResult] = await Promise.all([
        getLeaderboardData(targetYear, targetMonth),
        getLeaderboardData(prev.year, prev.month),
      ]);

      if (currentResult.success) setLeaderboardData(currentResult.data);

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
      console.error("fetch error", err);
      setError("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The month we land on is already on screen from the server render — only a
  // navigation to a different month needs a client-side fetch.
  const goToMonth = React.useCallback(
    (targetYear: number, targetMonth: number) => {
      setYear(targetYear);
      setMonth(targetMonth);

      if (targetYear === initialYear && targetMonth === initialMonth) {
        setLeaderboardData(initialLeaderboardData);
        setPreviousRanks(initialPreviousRanks);
        setError(null);
        return;
      }

      loadMonth(targetYear, targetMonth);
    },
    [initialYear, initialMonth, initialLeaderboardData, initialPreviousRanks, loadMonth],
  );

  const canGoNext = () => {
    if (year < currentYear) return true;
    if (year === currentYear) return month < currentMonth;
    return false; // year > currentYear shouldn't happen, but guard anyway
  };

  const handlePreviousMonth = () => {
    if (isLoading) return;
    if (month === 1) {
      goToMonth(year - 1, 12);
    } else {
      goToMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (isLoading || !canGoNext()) return;
    if (month === 12) {
      goToMonth(year + 1, 1);
    } else {
      goToMonth(year, month + 1);
    }
  };

  return (
    <div className="w-full h-full flex items-start gap-10 justify-center px-5 max-lg:flex-col-reverse">
      <GoalsClient goals={goals} />
      <PerformanceBoardClient
        leaderboardData={leaderboardData}
        isLoading={isLoading}
        error={error}
        canGoNext={canGoNext()}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onRetry={() => loadMonth(year, month)}
        month={month}
        year={year}
        previousRanks={previousRanks}
      />
    </div>
  );
}
