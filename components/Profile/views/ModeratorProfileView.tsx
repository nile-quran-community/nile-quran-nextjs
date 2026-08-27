"use client";

import { useState, useMemo, useEffect, useCallback, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lalezar, Tajawal } from "next/font/google";
import {
  Search,
  Users,
  TrendingUp,
  Award,
  User,
  BookOpen,
  Inbox,
  BookMarked,
  Pencil,
  X,
  Plus,
  Loader2,
  Check,
  Trash2,
  ClipboardList,
  Calendar,
  AlertCircle,
  BellRing,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import StatTile from "../StatTile";
import { toArabicDigits, formatHijriDate } from "@/lib/utils";
import {
  addStudentActivity,
  getStudentActivities,
  deleteStudentActivity,
  updateStudentActivityCategory,
  updateStudentActivityMultiplier,
} from "@/actions/profile";
import {
  SUPERVISOR_MANAGED_CATEGORY_IDS,
  isLongInactive,
  weeksSinceActivity,
} from "@/lib/profile-types";
import type { SupervisedStudent } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export interface ActivityCategory {
  id: number;
  name: string;
  value: number;
}

interface Props {
  students: SupervisedStudent[];
  categories: ActivityCategory[];
  /**
   * Whether the person reading this panel is also an Admin.
   *
   * Only copy, never permissions. /control-board is Admin-only — its page guard
   * redirects anyone without the Admin group — so only an Admin may be pointed at
   * it. Defaults to false so a plain recitation supervisor is never sent to a page
   * that would turn them away.
   */
  viewerIsAdmin?: boolean;
}

const CAT_TASMEE = 4;

// Spectacular performance is recorded as a multiplier on the activity, and the
// API counts points as multiplier × category value. The API accepts any integer
// ≥ 1; the pills stop at ×5 as a guardrail — a slip of the hand should not be
// what decides the month's competition.
const MULTIPLIER_OPTIONS = [1, 2, 3, 4, 5];

// The pills cover the common range; an activity recorded elsewhere with a
// bigger multiplier still shows its real value, selected, beside them
function multiplierOptionsFor(current: number): number[] {
  return MULTIPLIER_OPTIONS.includes(current)
    ? MULTIPLIER_OPTIONS
    : [...MULTIPLIER_OPTIONS, current];
}

type ActivityItem = {
  id: number;
  category: number;
  date: string;
  multiplier: number;
};

// ============================
// Table column widths
// ============================
// The students card is overflow-hidden, so a row wider than the card silently
// loses its left-most cell. The table appears at md (768px), where the widest
// the row can be is: container 768 − px-4 (32) = 736, minus the card's two 1px
// borders = 734, minus the row's px-6 at md (48) = 686 of usable track.
//
//   avatar 40 + activities 64 + points 64 + action 48                 = 216
//   four gap-3 gutters                                                =  48
//   leaves the name column                                            = 422
//
// Keep this arithmetic true if a column is ever resized: header and row read the
// same constants so the two can never drift apart.
const COL_AVATAR = "w-10 shrink-0";
const COL_NAME = "flex-1 min-w-0";
const COL_ACTIVITIES = "w-[64px] shrink-0";
const COL_POINTS = "w-[64px] shrink-0";
const COL_ACTION = "w-[48px] shrink-0";

// Arabic counts its nouns differently at one, two, a few and many. Saying
// "٢ طالبًا" to a supervisor about their own circle reads like a machine.
function studentsCountLabel(n: number): string {
  if (n === 0) return "لا يوجد طلاب";
  if (n === 1) return "طالب واحد";
  if (n === 2) return "طالبان";
  if (n <= 10) return `${toArabicDigits(n)} طلاب`;
  return `${toArabicDigits(n)} طالبًا`;
}

export default function ModeratorProfileView({
  students,
  categories,
  viewerIsAdmin = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "name">("points");
  const [sheetStudent, setSheetStudent] = useState<SupervisedStudent | null>(null);

  // Stable so the sheet's Escape listener is not rebound on every parent render
  const closeSheet = useCallback(() => setSheetStudent(null), []);

  const filtered = useMemo(() => {
    let result = [...students];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => {
        const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
        return fullName.includes(q) || s.username.toLowerCase().includes(q);
      });
    }

    if (sortBy === "points") {
      result.sort((a, b) => b.points - a.points);
    } else {
      result.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.trim();
        const nameB = `${b.first_name} ${b.last_name}`.trim();
        return nameA.localeCompare(nameB, "ar");
      });
    }

    return result;
  }, [students, search, sortBy]);

  const stats = useMemo(() => {
    const total = students.length;
    const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
    const avg = total > 0 ? Math.round(totalPoints / total) : 0;
    // Active students = students with at least one activity this week (same as the control board)
    const activeStudents = students.filter((s) => s.weekly_activities_count > 0).length;
    return { total, totalPoints, avg, activeStudents };
  }, [students]);

  const isSearching = search.trim().length > 0;

  const sortTabClass = (active: boolean) =>
    `${tajawal.className} h-10 px-3.5 rounded-xl text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
      active ? "bg-[#043F2E] text-white" : "text-[#043F2E]/70 hover:bg-white hover:text-[#043F2E]"
    }`;

  return (
    <div className="flex flex-col gap-5 md:gap-6" dir="rtl">
      {/* ============================
          Metrics strip
          ============================
          One card, four numbers, and exactly one emphasis surface. A supervisor
          opens this page to learn whether their circle moved this week, so that
          is the number wearing the dark tile; the other three stay quiet. */}
      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6">
        {/* auto-rows-fr keeps both rows the same height at 375px, where the
            two-column strip would otherwise step down after the wrapping label */}
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-3 items-stretch">
          <StatTile
            label="الطلاب النشطون هذا الأسبوع"
            value={toArabicDigits(stats.activeStudents)}
            icon={<CalendarCheck className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />}
            tone="primary"
          />
          <StatTile
            label="طلاب حلقتي"
            value={toArabicDigits(stats.total)}
            icon={<Users className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />}
          />
          <StatTile
            label="إجمالي نقاط الحلقة"
            value={toArabicDigits(stats.totalPoints)}
            icon={<TrendingUp className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />}
          />
          <StatTile
            label="متوسط النقاط"
            value={toArabicDigits(stats.avg)}
            icon={<Award className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />}
          />
        </div>
      </section>

      {/* ============================
          Students
          ============================ */}
      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-[#F7FBEA] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#043F2E]" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className={`${lalezar.className} text-lg text-[#043F2E] leading-tight`}>طلابي</h2>
            {/* Only speaks up while a search narrows the list — otherwise the
                count is already the first tile above and repeating it is noise */}
            {isSearching && (
              <p
                className={`${tajawal.className} text-[11px] text-[#043F2E]/60 leading-tight`}
                aria-live="polite"
              >
                {filtered.length === 0
                  ? "لا نتائج"
                  : `${studentsCountLabel(filtered.length)} من ${toArabicDigits(students.length)}`}
              </p>
            )}
          </div>
        </div>

        {/* Search + sort — one calm toolbar. They stack below md and sit side by
            side from md up, where the widest they can be is 694px of track:
            search min 240 + gap 12 + sort group ~176 leaves room to spare. */}
        <div className="px-5 md:px-6 pb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-auto md:flex-1 md:max-w-[360px]">
            <Search
              className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50 pointer-events-none"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو اسم المستخدم..."
              aria-label="ابحث عن طالب بالاسم أو اسم المستخدم"
              className={`${tajawal.className} w-full h-12 ps-10 pe-4 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl text-sm font-medium text-[#043F2E] placeholder:text-[#043F2E]/60 focus:outline-none focus:bg-white focus:border-[#043F2E]/40 focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 transition-colors`}
            />
          </div>

          <div
            role="group"
            aria-label="ترتيب الطلاب"
            className="flex items-center gap-1 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1 shrink-0 self-start md:self-auto"
          >
            <button
              type="button"
              onClick={() => setSortBy("points")}
              aria-pressed={sortBy === "points"}
              className={sortTabClass(sortBy === "points")}
            >
              الأعلى نقاطًا
            </button>
            <button
              type="button"
              onClick={() => setSortBy("name")}
              aria-pressed={sortBy === "name"}
              className={sortTabClass(sortBy === "name")}
            >
              الاسم
            </button>
          </div>
        </div>

        {/* Students */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center border-t border-[#043F2E]/8">
            <div className="w-14 h-14 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-[#043F2E]/50" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h4 className={`${lalezar.className} text-lg text-[#043F2E] mb-1`}>
              {search ? "لا توجد نتائج" : "لا يوجد طلاب"}
            </h4>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
              {search ? "جرّب البحث بكلمة مختلفة" : "لم يُسنَد إليك أي طالب بعد"}
            </p>
          </div>
        ) : (
          <>
            {/* ---- Desktop table (md and up) ---- */}
            <div className="hidden md:block">
              <div className="flex items-center gap-3 px-5 md:px-6 py-2.5 bg-[#F7FBEA] border-y border-[#043F2E]/8">
                <div className={COL_AVATAR} aria-hidden="true" />
                <div className={COL_NAME}>
                  <span className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/70`}>
                    الطالب
                  </span>
                </div>
                <div className={`${COL_ACTIVITIES} text-center`}>
                  <span className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/70`}>
                    الأنشطة
                  </span>
                </div>
                <div className={`${COL_POINTS} text-center`}>
                  <span className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/70`}>
                    النقاط
                  </span>
                </div>
                <div className={COL_ACTION} aria-hidden="true" />
              </div>

              <div className="flex flex-col">
                {filtered.map((student, idx) => {
                  const fullName = `${student.first_name} ${student.last_name}`.trim();
                  const displayName = fullName || student.username;
                  const initials =
                    `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();
                  const isLast = idx === filtered.length - 1;

                  return (
                    <div
                      key={student.id}
                      className={`group flex items-center gap-3 px-5 md:px-6 py-3 bg-white hover:bg-[#F7FBEA]/70 transition-colors ${
                        !isLast ? "border-b border-[#043F2E]/8" : ""
                      }`}
                    >
                      {/* Avatar — quiet, so nothing in the row competes with a badge */}
                      <div
                        className={`${COL_AVATAR} h-10 rounded-full bg-[#F7FBEA] border border-[#043F2E]/10 flex items-center justify-center text-[#043F2E]`}
                        aria-hidden="true"
                      >
                        <span className={`${tajawal.className} text-xs font-bold`}>
                          {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
                        </span>
                      </div>

                      {/* Name — the name itself is the way into the member's profile */}
                      <div className={COL_NAME}>
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Link
                            href={`/profile/${encodeURIComponent(student.username)}`}
                            className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 rounded`}
                          >
                            {displayName}
                          </Link>
                          <FollowUpBadge student={student} />
                        </span>
                        {/* The reason, in words, where the row already had a
                            second line. The handle earns that line far less. */}
                        <p
                          className={`${tajawal.className} text-[11px] text-[#043F2E]/60 truncate`}
                        >
                          {followUpDetail(student) ?? `@${student.username}`}
                        </p>
                      </div>

                      {/* Activities count */}
                      <div className={`${COL_ACTIVITIES} text-center`}>
                        <span
                          className={`${lalezar.className} text-base text-[#043F2E]/70 leading-none`}
                        >
                          {toArabicDigits(student.activities_count)}
                        </span>
                      </div>

                      {/* Points */}
                      <div className={`${COL_POINTS} flex justify-center`}>
                        <span
                          className={`${lalezar.className} min-w-[44px] h-8 px-2.5 inline-flex items-center justify-center rounded-lg bg-[#F7FBEA] border border-[#043F2E]/8 text-base leading-none ${
                            student.points > 0 ? "text-[#043F2E]" : "text-[#043F2E]/60"
                          }`}
                        >
                          {toArabicDigits(student.points)}
                        </span>
                      </div>

                      {/* One control per student — it opens the activity sheet */}
                      <div className={`${COL_ACTION} flex items-center justify-center`}>
                        <button
                          type="button"
                          onClick={() => setSheetStudent(student)}
                          aria-label={`أنشطة ${displayName}`}
                          title="الأنشطة"
                          className="w-10 h-10 rounded-xl bg-[#F7FBEA] border border-[#043F2E]/10 text-[#043F2E] flex items-center justify-center hover:bg-[#BEE663] hover:border-[#043F2E]/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2"
                        >
                          <ClipboardList className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ---- Mobile cards (below md) ---- */}
            <div className="md:hidden flex flex-col gap-3 px-5 py-5 border-t border-[#043F2E]/8">
              {filtered.map((student) => {
                const fullName = `${student.first_name} ${student.last_name}`.trim();
                const displayName = fullName || student.username;
                const initials =
                  `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();

                return (
                  <div
                    key={student.id}
                    className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#043F2E]/10 flex items-center justify-center text-[#043F2E]"
                        aria-hidden="true"
                      >
                        <span className={`${tajawal.className} text-xs font-bold`}>
                          {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Link
                            href={`/profile/${encodeURIComponent(student.username)}`}
                            className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 rounded`}
                          >
                            {displayName}
                          </Link>
                          <FollowUpBadge student={student} />
                        </span>
                        {/* The reason, in words, where the row already had a
                            second line. The handle earns that line far less. */}
                        <p
                          className={`${tajawal.className} text-[11px] text-[#043F2E]/60 truncate`}
                        >
                          {followUpDetail(student) ?? `@${student.username}`}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-center gap-0.5">
                        <span
                          className={`${tajawal.className} text-[11px] text-[#043F2E]/60 leading-none`}
                        >
                          النقاط
                        </span>
                        <span
                          className={`${lalezar.className} min-w-[44px] h-8 px-2.5 inline-flex items-center justify-center rounded-lg bg-white border border-[#043F2E]/10 text-base leading-none ${
                            student.points > 0 ? "text-[#043F2E]" : "text-[#043F2E]/60"
                          }`}
                        >
                          {toArabicDigits(student.points)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1 border-t border-[#043F2E]/8">
                      <span
                        className={`${tajawal.className} text-[11px] text-[#043F2E]/60 shrink-0`}
                      >
                        الأنشطة{" "}
                        <span className={`${lalezar.className} text-sm text-[#043F2E]/70`}>
                          {toArabicDigits(student.activities_count)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSheetStudent(student)}
                        aria-label={`أنشطة ${displayName}`}
                        className={`${tajawal.className} ms-auto inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-white border border-[#043F2E]/15 text-[#043F2E] text-sm font-bold hover:bg-[#BEE663] hover:border-[#043F2E]/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2`}
                      >
                        <ClipboardList className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
                        الأنشطة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* One sheet per student: record, correct, or remove */}
      {sheetStudent && (
        <ActivitySheet
          key={sheetStudent.id}
          student={sheetStudent}
          categories={categories}
          viewerIsAdmin={viewerIsAdmin}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}

// ============================
// Activity Sheet — record, correct, or remove, in one place
// ============================
type SheetMode = "add" | "manage";

function ActivitySheet({
  student,
  categories,
  viewerIsAdmin,
  onClose,
}: {
  student: SupervisedStudent;
  categories: ActivityCategory[];
  viewerIsAdmin: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<SheetMode>("add");
  const [activities, setActivities] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  const fullName = `${student.first_name} ${student.last_name}`.trim() || student.username;
  const initials =
    `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.trim();

  // The two categories a supervisor may touch, with names and values from the API
  const availableCategories = SUPERVISOR_MANAGED_CATEGORY_IDS.map((id) =>
    categories.find((c) => c.id === id),
  ).filter((c): c is ActivityCategory => Boolean(c));

  const [categoryId, setCategoryId] = useState<number>(availableCategories[0]?.id ?? CAT_TASMEE);
  const selectedCategory = availableCategories.find((c) => c.id === categoryId);
  const [multiplier, setMultiplier] = useState(1);

  const isBusy = busyId !== null || isPending;
  busyRef.current = isBusy;

  const requestClose = () => {
    if (!busyRef.current) onClose();
  };

  // The dialog takes focus on open, and the button that opened it gets focus back
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const loadActivities = useCallback(() => {
    setActivities(null);
    setError(null);
    getStudentActivities(student.id).then((res) => {
      if (res.success && res.data) {
        setActivities(
          res.data
            .filter((a) => SUPERVISOR_MANAGED_CATEGORY_IDS.includes(a.category))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        );
      } else {
        setError(res.error || "تعذّر تحميل الأنشطة");
      }
    });
  }, [student.id]);

  // Only fetch the log when the reader actually asks to see it
  useEffect(() => {
    if (mode === "manage" && activities === null && !error) loadActivities();
  }, [mode, activities, error, loadActivities]);

  const handleRecord = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await addStudentActivity(student.id, categoryId, multiplier);
      if (res.success) {
        setNotice(`تم تسجيل ${selectedCategory?.name ?? "النشاط"} باسم ${fullName}`);
        // The next recitation is an ordinary one until said otherwise
        setMultiplier(1);
        setActivities(null);
        router.refresh();
      } else {
        setError(res.error || "تعذّر تسجيل النشاط");
      }
    });
  };

  const handleChangeCategory = async (activityId: number, nextCategoryId: number) => {
    setError(null);
    setNotice(null);
    setBusyId(activityId);
    try {
      const res = await updateStudentActivityCategory(student.id, activityId, nextCategoryId);
      if (res.success) {
        setActivities((prev) =>
          (prev ?? []).map((a) => (a.id === activityId ? { ...a, category: nextCategoryId } : a)),
        );
        router.refresh();
      } else {
        setError(res.error || "تعذّر تعديل النشاط");
      }
    } catch {
      setError("تعذّر الاتصال، حاول مرة أخرى");
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeMultiplier = async (activityId: number, nextMultiplier: number) => {
    setError(null);
    setNotice(null);
    setBusyId(activityId);
    try {
      const res = await updateStudentActivityMultiplier(student.id, activityId, nextMultiplier);
      if (res.success) {
        setActivities((prev) =>
          (prev ?? []).map((a) => (a.id === activityId ? { ...a, multiplier: nextMultiplier } : a)),
        );
        router.refresh();
      } else {
        setError(res.error || "تعذّر تعديل النشاط");
      }
    } catch {
      setError("تعذّر الاتصال، حاول مرة أخرى");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (activityId: number) => {
    setError(null);
    setNotice(null);
    setBusyId(activityId);
    try {
      const res = await deleteStudentActivity(student.id, activityId);
      if (res.success) {
        setActivities((prev) => (prev ?? []).filter((a) => a.id !== activityId));
        setConfirmingId(null);
        router.refresh();
      } else {
        setError(res.error || "تعذّر حذف النشاط");
      }
    } catch {
      setError("تعذّر الاتصال، حاول مرة أخرى");
    } finally {
      setBusyId(null);
    }
  };

  const tabClass = (active: boolean) =>
    `${tajawal.className} flex-1 h-11 md:h-10 rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
      active ? "bg-[#043F2E] text-white" : "text-[#043F2E]/70 hover:bg-white hover:text-[#043F2E]"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4"
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`أنشطة ${fullName}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 md:p-6 flex flex-col gap-4"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-[#F7FBEA] flex items-center justify-center">
              <ClipboardList
                className="w-4 h-4 text-[#043F2E]"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </div>
            <h3 className={`${lalezar.className} text-lg text-[#043F2E] leading-tight`}>الأنشطة</h3>
          </div>
          <button
            type="button"
            ref={closeRef}
            onClick={requestClose}
            disabled={isBusy}
            aria-label="إغلاق"
            className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2"
          >
            <X className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {/* Student */}
        <div className="flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3">
          <div
            className="w-10 h-10 shrink-0 rounded-full bg-white border border-[#043F2E]/10 flex items-center justify-center text-[#043F2E]"
            aria-hidden="true"
          >
            <span className={`${tajawal.className} text-xs font-bold`}>
              {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
              {fullName}
            </span>
            <span className={`${tajawal.className} text-[11px] text-[#043F2E]/60 truncate`}>
              @{student.username}
            </span>
          </div>
        </div>

        {/* Mode */}
        <div
          role="group"
          aria-label="وضع الأنشطة"
          className="flex items-center gap-1 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-2xl p-1"
        >
          <button
            type="button"
            onClick={() => setMode("add")}
            aria-pressed={mode === "add"}
            className={tabClass(mode === "add")}
          >
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            تسجيل
          </button>
          <button
            type="button"
            onClick={() => setMode("manage")}
            aria-pressed={mode === "manage"}
            className={tabClass(mode === "manage")}
          >
            <Pencil className="w-4 h-4 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            تعديل
          </button>
        </div>

        <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60 leading-relaxed`}>
          تظهر هنا أنشطة التسميع والقراءة فقط، وهي ما يمكنك تسجيله أو تعديله أو حذفه لطلابك.{" "}
          {viewerIsAdmin
            ? "أما باقي الأنشطة فتُسجَّل من لوحة التحكم."
            : "أما باقي الأنشطة فيسجّلها المدراء."}
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 px-3 py-2.5"
          >
            <AlertCircle
              className="w-4 h-4 text-[#9B3D2E] shrink-0"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span className={`${tajawal.className} text-xs text-[#9B3D2E]`}>{error}</span>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl bg-[#DEFF90] border border-[#9ADD00]/40 px-3 py-2.5"
          >
            <Check
              className="w-4 h-4 text-[#043F2E] shrink-0"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className={`${tajawal.className} text-xs text-[#043F2E]`}>{notice}</span>
          </div>
        )}

        {mode === "add" ? (
          <>
            <div className="flex flex-col gap-2">
              <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>
                نوع النشاط
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    disabled={isPending}
                    aria-pressed={categoryId === cat.id}
                    className={`${tajawal.className} flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
                      categoryId === cat.id
                        ? "border-[#043F2E] bg-[#043F2E] text-white"
                        : "border-[#043F2E]/15 bg-[#F7FBEA] text-[#043F2E] hover:border-[#043F2E]/40"
                    } disabled:opacity-50`}
                  >
                    {cat.id === CAT_TASMEE ? (
                      <BookMarked className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <BookOpen className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
                    )}
                    {cat.name}
                    <span
                      className={`text-[11px] font-medium ${
                        categoryId === cat.id ? "text-[#BEE663]" : "text-[#043F2E]/60"
                      }`}
                    >
                      النقاط: +{toArabicDigits(cat.value)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Spectacular performance multiplies the activity's points */}
            <div className="flex flex-col gap-2">
              <label className={`${tajawal.className} text-xs font-bold text-[#043F2E]/70`}>
                الأداء
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MULTIPLIER_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMultiplier(m)}
                    disabled={isPending}
                    aria-pressed={multiplier === m}
                    aria-label={`المضاعف ×${toArabicDigits(m)}`}
                    className={`${tajawal.className} h-10 rounded-xl border text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
                      multiplier === m
                        ? "border-[#043F2E] bg-[#043F2E] text-white"
                        : "border-[#043F2E]/15 bg-[#F7FBEA] text-[#043F2E] hover:border-[#043F2E]/40"
                    } disabled:opacity-50`}
                  >
                    ×{toArabicDigits(m)}
                  </button>
                ))}
              </div>
              <p className={`${tajawal.className} text-[11px] text-[#043F2E]/60`}>
                {multiplier > 1 ? "أداء متميز — " : ""}
                النقاط المحتسبة: +{toArabicDigits((selectedCategory?.value ?? 0) * multiplier)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRecord}
              disabled={isPending || !selectedCategory}
              className={`${tajawal.className} h-12 rounded-xl bg-[#043F2E] text-white text-sm font-bold hover:bg-[#065f46] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} aria-hidden="true" />
                  جارٍ التسجيل...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" strokeWidth={2.4} aria-hidden="true" />
                  تسجيل النشاط
                </>
              )}
            </button>
          </>
        ) : activities === null && !error ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-[#F7FBEA] motion-safe:animate-pulse" />
            ))}
          </div>
        ) : activities === null ? null : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F7FBEA] flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-[#043F2E]/50" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
              لا توجد أنشطة تسميع أو قراءة
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activities.map((act) => {
              const cat = categories.find((c) => c.id === act.category);
              const activityName = cat?.name ?? "نشاط";
              const activityDate = formatHijriDate(act.date);
              const isConfirming = confirmingId === act.id;
              const isRowBusy = busyId === act.id;

              return (
                <div
                  key={act.id}
                  className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 flex flex-col gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}
                      >
                        {activityName}
                      </p>
                      <p
                        className={`${tajawal.className} text-[11px] text-[#043F2E]/60 flex items-center gap-1`}
                      >
                        <Calendar
                          className="w-3 h-3 shrink-0"
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
                        {activityDate}
                      </p>
                    </div>

                    {cat && (
                      <span
                        className={`${tajawal.className} text-xs font-bold text-[#043F2E] bg-white border border-[#043F2E]/10 rounded-full px-2.5 py-1 shrink-0`}
                      >
                        +{toArabicDigits(cat.value * act.multiplier)}
                      </span>
                    )}

                    {isConfirming ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          autoFocus
                          onClick={() => handleDelete(act.id)}
                          disabled={isBusy}
                          className={`${tajawal.className} h-9 px-2.5 rounded-lg bg-[#9B3D2E] text-white text-[11px] font-bold hover:bg-[#9B3D2E]/90 transition-colors disabled:opacity-50 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9B3D2E] focus-visible:ring-offset-2`}
                        >
                          {isRowBusy ? (
                            <Loader2
                              className="w-3 h-3 animate-spin"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="w-3 h-3" strokeWidth={2.5} aria-hidden="true" />
                          )}
                          تأكيد الحذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          disabled={isBusy}
                          aria-label="إلغاء الحذف"
                          className="w-9 h-9 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:text-[#043F2E] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(act.id)}
                        disabled={isBusy}
                        aria-label={`حذف ${activityName} بتاريخ ${activityDate}`}
                        title="حذف"
                        className="w-9 h-9 shrink-0 rounded-lg bg-white border border-[#043F2E]/15 flex items-center justify-center text-[#043F2E]/60 hover:border-[#9B3D2E]/40 hover:text-[#9B3D2E] transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Correcting a record is two acts: what the activity was, and
                      how strongly it was performed (the multiplier) */}
                  {!isConfirming && availableCategories.length > 1 && (
                    <div className="flex items-center gap-2">
                      {availableCategories.map((option) => {
                        const active = option.id === act.category;
                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => !active && handleChangeCategory(act.id, option.id)}
                            disabled={isBusy || active}
                            aria-pressed={active}
                            className={`${tajawal.className} flex-1 h-9 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
                              active
                                ? "bg-[#043F2E] text-white"
                                : "bg-white border border-[#043F2E]/15 text-[#043F2E]/70 hover:bg-[#BEE663]/30 hover:text-[#043F2E]"
                            } disabled:cursor-default`}
                          >
                            {isRowBusy && !active ? (
                              <Loader2
                                className="w-3 h-3 animate-spin"
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            ) : null}
                            {option.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isConfirming && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/60 shrink-0`}
                      >
                        الأداء
                      </span>
                      {multiplierOptionsFor(act.multiplier).map((m) => {
                        const active = m === act.multiplier;
                        return (
                          <button
                            type="button"
                            key={m}
                            onClick={() => !active && handleChangeMultiplier(act.id, m)}
                            disabled={isBusy || active}
                            aria-pressed={active}
                            aria-label={`المضاعف ×${toArabicDigits(m)}`}
                            className={`${tajawal.className} flex-1 h-8 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 ${
                              active
                                ? "bg-[#043F2E] text-white"
                                : "bg-white border border-[#043F2E]/15 text-[#043F2E]/70 hover:bg-[#BEE663]/30 hover:text-[#043F2E]"
                            } disabled:cursor-default`}
                          >
                            ×{toArabicDigits(m)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// Follow-up marker
// ============================
// Two different silences. A student who has recorded nothing at all for weeks has
// usually drifted away from the maqra'a; a student who simply has not recited this
// week needs a nudge. Both are the supervisor's to act on, and both stay inside
// recitation and reading — the rest is not their remit.
//
// It sits beside the name as a single mark rather than filling a column of its own:
// a supervisor scans names first, and a row of words next to every name turns the
// list into noise. The words arrive on hover, on keyboard focus, and on tap — a
// phone has no hover, so this is a real button and not a title attribute.
function FollowUpBadge({ student }: { student: SupervisedStudent }) {
  const lapsed = isLongInactive(student.last_activity_at, student.date_joined);
  const weeks = weeksSinceActivity(student.last_activity_at);

  if (!lapsed && student.recited_this_week) return null;

  const label = lapsed ? "منقطع عن النشاط" : "يحتاج إلى متابعة";
  const detail = lapsed
    ? weeks === null
      ? "لم يسجّل أي نشاط منذ انضمامه"
      : `آخر نشاط قبل ${toArabicDigits(weeks)} أسبوعًا`
    : "لم يسجّل تسميعًا ولا قراءة خلال الأسبوع";

  // Quiet by default and in the page's own green, so a row of students does not
  // read as a row of warnings. The full sentence is the accessible name, and the
  // title carries it on a desktop hover; the row prints it in full beneath the
  // name, which is where a phone reader gets it without any hover at all.
  return (
    <span
      title={`${label} — ${detail}`}
      aria-label={`${label} — ${detail}`}
      className={`${tajawal.className} inline-flex items-center gap-1 h-6 ps-1.5 pe-2 shrink-0 rounded-full border text-[11px] font-medium whitespace-nowrap ${
        lapsed
          ? "bg-[#F4E0D6] text-[#9B3D2E] border-[#9B3D2E]/25"
          : "bg-[#F7FBEA] text-[#043F2E]/70 border-[#043F2E]/15"
      }`}
    >
      {lapsed ? (
        <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <BellRing className="w-3 h-3 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      )}
      {lapsed ? "منقطع" : "متابعة"}
    </span>
  );
}

// The sentence behind the mark, printed where the row already has a second line.
// No floating layer: the students card is overflow-hidden, so anything absolutely
// positioned near its edge was being clipped.
function followUpDetail(student: SupervisedStudent): string | null {
  const lapsed = isLongInactive(student.last_activity_at, student.date_joined);
  if (!lapsed && student.recited_this_week) return null;
  if (!lapsed) return "لم يسجّل تسميعًا ولا قراءة خلال الأسبوع";
  const weeks = weeksSinceActivity(student.last_activity_at);
  return weeks === null
    ? "لم يسجّل أي نشاط منذ انضمامه"
    : `آخر نشاط قبل ${toArabicDigits(weeks)} أسبوعًا`;
}

// ============================
// Stat Tile
