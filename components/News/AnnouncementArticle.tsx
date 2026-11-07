import type { ReactNode } from "react";
import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { CalendarDays, Clock, Lock, Pencil, UserRound } from "lucide-react";
import type { Announcement, AnnouncementPreview } from "@/actions/announcements";
import {
  STATUS_LABELS,
  authorName,
  lastEditorName,
  readingMinutes,
  replaceMentions,
} from "@/lib/announcements";
import { formatHijriDate, toArabicDigits } from "@/lib/utils";
import ArticleBody from "./ArticleBody";
import Pattern from "./Pattern";
import ShareButtons from "./ShareButtons";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

function Hero({
  type,
  title,
  summary,
  children,
}: {
  type: string;
  title: string;
  summary: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative text-white overflow-hidden">
      <Pattern className="absolute inset-0" />
      <div className="relative max-w-3xl mx-auto px-6 md:px-10 py-14 md:py-20 flex flex-col gap-4">
        <span
          className={`${tajawal.className} self-start rounded-full bg-[#BEE663] px-3 py-1 text-xs font-bold text-[#043F2E]`}
        >
          {type}
        </span>
        <h1 className={`${lalezar.className} text-3xl md:text-5xl leading-tight`}>{title}</h1>
        <p dir="auto" className={`${tajawal.className} text-base md:text-lg text-white/75`}>
          {summary}
        </p>
        {children}
      </div>
    </section>
  );
}

function MetaItem({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-[#BEE663]" strokeWidth={2.2} />
      {children}
    </span>
  );
}

const metaClass = `${tajawal.className} flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80`;

// Members get the whole announcement
export function AnnouncementArticle({
  announcement: a,
  canEdit,
}: {
  announcement: Announcement;
  canEdit: boolean;
}) {
  const editor = lastEditorName(a.created_by, a.updated_by);

  return (
    <article dir="rtl" className="w-full bg-[#EBF0EB] min-h-screen">
      <Hero type={a.type_display} title={a.title} summary={a.summary}>
        <div className={metaClass}>
          <MetaItem icon={UserRound}>{authorName(a.created_by)}</MetaItem>
          {a.publish_at && (
            <MetaItem icon={CalendarDays}>
              <time dateTime={a.publish_at}>{formatHijriDate(a.publish_at)}</time>
            </MetaItem>
          )}
          <MetaItem icon={Clock}>{toArabicDigits(readingMinutes(a.content))} د للقراءة</MetaItem>
          {canEdit && a.status !== "published" && (
            // For the people running announcements. Status is about Discord delivery (and
            // drafts/scheduling), which a reader doesn't need: anything past its publish time is
            // already on the site for them, whether or not the Discord post has gone out yet.
            <span className="rounded-full bg-[#DEFF90] px-2.5 py-0.5 text-xs font-bold text-[#043F2E]">
              {STATUS_LABELS[a.status]}
            </span>
          )}
        </div>
        {editor && (
          <p className={`${tajawal.className} text-xs text-white/60`}>آخر تعديل بواسطة {editor}</p>
        )}
      </Hero>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">
        <ArticleBody content={replaceMentions(a.content, a.mentions)} />

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#043F2E]/10">
          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/news/editor/${a.id}`}
                className={`${tajawal.className} flex items-center gap-1.5 px-4 h-10 rounded-xl border border-[#043F2E]/20 text-[#043F2E] hover:bg-white text-sm font-bold transition-colors`}
              >
                <Pencil className="w-4 h-4" strokeWidth={2.4} />
                تعديل
              </Link>
            )}
            <ShareButtons id={a.id} title={a.title} />
          </div>
        </div>
      </div>
    </article>
  );
}

// Anyone with the link gets the teaser. The body is never fetched for them, so there is
// nothing hidden in the page for a curious reader to dig out.
export function AnnouncementTeaser({ announcement: a }: { announcement: AnnouncementPreview }) {
  return (
    <article dir="rtl" className="w-full bg-[#EBF0EB] min-h-screen">
      <Hero type={a.type_display} title={a.title} summary={a.summary}>
        <div className={metaClass}>
          <MetaItem icon={CalendarDays}>
            <time dateTime={a.publish_at}>{formatHijriDate(a.publish_at)}</time>
          </MetaItem>
        </div>
      </Hero>

      <div className="max-w-3xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-6 md:p-8 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
            <Lock className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <h2 className={`${lalezar.className} text-2xl text-[#043F2E]`}>
            الإعلان كاملاً لأعضاء المقرأة
          </h2>
          <p className={`${tajawal.className} text-sm text-[#043F2E]/70 max-w-md`}>
            سجّل دخولك بحسابك في مقرأة النيل لقراءة الإعلان كاملاً.
          </p>
          <Link
            href={`/auth?next=${encodeURIComponent(`/news/${a.id}`)}`}
            className={`${tajawal.className} px-6 h-11 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] font-bold flex items-center transition-colors`}
          >
            سجّل دخولك لقراءة الإعلان
          </Link>
        </section>
      </div>
    </article>
  );
}
