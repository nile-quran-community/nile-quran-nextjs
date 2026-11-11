import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import type { Announcement } from "@/actions/announcements";
import { authorName, readingMinutes } from "@/lib/announcements";
import { formatHijriDate, toArabicDigits } from "@/lib/utils";
import Pattern from "./Pattern";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

export default function AnnouncementCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <Link
      href={`/news/${a.id}`}
      className="group bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm overflow-hidden flex flex-col hover:border-[#043F2E]/30 transition-colors"
    >
      <Pattern className="h-20" />
      <div className="p-5 md:p-6 flex flex-col gap-2.5">
        <span
          className={`${tajawal.className} self-start rounded-full bg-[#DEFF90] px-2.5 py-0.5 text-[11px] font-bold text-[#043F2E]`}
        >
          {a.type_display}
        </span>
        <h2 className={`${lalezar.className} text-2xl text-[#043F2E] leading-tight`}>{a.title}</h2>
        <p dir="auto" className={`${tajawal.className} text-sm text-[#043F2E]/70 line-clamp-3`}>
          {a.summary}
        </p>
        <div
          className={`${tajawal.className} mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#043F2E]/60`}
        >
          <span className="flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5" strokeWidth={2.2} />
            {authorName(a.created_by)}
          </span>
          {a.publish_at && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" strokeWidth={2.2} />
              {formatHijriDate(a.publish_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
            {toArabicDigits(readingMinutes(a.content))} د للقراءة
          </span>
        </div>
      </div>
    </Link>
  );
}
