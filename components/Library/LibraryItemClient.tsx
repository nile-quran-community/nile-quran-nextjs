"use client";

import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { ChevronRight } from "lucide-react";
import LibraryCard, { MixedTitle } from "@/components/Library/LibraryCard";
import {
  TELEGRAM_CHANNEL,
  libraryCategoryLabel,
  libraryTypeLabel,
  linkActionLabel,
  usesPrivateChannel,
  youtubePlaylistId,
  type LibraryItem,
  type LibraryLink,
} from "@/lib/library";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export default function LibraryItemClient({
  item,
  related,
}: {
  item: LibraryItem;
  related: LibraryItem[];
}) {
  const playlistId = item.type === "playlist" ? youtubePlaylistId(item.url) : null;
  const isPlayer = item.type === "playlist" && Boolean(playlistId);

  return (
    <div className="min-h-screen w-full bg-[#EBF0EB]">
      <div dir="rtl" className="mx-auto flex w-full min-w-0 max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-12">
        <Link
          href="/library"
          className={`${tajawal.className} mb-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-2xl border border-[#043F2E]/15 bg-white px-4 text-sm font-bold text-[#043F2E]`}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          رجوع إلى المكتبة
        </Link>

        <article
          className="flex flex-col gap-5 rounded-3xl border border-[#043F2E]/10 bg-white p-4 md:p-5 lg:flex-row lg:items-start"
        >
          <div className={isPlayer ? "min-w-0 w-full flex-[1.15]" : "w-full min-w-0 shrink-0 lg:w-auto"}>
            {isPlayer ? (
              <iframe
                className="aspect-video w-full rounded-2xl border-0 bg-[#043F2E]"
                title={item.title}
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : item.cover ? (
              <img
                src={item.cover}
                alt=""
                className={
                  item.type === "book"
                    ? "m-2.5 h-auto max-h-52 w-auto max-w-full object-contain sm:max-h-60"
                    : "h-auto w-full max-w-full rounded-xl object-contain sm:max-w-md"
                }
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h1>
              <MixedTitle
                text={item.title}
                className={`${lalezar.className} block text-2xl leading-snug text-[#043F2E] sm:text-3xl`}
              />
            </h1>
            <p className={`${tajawal.className} mt-3 flex flex-wrap gap-2 text-[13px] font-bold sm:text-xs`}>
              <span className="rounded-full bg-[#F7FBEA] px-2.5 py-1">{libraryTypeLabel(item.type)}</span>
              {item.categories.map((id) => (
                <span key={id} className="rounded-full bg-[#F7FBEA] px-2.5 py-1">
                  {libraryCategoryLabel(id)}
                </span>
              ))}
            </p>
            {item.type === "book" ? (
              <p
                role="note"
                className={`${tajawal.className} mt-4 rounded-2xl border border-[#9B3D2E]/30 bg-[#F4E0D6] p-4 text-sm font-bold leading-7 text-[#9B3D2E] md:text-base`}
              >
                إن كنت قادرًا على الشراء، فاشترِ الكتاب ورقيًا من المكتبة. روابط القراءة المجانية لمن لا
                يقدر على الشراء.
              </p>
            ) : null}
            <MessageText text={item.text} />
            <ItemLinks item={item} />
            {usesPrivateChannel(item) ? (
              <div className={`${tajawal.className} mt-4 flex flex-col items-start gap-2 rounded-2xl bg-[#F7FBEA] p-3 text-[15px] leading-7 text-[#043F2E] sm:text-sm`}>
                <QuietLink href={TELEGRAM_CHANNEL.invite}>انضم إلى القناة أولًا</QuietLink>
                <p>القناة خاصة، ولن يُفتح رابط التحميل قبل الانضمام إليها.</p>
              </div>
            ) : null}
          </div>
        </article>

        {related.length > 0 ? (
          <section className="mt-8">
            <h2 className={`${lalezar.className} mb-3 text-2xl text-[#043F2E]`}>المزيد</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {related.map((relatedItem) => (
                <LibraryCard key={relatedItem.id} item={relatedItem} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ItemLinks({ item }: { item: LibraryItem }) {
  const downloads = item.download ?? [];
  const purchases = item.purchase ?? [];
  const mainLabel = item.url ? linkActionLabel(item.url) : libraryTypeLabel(item.type);

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      {item.url && item.type !== "playlist" ? <QuietLink href={item.url}>{mainLabel}</QuietLink> : null}
      {item.url && item.type === "playlist" && !youtubePlaylistId(item.url) ? (
        <QuietLink href={item.url}>{linkActionLabel(item.url)}</QuietLink>
      ) : null}
      {downloads.map((link) => (
        <QuietLink key={link.url} href={link.url}>
          {downloadCaption(link, downloads.length)}
        </QuietLink>
      ))}
      {purchases.map((link) => (
        <QuietLink key={link.url} href={link.url}>
          {`اشترِ من ${link.store}`}
        </QuietLink>
      ))}
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g).filter((part) => part.length > 0);
  const hasComment = parts.some((part) => !part.startsWith("http") && part.trim().length > 0);
  if (!hasComment) return null;

  return (
    <p className={`${tajawal.className} mt-4 whitespace-pre-wrap text-[15px] font-normal leading-8 text-[#043F2E]/80 sm:text-sm`}>
      {parts.map((part, index) =>
        part.startsWith("http") ? (
          <span key={`${part}-${index}`} className="mx-1 inline-block">
            <QuietLink href={part}>{linkActionLabel(part)}</QuietLink>
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

function downloadCaption(link: LibraryLink, total: number): string {
  if (total > 1) return `اقرأ مجانًا — ${link.label}`;
  return "اقرأ مجانًا";
}

function QuietLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${tajawal.className} text-[15px] font-medium text-[#043F2E] underline underline-offset-4 sm:text-sm`}
    >
      {children}
    </a>
  );
}
