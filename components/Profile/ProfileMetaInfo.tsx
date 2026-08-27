import { Tajawal } from "next/font/google";
import { UserCheck, UserPlus, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import type { ProfileVisibility } from "@/lib/profile-types";
import { formatHijriDate } from "@/lib/utils";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface PersonInfo {
  id: number;
  fullName: string;
  username: string;
}

interface Props {
  supervisor: PersonInfo | null;
  referrer: PersonInfo | null;
  email: string;
  dateJoined: string;
  visibility: ProfileVisibility;
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
    linkHref?: string;
  }> = [
    {
      // Only when there is one to name. The header states the supervisor for a
      // member who has one, so this row exists for the screens that have no header
      // statement — and an empty row saying "بدون مشرف" is a fact nobody needs.
      show: visibility.showSupervisor && Boolean(supervisor),
      icon: <UserCheck className="w-4 h-4" strokeWidth={2.2} />,
      label: "المشرف",
      value: supervisor?.fullName ?? "",
      linkHref: supervisor ? `/profile/${encodeURIComponent(supervisor.username)}` : undefined,
    },
    {
      show: visibility.showReferrer && Boolean(referrer),
      icon: <UserPlus className="w-4 h-4" strokeWidth={2.2} />,
      label: "بدعوة من",
      value: referrer?.fullName ?? "",
      linkHref: referrer ? `/profile/${encodeURIComponent(referrer.username)}` : undefined,
    },
    {
      show: visibility.showEmail && Boolean(email),
      icon: <Mail className="w-4 h-4" strokeWidth={2.2} />,
      label: "البريد الإلكتروني",
      value: email,
    },
    {
      show: visibility.showDateJoined && Boolean(dateJoined),
      icon: <Calendar className="w-4 h-4" strokeWidth={2.2} />,
      label: "تاريخ الانضمام",
      value: formatHijriDate(dateJoined),
    },
  ];

  const visibleItems = items.filter((item) => item.show);
  if (visibleItems.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" dir="rtl">
      {visibleItems.map((item) => {
        const content = (
          <div
            className={`flex items-center gap-3 bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 h-full transition-colors motion-reduce:transition-none ${
              item.linkHref ? "group-hover:border-[#043F2E]/30 group-hover:bg-white" : ""
            }`}
          >
            <div
              className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 text-[#043F2E]/70"
              aria-hidden="true"
            >
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/60`}>
                {item.label}
              </span>
              <span className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate ${item.linkHref ? "group-hover:underline" : ""}`}>
                {item.value}
              </span>
            </div>
          </div>
        );

        if (item.linkHref) {
          return (
            <Link
              key={item.label}
              href={item.linkHref}
              className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2"
            >
              {content}
            </Link>
          );
        }

        return <div key={item.label}>{content}</div>;
      })}
    </div>
  );
}
