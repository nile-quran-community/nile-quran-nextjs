import type { Metadata } from "next";
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import DashboardContainer from "@/components/Home/DashboardContainer";
import { getLeaderboardData } from "@/actions/PerformanceBoard";
import { getGoalOfTheMonth } from "@/actions/goal";
import { getPreviousHijriMonth } from "@/lib/utils";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";

export const metadata: Metadata = {
  title: "الصفحة الرئيسية | مقرأة النيل",
  description:
    "تابع هدف الشهر وتقدمك في الحفظ والتسميع، وشارك مجتمعك في المسابقة الشهرية على منصة مقرأة النيل.",
  robots: { index: false, follow: false },
};

export default async function Home() {
  const isValid = await checkTokenValidity();

  if (!isValid.isValid) {
    redirect("/auth");
  }

  // The dashboard opens on the current Hijri month, so it's fetched server-side
  // instead of shipping an empty shell that fetches it after hydration.
  const today = new Date();
  const hijriToday = gregorianToHijri({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
  const prevMonth = getPreviousHijriMonth(hijriToday.year, hijriToday.month);

  const [currentResult, previousResult, goalResult] = await Promise.all([
    getLeaderboardData(hijriToday.year, hijriToday.month),
    getLeaderboardData(prevMonth.year, prevMonth.month),
    getGoalOfTheMonth(hijriToday.year, hijriToday.month),
  ]);

  // The API returns Students only, pre-sorted by points, so these ranks align
  // exactly with the ranks the leaderboard displays.
  const previousRanks: Record<number, number> = {};
  if (previousResult.success) {
    previousResult.data.forEach((user, idx) => {
      previousRanks[user.id] = idx + 1;
    });
  }

  return (
    <div className="w-full  bg-[#EBF0EB] min-h-screen py-8">
      <DashboardContainer
        initialYear={hijriToday.year}
        initialMonth={hijriToday.month}
        initialLeaderboardData={currentResult.success ? currentResult.data : []}
        initialPreviousRanks={previousRanks}
        initialGoalData={goalResult.success ? goalResult.data : null}
      />
    </div>
  );
}
