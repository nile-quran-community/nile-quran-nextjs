"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Sparkles,
  Trophy,
  Activity,
  Award,
  UserCheck,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Info,
  PieChart,
  Users,
  AlertCircle,
} from "lucide-react";
import ProfileActivityList from "../ProfileActivityList";
import SectionHeading from "../SectionHeading";
import StatTile from "../StatTile";
import { cn, toArabicDigits, getHijriMonth } from "@/lib/utils";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";
import type { UserActivity } from "@/lib/profile-types";
import { getUserPointsForMonth, getStudentRank, type CirclePeer } from "@/actions/profile";
import Link from "next/link";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

// One surface / spacing system for every block on this dashboard. The page used
// to be six or seven cards each inventing its own padding, radius and header,
// so nothing read as more important than anything else. Now: identical shells,
// identical headers, and a single dark tile carrying the one number that matters.
const CARD = "bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6";
const RULE = "h-px bg-[#043F2E]/8";
const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2";

interface Category {
  id: number;
  name: string;
  value: number;
}

interface Props {
  userId: number;
  initialYear: number;
  initialMonth: number;
  initialPoints: number;
  initialActivities: UserActivity[];
  initialRank?: number | null;
  categories: Category[];
  peers: CirclePeer[];
  supervisorName?: string;
  supervisorHandle?: string | null;
}

// Brand palette for pie slices (approved tokens only)
const PIE_COLORS = ["#043F2E", "#9ADD00", "#BEE663", "#065f46", "#DEFF90", "#2A5A45"];

export default function StudentProfileView({
  userId,
  initialYear,
  initialMonth,
  initialPoints,
  initialActivities,
  initialRank,
  categories,
  peers,
  supervisorName,
  supervisorHandle,
}: Props) {
  const now = new Date();
  const hijriToday = gregorianToHijri({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [points, setPoints] = useState(initialPoints);
  const [activities, setActivities] = useState<UserActivity[]>(initialActivities);
  const [rank, setRank] = useState<number | null | undefined>(initialRank);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isCurrentMonth = year === hijriToday.year && month === hijriToday.month;
  const monthLabel = `${getHijriMonth(month - 1)} ${toArabicDigits(year)}`;

  const goToMonth = useCallback(
    (nextYear: number, nextMonth: number) => {
      setYear(nextYear);
      setMonth(nextMonth);

      // The month we arrived on is already on screen from the server render
      if (nextYear === initialYear && nextMonth === initialMonth) {
        setPoints(initialPoints);
        setActivities(initialActivities);
        setRank(initialRank);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);
      Promise.all([
        getUserPointsForMonth(userId, nextYear, nextMonth),
        getStudentRank(userId, nextYear, nextMonth),
      ])
        .then(([monthRes, rankRes]) => {
          if (!monthRes.success || !monthRes.data) {
            setLoadError(monthRes.error || "تعذّر تحميل نقاط الشهر");
            return;
          }
          const byId = new Map(categories.map((c) => [c.id, c]));
          setPoints(monthRes.data.points);
          setActivities(
            monthRes.data.activities.map((a) => ({
              ...a,
              category_name: byId.get(a.category)?.name,
              points: (byId.get(a.category)?.value ?? 0) * a.multiplier,
            })),
          );
          setRank(rankRes.success ? rankRes.data : null);
        })
        .catch(() => setLoadError("تعذّر الاتصال، حاول مرة أخرى"))
        .finally(() => setLoading(false));
    },
    [userId, categories, initialYear, initialMonth, initialPoints, initialActivities, initialRank],
  );

  const goPrev = () => (month === 1 ? goToMonth(year - 1, 12) : goToMonth(year, month - 1));
  const goNext = () => {
    if (isCurrentMonth) return;
    month === 12 ? goToMonth(year + 1, 1) : goToMonth(year, month + 1);
  };

  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  // Group activities by category. Points already carry each activity's
  // multiplier (value × multiplier); the bonus is the part of those points a
  // spectacular performance added above the plain ×1 value, so the chart can
  // say not just where points came from but how much the multiplier added.
  const categoryMap = new Map<
    number,
    { count: number; points: number; bonus: number; name?: string }
  >();
  for (const a of activities) {
    const existing = categoryMap.get(a.category) || {
      count: 0,
      points: 0,
      bonus: 0,
      name: a.category_name,
    };
    existing.count++;
    existing.points += a.points || 0;
    const mult = a.multiplier ?? 1;
    if (mult > 1 && a.points) {
      existing.bonus += a.points - Math.round(a.points / mult);
    }
    categoryMap.set(a.category, existing);
  }

  const pieSlices: PieSlice[] = Array.from(categoryMap.entries()).map(([catId, info], i) => ({
    id: catId,
    name: info.name || "نشاط",
    count: info.count,
    points: info.points,
    bonusPoints: info.bonus,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-5 md:gap-6" dir="rtl">
      {/* Standing facts, not month figures — so they close the page instead of
          interrupting the month's own story */}
      {/* ─────────────────────────────────────────────────────────────────
          The month. One card, one statement of the month, and everything
          that belongs to it: the navigator, the three figures, and the
          breakdown of those same points. The navigator used to be its own
          card sitting directly above a card whose header repeated the month.
          ───────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="student-month-heading" className={cn(CARD, "flex flex-col gap-5")}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-8 h-8 rounded-lg bg-[#F7FBEA] text-[#043F2E] flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <CalendarRange className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h3
                id="student-month-heading"
                className={`${lalezar.className} text-lg text-[#043F2E] leading-tight truncate`}
              >
                {monthLabel} هـ
              </h3>
              <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60 leading-tight`}>
                {isCurrentMonth ? "الشهر الحالي" : "شهر سابق"}
              </p>
            </div>
          </div>

          {/* Prev is always available; next stops at the current month.
              RTL: ChevronRight goes back, ChevronLeft goes forward. */}
          <div className="flex items-center gap-2 shrink-0">
            <MonthNavButton
              onClick={goPrev}
              disabled={loading}
              label="الشهر السابق"
              icon={<ChevronRight className="w-5 h-5" strokeWidth={2.4} />}
            />
            <MonthNavButton
              onClick={goNext}
              disabled={loading || isCurrentMonth}
              label="الشهر التالي"
              icon={<ChevronLeft className="w-5 h-5" strokeWidth={2.4} />}
            />
          </div>
        </div>

        <div className={RULE} />

        {loadError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-2xl bg-[#F4E0D6] border border-[#9B3D2E]/30 px-4 py-3"
          >
            <AlertCircle
              className="w-4 h-4 text-[#9B3D2E] shrink-0"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span className={`${tajawal.className} text-xs text-[#9B3D2E]`}>{loadError}</span>
          </div>
        )}

        {/* The member's own points are the one thing on this screen allowed a
            dark surface. The gradient band that used to shout above the chart
            is gone; this tile carries that weight now, next to its own month. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-busy={loading || undefined}>
          {loading && (
            <span role="status" className="sr-only">
              جارٍ تحميل أرقام الشهر
            </span>
          )}
          <StatTile
            label="نقاط الشهر"
            value={toArabicDigits(points)}
            icon={<Trophy className="w-5 h-5" strokeWidth={2.2} />}
            tone="primary"
            loading={loading}
          />
          <StatTile
            label="أنشطة الشهر"
            value={toArabicDigits(activities.length)}
            icon={<Activity className="w-5 h-5" strokeWidth={2.2} />}
            loading={loading}
          />
          <StatTile
            label="ترتيبي في الشهر"
            value={rank ? toArabicDigits(rank) : "—"}
            icon={<Award className="w-5 h-5" strokeWidth={2.2} />}
            loading={loading}
          />
        </div>

        <div className={RULE} />

        {/* Where those points came from — same month, same card, no second header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <PieChart
              className="w-4 h-4 text-[#043F2E]/60 shrink-0"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <h4 className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>
              توزيع النقاط
            </h4>
          </div>
          {pieSlices.length > 0 ? (
            <PointsPieChart slices={pieSlices} totalPoints={points} />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-6 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F7FBEA] flex items-center justify-center">
                <PieChart
                  className="w-5 h-5 text-[#043F2E]/60"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
              <p className={`${tajawal.className} text-xs text-[#043F2E]/60`}>
                {isCurrentMonth
                  ? "سيظهر توزيع نقاطك هنا بعد تسجيل أول نشاط"
                  : "لا توجد أنشطة مسجّلة في هذا الشهر"}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent activities — still the selected month's, so it sits directly
          under the card that names it */}
      <section
        aria-labelledby="student-activities-heading"
        className={cn(CARD, "flex flex-col gap-4")}
      >
        <SectionHeading
          id="student-activities-heading"
          icon={<Sparkles className="w-4 h-4" strokeWidth={2.2} />}
          title="آخر الأنشطة"
          sub={
            activities.length > 0
              ? `عرض ${toArabicDigits(recentActivities.length)} من ${toArabicDigits(activities.length)}`
              : undefined
          }
        />
        <ProfileActivityList
          activities={recentActivities}
          emptyMessage={
            isCurrentMonth ? "لم تسجّل أي نشاط هذا الشهر بعد" : "لا توجد أنشطة في هذا الشهر"
          }
        />
      </section>

      {/* Circle peers — the people you memorise alongside. Names only, on purpose:
          a number beside each name would turn this into a small leaderboard. */}
      {supervisorName && (
        <section
          aria-labelledby="student-peers-heading"
          className={cn(CARD, "flex flex-col gap-4")}
        >
          <SectionHeading
            id="student-peers-heading"
            icon={<Users className="w-4 h-4" strokeWidth={2.2} />}
            title="زملاء حلقتي"
            sub={`في حلقة ${supervisorName}`}
          />

          {peers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {peers.map((peer) => (
                <Link
                  key={peer.id}
                  href={`/profile/${encodeURIComponent(peer.username)}`}
                  className={cn(
                    tajawal.className,
                    "inline-flex items-center h-11 sm:h-10 px-4 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/10",
                    "text-sm font-medium text-[#043F2E] transition-colors",
                    "hover:bg-[#BEE663]/30 hover:border-[#043F2E]/30",
                    FOCUS_RING,
                  )}
                >
                  {peer.fullName}
                </Link>
              ))}
            </div>
          ) : (
            <p className={`${tajawal.className} text-xs text-[#043F2E]/60`}>
              أنت أول من انضم إلى هذه الحلقة
            </p>
          )}
        </section>
      )}
    </div>
  );
}

// ============================
// Month navigation button — 44px on touch, 40px from sm up, always labelled
// ============================
function MonthNavButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-11 h-11 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
        "bg-[#F7FBEA] border border-[#043F2E]/10 text-[#043F2E] transition-colors",
        "hover:bg-[#BEE663] hover:border-[#043F2E]/20",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#F7FBEA] disabled:hover:border-[#043F2E]/10",
        FOCUS_RING,
      )}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

// ============================
// Points Pie Chart (interactive SVG donut)
// ============================
interface PieSlice {
  id: number;
  name: string;
  count: number;
  points: number;
  /** Points above the plain ×1 value, earned through activity multipliers */
  bonusPoints: number;
  color: string;
}

// Donut geometry, in viewBox units (viewBox is 0 0 200 200)
const CX = 100;
const CY = 100;
const R_OUT = 80; // visible outer radius
const R_IN = 58; // visible inner radius (the hole) — a thinner ring reads calmer
// and leaves room for the centre readout at a legible size
const R_HIT_OUT = 92; // invisible hit area — widens the tap target to ~44px on mobile
const R_HIT_IN = 50;
const R_MARKER = 87; // thin arc drawn outside a highlighted slice

const round2 = (v: number) => Math.round(v * 100) / 100;

function polar(radius: number, angle: number) {
  return { x: round2(CX + radius * Math.cos(angle)), y: round2(CY + radius * Math.sin(angle)) };
}

// Annular wedge between two angles
function wedgePath(rOut: number, rIn: number, start: number, end: number) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const a = polar(rOut, start);
  const b = polar(rOut, end);
  const c = polar(rIn, end);
  const d = polar(rIn, start);
  return `M ${a.x} ${a.y} A ${rOut} ${rOut} 0 ${largeArc} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rIn} ${rIn} 0 ${largeArc} 0 ${d.x} ${d.y} Z`;
}

// Full ring (single category owning 100% of the points) — outer circle with the
// inner circle punched out via fill-rule="evenodd"
function ringPath(rOut: number, rIn: number) {
  return `${circlePath(rOut)} Z ${circlePath(rIn)} Z`;
}

function circlePath(radius: number) {
  return `M ${CX} ${round2(CY - radius)} A ${radius} ${radius} 0 1 1 ${CX} ${round2(CY + radius)} A ${radius} ${radius} 0 1 1 ${CX} ${round2(CY - radius)}`;
}

function markerPath(start: number, end: number, full: boolean) {
  if (full) return circlePath(R_MARKER);
  const largeArc = end - start > Math.PI ? 1 : 0;
  const a = polar(R_MARKER, start);
  const b = polar(R_MARKER, end);
  return `M ${a.x} ${a.y} A ${R_MARKER} ${R_MARKER} 0 ${largeArc} 1 ${b.x} ${b.y}`;
}

// prefers-reduced-motion, resolved after mount so SSR and the first client
// render agree (no hydration mismatch)
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function PointsPieChart({ slices, totalPoints }: { slices: PieSlice[]; totalPoints: number }) {
  const reduceMotion = useReducedMotion();
  // `selectedId` is the pinned slice (click / Enter / Space).
  // `previewId` is the lighter hover / focus preview.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const total = slices.reduce((s, x) => s + x.points, 0);

  const arcs = useMemo(() => {
    if (total <= 0) return [];
    let angle = -Math.PI / 2;
    return slices
      .filter((s) => s.points > 0)
      .map((s) => {
        const frac = s.points / total;
        const start = angle;
        const end = angle + frac * Math.PI * 2;
        angle = end;
        const full = frac >= 0.999;
        return {
          slice: s,
          full,
          d: full ? ringPath(R_OUT, R_IN) : wedgePath(R_OUT, R_IN, start, end),
          hitD: full ? ringPath(R_HIT_OUT, R_HIT_IN) : wedgePath(R_HIT_OUT, R_HIT_IN, start, end),
          markerD: markerPath(start, end, full),
        };
      });
  }, [slices, total]);

  const clear = useCallback(() => {
    setSelectedId(null);
    setPreviewId(null);
  }, []);

  // Clicking away (anywhere that is not a slice or a legend row) or pressing
  // Escape returns the chart to the neutral "total" state.
  useEffect(() => {
    if (selectedId === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target && typeof target.closest === "function" && target.closest("[data-pie-item]"))
        return;
      clear();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clear();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, clear]);

  // All slices zero points — nothing to draw
  if (total <= 0) {
    return (
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center py-2">
        <svg
          viewBox="0 0 200 200"
          className="w-[120px] h-[120px] shrink-0"
          role="img"
          aria-label="لا توجد نقاط مسجّلة بعد"
        >
          <path d={ringPath(R_OUT, R_IN)} fillRule="evenodd" fill="#043F2E" fillOpacity={0.08} />
        </svg>
        <p className={`${tajawal.className} text-xs text-[#043F2E]/60 text-center sm:text-start`}>
          لا توجد نقاط مسجّلة بعد — سجّل نشاطك الأول ليظهر توزيع نقاطك هنا
        </p>
      </div>
    );
  }

  const percentOf = (p: number) => Math.round((p / total) * 100);
  const highlightId = selectedId ?? previewId;
  const highlighted =
    highlightId !== null ? (slices.find((s) => s.id === highlightId) ?? null) : null;

  const previewOnly = (id: number) => setPreviewId(id);
  const previewOff = (id: number) => setPreviewId((prev) => (prev === id ? null : prev));
  const toggle = (id: number) => setSelectedId((prev) => (prev === id ? null : id));

  // Growth. With reduced motion the slice never grows and nothing transitions —
  // the marker arc + dimming carry the highlight instead.
  // Kept separate from opacity so the focus-ring paths can keep using their
  // `peer-focus-visible:opacity-*` classes (an inline opacity would win over them).
  const motionStyle = (id: number): React.CSSProperties => {
    const isHighlighted = highlightId === id;
    const scale = reduceMotion ? 1 : isHighlighted ? (selectedId === id ? 1.075 : 1.035) : 1;
    return {
      transform: `scale(${scale})`,
      transformOrigin: `${CX}px ${CY}px`,
      transformBox: "view-box",
      transition: reduceMotion
        ? undefined
        : "transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 200ms ease-out",
    };
  };

  const sliceOpacity = (id: number) => {
    const isDimmed = highlightId !== null && highlightId !== id;
    if (!isDimmed) return 1;
    return selectedId !== null ? 0.3 : 0.5;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 200 200"
            className="w-[224px] h-[224px] sm:w-[240px] sm:h-[240px] overflow-visible"
            role="group"
            aria-label="توزيع النقاط حسب النشاط"
          >
            {arcs.map(({ slice, d, hitD, markerD }) => {
              const style = motionStyle(slice.id);
              const isHighlighted = highlightId === slice.id;
              const percent = percentOf(slice.points);
              return (
                <g key={slice.id}>
                  {/* Invisible, wider hit area — also the focusable control */}
                  <path
                    d={hitD}
                    fill="transparent"
                    fillRule="evenodd"
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedId === slice.id}
                    aria-label={`${slice.name}: النقاط ${toArabicDigits(slice.points)}، النسبة ${toArabicDigits(percent)} بالمئة من إجمالي النقاط${slice.bonusPoints > 0 ? `، منها ${toArabicDigits(slice.bonusPoints)} بأداء متميز` : ""}`}
                    data-pie-item=""
                    className="peer cursor-pointer outline-none"
                    style={style}
                    onClick={() => toggle(slice.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                        e.preventDefault();
                        toggle(slice.id);
                      }
                    }}
                    onPointerEnter={() => previewOnly(slice.id)}
                    onPointerLeave={() => previewOff(slice.id)}
                    onFocus={() => previewOnly(slice.id)}
                    onBlur={() => previewOff(slice.id)}
                  />

                  {/* The visible slice */}
                  <path
                    d={d}
                    fill={slice.color}
                    fillRule="evenodd"
                    stroke="#FFFFFF"
                    strokeWidth={arcs.length > 1 ? 2 : 0}
                    strokeLinejoin="round"
                    className="pointer-events-none"
                    style={{ ...style, opacity: sliceOpacity(slice.id) }}
                    aria-hidden="true"
                  />

                  {/* Highlight marker — a thin arc in the slice's own colour,
                      readable on white in every palette tone and independent of
                      the growth animation */}
                  <path
                    d={markerD}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    className="pointer-events-none"
                    style={{
                      ...style,
                      opacity: isHighlighted ? 1 : 0,
                    }}
                    aria-hidden="true"
                  />

                  {/* Keyboard focus ring — white underlay + dark outline so it
                      stays visible on both the dark and the lime slices */}
                  <path
                    d={d}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth={5}
                    className="pointer-events-none opacity-0 peer-focus-visible:opacity-100"
                    style={style}
                    aria-hidden="true"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="#043F2E"
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    className="pointer-events-none opacity-0 peer-focus-visible:opacity-100"
                    style={style}
                    aria-hidden="true"
                  />
                </g>
              );
            })}
          </svg>

          {/* Centre readout — the active activity's own numbers, or the total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex flex-col items-center justify-center text-center max-w-[56%]"
            >
              {highlighted ? (
                <>
                  <span
                    className="w-2.5 h-2.5 rounded-full mb-1.5 shrink-0"
                    style={{ backgroundColor: highlighted.color }}
                  />
                  <span
                    className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/70 leading-snug line-clamp-2`}
                  >
                    {highlighted.name}
                  </span>
                  <span
                    className={`${lalezar.className} text-2xl text-[#043F2E] leading-none mt-1`}
                  >
                    +{toArabicDigits(highlighted.points)}
                  </span>
                  <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60 mt-1`}>
                    نقطة · {toArabicDigits(percentOf(highlighted.points))}٪
                  </span>
                  {highlighted.bonusPoints > 0 && (
                    <span className={`${tajawal.className} text-[10px] text-[#043F2E]/55 mt-0.5`}>
                      منها +{toArabicDigits(highlighted.bonusPoints)} بأداء متميز
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className={`${lalezar.className} text-[26px] text-[#043F2E] leading-none`}>
                    {toArabicDigits(totalPoints)}
                  </span>
                  <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60 mt-1`}>
                    إجمالي النقاط
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend — stays in sync with the chart in both directions */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-2">
          {slices.map((s) => {
            const percent = total > 0 ? percentOf(s.points) : 0;
            const interactive = s.points > 0;
            const isHighlighted = highlightId === s.id;
            const isSelected = selectedId === s.id;
            const isDimmed = highlightId !== null && !isHighlighted;

            const body = (
              <>
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "rounded-full shrink-0",
                        reduceMotion ? "" : "transition-all duration-200",
                        isHighlighted ? "w-3.5 h-3.5" : "w-3 h-3",
                      )}
                      style={{ backgroundColor: s.color }}
                    />
                    <span
                      className={cn(
                        tajawal.className,
                        "text-xs truncate",
                        isHighlighted
                          ? "font-bold text-[#043F2E]"
                          : "font-medium text-[#043F2E]/70",
                      )}
                    >
                      {s.name}
                    </span>
                  </span>
                  {/* The multiplier's own share of this category's points */}
                  {s.bonusPoints > 0 && (
                    <span
                      className={`${tajawal.className} text-[10px] text-[#043F2E]/55 truncate ps-5`}
                    >
                      منها +{toArabicDigits(s.bonusPoints)} بأداء متميز
                    </span>
                  )}
                </span>
                <span className="flex items-baseline gap-2 shrink-0">
                  <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
                    {toArabicDigits(percent)}٪
                  </span>
                  {/* Plain figure, not a lime pill: the dark points tile above is
                      the only emphasis surface this screen gets */}
                  <span className={`${lalezar.className} text-base text-[#043F2E] leading-none`}>
                    +{toArabicDigits(s.points)}
                  </span>
                </span>
              </>
            );

            const base =
              "w-full min-h-[44px] flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start";

            if (!interactive) {
              // A category with no points has no slice to highlight — keep the
              // row visible but inert. Muted by colour rather than opacity so
              // the label stays readable.
              return (
                <div key={s.id} className={cn(base, "bg-[#F7FBEA] border-[#043F2E]/8")}>
                  {body}
                </div>
              );
            }

            return (
              <button
                key={s.id}
                type="button"
                data-pie-item=""
                aria-pressed={isSelected}
                aria-label={`${s.name}: النقاط ${toArabicDigits(s.points)}، النسبة ${toArabicDigits(percent)} بالمئة من إجمالي النقاط${s.bonusPoints > 0 ? `، منها ${toArabicDigits(s.bonusPoints)} بأداء متميز` : ""}`}
                onClick={() => toggle(s.id)}
                onPointerEnter={() => previewOnly(s.id)}
                onPointerLeave={() => previewOff(s.id)}
                onFocus={() => previewOnly(s.id)}
                onBlur={() => previewOff(s.id)}
                className={cn(
                  base,
                  "cursor-pointer",
                  FOCUS_RING,
                  reduceMotion ? "" : "transition-all duration-200",
                  isSelected
                    ? "bg-white border-[#043F2E]/40 shadow-sm"
                    : isHighlighted
                      ? "bg-white border-[#043F2E]/25 shadow-sm"
                      : "bg-[#F7FBEA] border-[#043F2E]/8 hover:border-[#043F2E]/20",
                  // The un-picked rows recede while one is picked, then come
                  // straight back — a transient state, not resting typography
                  isDimmed ? "opacity-70" : "opacity-100",
                )}
              >
                {body}
              </button>
            );
          })}
        </div>
      </div>

      {/* Affordance hint */}
      <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60 text-center sm:text-start`}>
        {selectedId !== null
          ? "اضغط مرة أخرى — أو في أي مكان آخر — للعودة إلى الإجمالي"
          : "اضغط على أي شريحة أو نشاط لعرض تفاصيل نقاطه"}
      </p>
    </div>
  );
}
