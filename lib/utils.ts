import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { hijriToGregorian, gregorianToHijri } from "@tabby_ai/hijri-converter";

export interface WeekRange {
  start: string;
  end: string;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
export const toArabicDigits = (num: number | string) => {
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
};
