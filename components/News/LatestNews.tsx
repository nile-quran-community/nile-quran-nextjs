import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { ChevronLeft, Newspaper } from "lucide-react";
import type { Announcement } from "@/actions/announcements";
import { formatHijriDate } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

// `null` means the fetch failed, which is not the same as "nothing posted yet"
export default function LatestNews({ announcements }: { announcements: Announcement[] | null }) {
  return (
    <section
      dir="rtl"
      className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
          <Newspaper className="w-5 h-5" strokeWidth={2.2} />
        </div>
        <h2 className={`${lalezar.className} text-2xl text-[#043F2E] leading-tight`}>
          آخر الإعلانات
        </h2>
      </div>

      <div className="h-px bg-[#043F2E]/8" />

      {announcements === null ? (
        <div className="rounded-2xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-4 flex flex-col gap-2">
          <span className={`${tajawal.className} text-sm font-bold text-[#9B3D2E]`}>
            تعذر تحميل الإعلانات
          </span>
          <Link
            href="/"
            className={`${tajawal.className} text-xs font-bold text-[#9B3D2E] underline`}
          >
            إعادة المحاولة
          </Link>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl bg-[#F7FBEA] border border-[#043F2E]/8 p-4 text-center">
          <span className={`${tajawal.className} text-[#043F2E]/50 text-sm font-medium`}>
            لا توجد إعلانات بعد، سنخبرك بكل جديد هنا بإذن الله
          </span>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-[#043F2E]/8">
            {announcements.map((a) => (
              <Link
                key={a.id}
                href={`/news/${a.id}`}
                className="flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0 group"
              >
                <span
                  className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
                >
                  {a.type_display}
                  {a.publish_at && ` · ${formatHijriDate(a.publish_at)}`}
                </span>
                <h3
                  className={`${lalezar.className} text-lg text-[#043F2E] leading-tight group-hover:text-[#065f46] transition-colors`}
                >
                  {a.title}
                </h3>
                <p
                  dir="auto"
                  className={`${tajawal.className} text-sm text-[#043F2E]/70 line-clamp-2`}
                >
                  {a.summary}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/news"
            className={`${tajawal.className} flex items-center gap-1 text-sm font-bold text-[#043F2E] hover:text-[#065f46] transition-colors`}
          >
            عرض كل الإعلانات
            <ChevronLeft className="w-4 h-4" strokeWidth={2.4} />
          </Link>
        </>
      )}
    </section>
  );
}
