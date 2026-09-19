import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { hijriToGregorian, gregorianToHijri } from "@tabby_ai/hijri-converter";
import type { Goal } from "@/actions/goal";

export interface WeekRange {
  start: string;
  end: string;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`;
}

export function getHijriMonth(monthIndex: number): string {
  const hijriMonths = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الثاني",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];

  return hijriMonths[monthIndex];
}

export const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// "today" in the community's own timezone rather than the server process's — matters near
// midnight when the server (e.g. a UTC Docker container) and Cairo disagree on the date.
// ponytail: hardcoded to Africa/Cairo; promote to an env-configured timezone if the platform
// ever serves communities outside Egypt.
export const getTodayDateString = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

export const formatArabicNumber = (n: number) => toArabicDigits(n.toLocaleString("en-US"));

export function getGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.max((current / target) * 100, 0), 100);
}

// A date field may come back as a bare "YYYY-MM-DD" or a full datetime — compare only the date part.
function dateOnly(d: string | null): string | null {
  return d ? d.slice(0, 10) : null;
}

// An unset start/end date is treated as open-ended (already started / never ending) rather than
// excluded — the backend's date-range filters can't express "or null", and goals created before
// start/end dates existed in the admin UI have neither set, so filtering server-side would
// silently hide them. Shared by the home page's current-goals filter and the goals page's status
// pills so the two surfaces can't disagree on which goals count as active.
export function getGoalStatus(goal: Goal, today: string): "current" | "upcoming" | "ended" {
  const start = dateOnly(goal.start_date);
  const end = dateOnly(goal.end_date);
  if (start && start > today) return "upcoming";
  if (end && end < today) return "ended";
  return "current";
}

export function getHijriMonthDays(year: number, month: number) {
  // 1. نحول يوم 29 من الشهر الهجري المطلوب إلى ميلادي
  const gregResult = hijriToGregorian({ year, month, day: 29 });

  // ملاحظة: في كائن Date في جافاسكريبت، الأشهر تبدأ من 0، لذا ننقص 1 من الشهر
  const gregDate = new Date(gregResult.year, gregResult.month - 1, gregResult.day);

  // 2. نضيف يوماً واحداً للتاريخ الميلادي
  gregDate.setDate(gregDate.getDate() + 1);

  // 3. نحول التاريخ الجديد (اليوم التالي) مرة أخرى إلى هجري
  const nextHijriDate = gregorianToHijri({
    year: gregDate.getFullYear(),
    month: gregDate.getMonth() + 1, // نعيد الشهر ليصبح 1-based
    day: gregDate.getDate(),
  });

  // 4. إذا كان اليوم التالي هو 30، فإن الشهر 30 يوماً. وإلا فهو 29.
  return nextHijriDate.day === 30 ? 30 : 29;
}
// The community's week, bucketed the way the control board does it: Hijri days
// 1-7, 8-14, 15-21, and 22-to-month-end (29 or 30). The board draws one checkbox
// per category per week, so a week is also the unit a recitation belongs to —
// two records in the same week are something it cannot represent.
export function getHijriWeekRange(year: number, month: number, weekIndex: number): WeekRange {
  // NaN passes both comparisons on its own, and an unparseable date reaches here
  // as exactly that — better to throw than to hand back "NaN-NaN-NaN" as a filter
  if (!Number.isInteger(weekIndex) || weekIndex < 1 || weekIndex > 4) {
    throw new Error(`Invalid weekIndex: ${weekIndex}`);
  }

  const startDay = (weekIndex - 1) * 7 + 1;
  const endDay = weekIndex === 4 ? getHijriMonthDays(year, month) : weekIndex * 7;
  const iso = (day: number) => {
    const g = hijriToGregorian({ year, month, day });
    return `${g.year}-${String(g.month).padStart(2, "0")}-${String(g.day).padStart(2, "0")}`;
  };

  return { start: iso(startDay), end: iso(endDay) };
}

// The week a given Gregorian "YYYY-MM-DD" falls in
export function getHijriWeekRangeForDate(isoDate: string): WeekRange {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  const hijri = gregorianToHijri({ year, month, day });
  return getHijriWeekRange(hijri.year, hijri.month, Math.min(Math.ceil(hijri.day / 7), 4));
}

// Do two Gregorian dates fall in the same Hijri week? This is what decides
// membership — both on the server and in the browser, so the two cannot disagree
// about whether a record belongs to the week being looked at.
export function sameHijriWeek(a: string, b: string): boolean {
  return getHijriWeekRangeForDate(a).start === getHijriWeekRangeForDate(b).start;
}

function shiftDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The Gregorian window to ask the API for when you want a Hijri week's records,
// padded by three days on each side: the API filters on Gregorian bounds derived
// here by converting Hijri days, so a boundary that lands a day out would
// otherwise hide the very record being looked for. The padding costs nothing — a
// week holds a handful of rows — and `sameHijriWeek` is what decides membership.
export function getHijriWeekQueryRange(isoDate: string): WeekRange {
  const week = getHijriWeekRangeForDate(isoDate);
  return { start: shiftDays(week.start, -3), end: shiftDays(week.end, 3) };
}

// One month back in the Hijri calendar, wrapping the year at Muharram
export function getPreviousHijriMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export const toArabicDigits = (num: number | string) => {
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};

const gregorianMonthsArabic = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

// "٢٢ أغسطس ٢٠٢٦" — returns the raw string when the date cannot be parsed
export function formatArabicDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${toArabicDigits(d.getDate())} ${gregorianMonthsArabic[d.getMonth()]} ${toArabicDigits(d.getFullYear())}`;
}

// "٩ ربيع الأول ١٤٤٨ هـ" — the maqra'a counts its months in Hijri, so dates that
// belong to the community's own calendar are written in it
export function formatHijriDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const hijri = gregorianToHijri({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
  return `${toArabicDigits(hijri.day)} ${getHijriMonth(hijri.month - 1)} ${toArabicDigits(hijri.year)} هـ`;
}
