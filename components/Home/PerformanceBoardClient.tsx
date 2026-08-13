"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
  Crown,
  Sparkles,
} from "lucide-react";
import { getHijriMonth, toArabicDigits } from "@/lib/utils";
import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

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
  currentUserId?: number;
  previousRanks: Record<number, number>;
}

function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
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
  currentUserId,
  previousRanks,
}: Props) {
  const monthIndex = month - 1;

  const sortedData = React.useMemo(() => {
    return leaderboardData
      .filter((u) => u?.groups?.includes("Student"))
      .sort((a, b) => b.points - a.points);
  }, [leaderboardData]);

  const topThree = sortedData.slice(0, 3);
  const rest = sortedData.slice(3);

  // 🟢 Stats
  const stats = React.useMemo(() => {
    const total = sortedData.length;
    const totalPoints = sortedData.reduce((s, u) => s + u.points, 0);
    const topScore = sortedData[0]?.points ?? 0;
    const average = total > 0 ? Math.round(totalPoints / total) : 0;
    return { total, totalPoints, topScore, average };
  }, [sortedData]);

  // ============================
  // 🟢 Loading
  // ============================
  if (isLoading) {
    return (
      <div className="w-full lg:max-w-[800px] p-6 max-sm:p-0" dir="rtl">
        <div className="h-9 w-44 rounded-xl bg-[#F7FBEA] animate-pulse mb-3" />
        <div className="h-5 w-32 rounded-md bg-[#F7FBEA] animate-pulse mb-8" />
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-6 md:p-7 flex flex-col gap-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-[#F7FBEA] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-[#F7FBEA] animate-pulse" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-[#F7FBEA] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // 🟢 Error
  // ============================
  if (error) {
    return (
      <div className="w-full lg:max-w-[800px] p-6 max-sm:p-0" dir="rtl">
        <PageHeader
          monthIndex={monthIndex}
          year={year}
          onPrev={onPreviousMonth}
          onNext={onNextMonth}
          canGoNext={canGoNext}
        />
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center">
            <RefreshCw className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
              تعذّر تحميل لوحة الأداء
            </h3>
            <p
              className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium max-w-sm mx-auto`}
            >
              {error}
            </p>
          </div>
          <button
            onClick={onRetry}
            className={`${tajawal.className} inline-flex items-center gap-2 h-11 px-5 bg-[#043F2E] text-white rounded-xl text-sm font-bold hover:bg-[#065f46] transition-colors`}
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2.4} />
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  // ============================
  // 🟢 Empty
  // ============================
  if (sortedData.length === 0) {
    return (
      <div className="w-full lg:max-w-[800px] p-6 max-sm:p-0" dir="rtl">
        <PageHeader
          monthIndex={monthIndex}
          year={year}
          onPrev={onPreviousMonth}
          onNext={onNextMonth}
          canGoNext={canGoNext}
        />
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F7FBEA] flex items-center justify-center">
            <Trophy className="w-7 h-7 text-[#043F2E]/40" strokeWidth={1.6} />
          </div>
          <div>
            <h3 className={`${lalezar.className} text-xl text-[#043F2E] mb-1`}>
              لا توجد بيانات لعرضها
            </h3>
            <p
              className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium max-w-sm mx-auto`}
            >
              لم تُسجَّل أي نقاط لهذا الشهر بعد. جرب التنقل إلى شهر آخر أو شجّع الطلاب على المشاركة.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // 🟢 Main render
  // ============================
  return (
    <div className="w-full lg:max-w-[800px] p-6 max-sm:p-0" dir="rtl">
      <PageHeader
        monthIndex={monthIndex}
        year={year}
        onPrev={onPreviousMonth}
        onNext={onNextMonth}
        canGoNext={canGoNext}
      />

      <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden relative">
        <div className="relative">
          {/* Stats row */}
          <div className="p-5 md:p-7 border-b border-[#043F2E]/8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatChip
                label="إجمالي الطلاب"
                value={toArabicDigits(stats.total)}
                icon={<Sparkles className="w-4 h-4" strokeWidth={2.2} />}
              />
              <StatChip
                label="إجمالي النقاط"
                value={toArabicDigits(stats.totalPoints)}
                icon={<Trophy className="w-4 h-4" strokeWidth={2.2} />}
              />
              <StatChip
                label="أعلى نقاط"
                value={toArabicDigits(stats.topScore)}
                icon={<Crown className="w-4 h-4" strokeWidth={2.2} />}
                accent
              />
              <StatChip
                label="المتوسط"
                value={toArabicDigits(stats.average)}
                icon={<Sparkles className="w-4 h-4" strokeWidth={2.2} />}
              />
            </div>
          </div>

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="p-5 md:p-7 border-b border-[#043F2E]/8 bg-gradient-to-b from-[#F7FBEA]/60 to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-4 h-4 text-[#043F2E]" strokeWidth={2.4} />
                <h3 className={`${lalezar.className} text-lg text-[#043F2E]`}>أبرز ثلاثة</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-4 items-end">
                {/* 2nd (right in RTL) */}
                <PodiumSlot rank={2} user={topThree[1]} height="short" delay={0.1} />
                {/* 1st (center, tallest, featured) */}
                <PodiumSlot rank={1} user={topThree[0]} height="tall" delay={0} featured />
                {/* 3rd (left in RTL) */}
                <PodiumSlot rank={3} user={topThree[2]} height="shorter" delay={0.2} />
              </div>
            </div>
          )}

          {/* Rest of the leaderboard */}
          {rest.length > 0 && (
            <div className="p-3 md:p-5">
              <div
                className={`${tajawal.className} flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
              >
                <div className="shrink-0 w-10 text-center">المركز</div>
                {Object.keys(previousRanks).length > 0 && (
                  <div className="shrink-0 w-12 text-center">الحركة</div>
                )}
                <div className="flex-1 text-start">الاسم</div>
                <div className="shrink-0 w-20 text-start">النقاط</div>
              </div>
              <div className="flex flex-col">
                {rest.map((user, idx) => {
                  const rank = idx + 4;
                  // Real previous rank from the prior Hijri month.
                  // If the user is new (no prev rank), diff stays 0 → unchanged indicator.
                  const prevRank = previousRanks[user.id];
                  const diff = prevRank !== undefined ? prevRank - rank : 0;
                  const isCurrentUser = currentUserId === user.id;
                  return (
                    <RankRow
                      key={user.id}
                      rank={rank}
                      user={user}
                      movement={diff}
                      maxPoints={topThree[0]?.points ?? 0}
                      delay={idx * 0.03}
                      highlight={isCurrentUser}
                      showMovement={Object.keys(previousRanks).length > 0}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// 🟢 Page Header
// ============================
function PageHeader({
  monthIndex,
  year,
  onPrev,
  onNext,
  canGoNext,
}: {
  monthIndex: number;
  year: number;
  onPrev?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
}) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
      <div>
        <h2 className={`${lalezar.className} text-2xl md:text-3xl text-[#043F2E] leading-tight`}>
          لوحة الأداء
        </h2>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium mt-1`}>
          ترتيب الطلاب حسب نقاط شهر {getHijriMonth(monthIndex)} {toArabicDigits(year)} هـ
        </p>
      </div>

      {onPrev && onNext && (
        <div className="flex items-center gap-1.5 bg-[#F7FBEA] border border-[#043F2E]/10 rounded-2xl p-1.5">
          <button
            onClick={onPrev}
            aria-label="الشهر السابق"
            className={`${tajawal.className} h-10 px-3 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] text-sm font-bold transition-colors shadow-sm flex items-center gap-1`}
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.4} />
            <span className="hidden sm:inline">السابق</span>
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="الشهر التالي"
            className={`${tajawal.className} h-10 px-3 rounded-xl bg-white hover:bg-[#BEE663] text-[#043F2E] text-sm font-bold transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1`}
          >
            <span className="hidden sm:inline">التالي</span>
            <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================
// 🟢 Stat Chip
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
      className={`rounded-2xl px-3.5 py-3 border ${
        accent ? "bg-[#BEE663] border-[#043F2E]/15" : "bg-[#F7FBEA] border-[#043F2E]/8"
      } flex flex-col gap-1.5`}
    >
      <div
        className={`flex items-center gap-1.5 ${accent ? "text-[#043F2E]" : "text-[#043F2E]/60"}`}
      >
        {icon}
        <span className={`${tajawal.className} text-[11px] font-medium truncate`}>{label}</span>
      </div>
      <span className={`${lalezar.className} text-xl md:text-2xl text-[#043F2E] leading-none`}>
        {value}
      </span>
    </div>
  );
}

// ============================
// 🟢 Podium Slot (card or invisible placeholder)
// ============================
function PodiumSlot({
  rank,
  user,
  height,
  delay,
  featured,
}: {
  rank: number;
  user: LeaderboardUser | undefined;
  height: "tall" | "short" | "shorter";
  delay: number;
  featured?: boolean;
}) {
  if (!user) {
    // Invisible placeholder of the same height so the grid cells stay aligned
    // and the 1st place (center) never shifts to the right edge.
    const placeholderClass =
      height === "tall" ? "h-52 md:h-60" : height === "short" ? "h-44 md:h-48" : "h-40 md:h-44";
    return <div aria-hidden className={placeholderClass} />;
  }
  return <PodiumCard rank={rank} user={user} height={height} delay={delay} featured={featured} />;
}

// ============================
// 🟢 Podium Card
// ============================
function PodiumCard({
  rank,
  user,
  height,
  delay,
  featured,
}: {
  rank: number;
  user: LeaderboardUser;
  height: "tall" | "short" | "shorter";
  delay: number;
  featured?: boolean;
}) {
  const heightClass =
    height === "tall" ? "h-52 md:h-60" : height === "short" ? "h-44 md:h-48" : "h-40 md:h-44";

  const ringClass = featured ? "ring-2 ring-[#043F2E]/20" : "ring-1 ring-[#043F2E]/8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={`relative ${heightClass} rounded-2xl ${ringClass} overflow-hidden flex flex-col items-center justify-end p-3 md:p-4 gap-2 ${
        featured ? "bg-gradient-to-b from-[#BEE663] to-[#9ADD00] md:-mt-6" : "bg-[#F7FBEA]"
      }`}
    >
      {/* Rank badge */}
      <div
        className={`absolute top-2 right-1/2 translate-x-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-sm ${
          featured
            ? "bg-[#043F2E] text-[#BEE663]"
            : "bg-white text-[#043F2E] border border-[#043F2E]/10"
        }`}
      >
        {featured ? (
          <Crown className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.4} />
        ) : (
          <span className={`${lalezar.className} text-sm md:text-base`}>
            {toArabicDigits(rank)}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-sm ${
          featured
            ? "bg-[#043F2E] text-[#BEE663]"
            : "bg-white text-[#043F2E] border-2 border-[#043F2E]/15"
        }`}
      >
        <span className={`${tajawal.className} text-sm md:text-base font-bold`}>
          {getInitials(user.name) || "؟"}
        </span>
      </div>

      {/* Name */}
      <p
        className={`${tajawal.className} text-xs md:text-sm font-bold text-[#043F2E] text-center truncate w-full px-1`}
        title={user.name}
      >
        {user.name}
      </p>

      {/* Points pill */}
      <div
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${
          featured
            ? "bg-[#043F2E] text-[#BEE663]"
            : "bg-white text-[#043F2E] border border-[#043F2E]/10"
        }`}
      >
        <span className={`${lalezar.className} text-sm leading-none`}>
          {toArabicDigits(user.points)}
        </span>
        <span className={`${tajawal.className} text-[10px] font-medium opacity-80`}>نقطة</span>
      </div>
    </motion.div>
  );
}

// ============================
// 🟢 Rank Row
// ============================
function RankRow({
  rank,
  user,
  movement,
  maxPoints,
  delay,
  highlight,
  showMovement,
}: {
  rank: number;
  user: LeaderboardUser;
  movement: number;
  maxPoints: number;
  delay: number;
  highlight?: boolean;
  showMovement: boolean;
}) {
  const percentage = maxPoints > 0 ? Math.round((user.points / maxPoints) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        highlight
          ? "bg-[#BEE663]/25 border border-[#043F2E]/15"
          : "hover:bg-[#F7FBEA]/70 border border-transparent"
      }`}
    >
      {/* Rank */}
      <div
        className={`${lalezar.className} shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base ${
          highlight ? "bg-[#043F2E] text-[#BEE663]" : "bg-[#F7FBEA] text-[#043F2E]"
        }`}
      >
        {toArabicDigits(rank)}
      </div>

      {/* Movement */}
      {showMovement && (
        <div className="shrink-0 w-12 flex justify-center">
          <MovementIndicator movement={movement} />
        </div>
      )}

      {/* Avatar + Name */}
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <div
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
            highlight ? "bg-[#043F2E]" : "bg-gradient-to-br from-[#043F2E] to-[#065f46]"
          }`}
        >
          <span className={`${tajawal.className}`}>{getInitials(user.name) || "؟"}</span>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p
              className={`${tajawal.className} text-sm font-bold truncate ${
                highlight ? "text-[#043F2E]" : "text-[#043F2E]"
              }`}
              title={user.name}
            >
              {user.name}
            </p>
            {highlight && (
              <span
                className={`${tajawal.className} shrink-0 text-[10px] font-bold text-[#043F2E] bg-[#043F2E]/10 px-1.5 py-0.5 rounded`}
              >
                أنت
              </span>
            )}
          </div>
          <div className="h-1 bg-[#F7FBEA] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#9ADD00] to-[#BEE663] rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Points */}
      <div className="shrink-0 w-20 flex items-baseline justify-start gap-1">
        <span className={`${lalezar.className} text-lg text-[#043F2E] leading-none`}>
          {toArabicDigits(user.points)}
        </span>
        <span className={`${tajawal.className} text-[10px] text-[#043F2E]/50 font-medium`}>
          نقطة
        </span>
      </div>
    </motion.div>
  );
}

// ============================
// 🟢 Movement Indicator
// ============================
function MovementIndicator({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <div
        className="flex items-center gap-0.5 text-[#043F2E]"
        title={`صعد ${toArabicDigits(movement)} مركز`}
      >
        <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.4} />
        <span className={`${tajawal.className} text-[11px] font-bold`}>
          {toArabicDigits(movement)}
        </span>
      </div>
    );
  }
  if (movement < 0) {
    return (
      <div
        className="flex items-center gap-0.5 text-[#043F2E]/40"
        title={`نزل ${toArabicDigits(Math.abs(movement))} مركز`}
      >
        <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.4} />
        <span className={`${tajawal.className} text-[11px] font-bold`}>
          {toArabicDigits(Math.abs(movement))}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center text-[#043F2E]/30" title="لم يتغير المركز">
      <Minus className="w-3.5 h-3.5" strokeWidth={2.4} />
    </div>
  );
}
