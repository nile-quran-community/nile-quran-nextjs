import { Tajawal } from "next/font/google";
import { UserCheck, UserPlus, Calendar, Mail } from "lucide-react";
import type { ProfileVisibility } from "@/lib/profile-types";
import { toArabicDigits } from "@/lib/utils";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  supervisor: string | null;
  referrer: string | null;
  email: string;
  dateJoined: string;
  visibility: ProfileVisibility;
}

function formatDateArabic(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    return `${toArabicDigits(d.getDate())} ${months[d.getMonth()]} ${toArabicDigits(d.getFullYear())}`;
  } catch {
    return dateStr;
  }
}

export default function ProfileMetaInfo({
  supervisor,
  referrer,
  email,
  dateJoined,
  visibility,
}: Props) {
  const items: Array<{
    show: boolean;
    icon: React.ReactNode;
    label: string;
    value: string;
  }> = [
    {
      show: visibility.showSupervisor,
      icon: <UserCheck className="w-4 h-4" strokeWidth={2.2} />,
      label: "المشرف",
      value: supervisor || "بدون مشرف",
    },
    {
      show: visibility.showReferrer,
      icon: <UserPlus className="w-4 h-4" strokeWidth={2.2} />,
      label: "الجهة المرجعة",
      value: referrer || "بدون",
    },
    {
      show: visibility.showEmail,
      icon: <Mail className="w-4 h-4" strokeWidth={2.2} />,
      label: "البريد الإلكتروني",
      value: email,
    },
    {
      show: visibility.showDateJoined,
      icon: <Calendar className="w-4 h-4" strokeWidth={2.2} />,
      label: "تاريخ الانضمام",
      value: formatDateArabic(dateJoined),
    },
  ];

  const visibleItems = items.filter((item) => item.show);
  if (visibleItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" dir="rtl">
      {visibleItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 bg-[#F7FBEA] rounded-xl border border-[#043F2E]/8 px-4 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-[#043F2E]/5 flex items-center justify-center shrink-0 text-[#043F2E]/70">
            {item.icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>
              {item.label}
            </span>
            <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
