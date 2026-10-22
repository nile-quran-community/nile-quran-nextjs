"use client";

import { useMemo, useState } from "react";
import { Tajawal } from "next/font/google";
import { BookOpen, Search } from "lucide-react";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import LibraryCard from "@/components/Library/LibraryCard";
import { formatArabicNumber } from "@/lib/utils";
import {
  LIBRARY_CATEGORIES,
  LIBRARY_TAGS,
  filterLibraryItems,
  libraryItems,
  type LibraryCategoryId,
  type LibraryType,
} from "@/lib/library";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

export default function LibraryPageClient() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategoryId | null>(null);
  const [tag, setTag] = useState<LibraryType | null>(null);

  const results = useMemo(
    () => filterLibraryItems(libraryItems, category, tag, query),
    [category, tag, query],
  );

  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const item of libraryItems) {
      for (const id of item.categories) byCategory.set(id, (byCategory.get(id) ?? 0) + 1);
    }
    return byCategory;
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#EBF0EB]">
      <PageHero>
        <PageHeroHeading
          icon={BookOpen}
          eyebrow="سلاسل وكتب"
          title="المكتبة"
          subtitle="الأقسام شبكة. العناصر بطاقات. النوع اختياري."
        />
      </PageHero>

      <div dir="rtl" className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6 sm:py-10 md:px-10 md:py-14">
        <div className="relative">
          <Search
            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#043F2E]/50"
            strokeWidth={2.2}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في العنوان أو النص"
            aria-label="بحث في المكتبة"
            className={`${tajawal.className} h-11 w-full rounded-xl border border-[#043F2E]/15 bg-white pr-10 pl-3.5 text-sm text-[#043F2E] placeholder:text-[#043F2E]/40 focus:border-[#043F2E]/40 focus:outline-none`}
          />
        </div>

        <section>
          <h2 className={`${tajawal.className} mb-2 text-sm font-bold text-[#043F2E]/60 sm:mb-3`}>الأقسام</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-5" role="group" aria-label="القسم">
            <SectionButton
              active={category === null}
              label="الكل"
              count={libraryItems.length}
              onClick={() => setCategory(null)}
            />
            {LIBRARY_CATEGORIES.map((item) => (
              <SectionButton
                key={item.id}
                active={category === item.id}
                label={item.label}
                count={counts.get(item.id) ?? 0}
                onClick={() => setCategory(item.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className={`${tajawal.className} mb-2 text-sm font-bold text-[#043F2E]/60 sm:mb-3`}>النوع</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="النوع">
            {LIBRARY_TAGS.map((item) => {
              const active = tag === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTag((current) => (current === item.id ? null : item.id))}
                  className={`${tajawal.className} inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold sm:min-h-8 sm:px-2.5 sm:text-xs ${
                    active
                      ? "border-[#043F2E] bg-[#043F2E] text-white"
                      : "border-[#043F2E]/10 bg-white text-[#043F2E]"
                  }`}
                >
                  {item.label}
                  {active ? <span aria-hidden="true">×</span> : null}
                </button>
              );
            })}
          </div>
          <p className={`${tajawal.className} mt-2 text-[13px] leading-6 text-[#043F2E]/60 sm:text-sm`}>
            اختيار النوع ليس لازمًا. إن اخترته، اضغطه مرة أخرى لإزالته.
          </p>
        </section>

        <p role="status" className={`${tajawal.className} text-sm font-medium text-[#043F2E]/60`}>
          {formatArabicNumber(results.length)} نتيجة
        </p>

        {results.length === 0 ? (
          <div className="rounded-3xl border border-[#043F2E]/10 bg-white px-6 py-16 text-center">
            <h2 className={`${tajawal.className} text-lg font-bold text-[#043F2E]`}>لا توجد نتائج</h2>
            <p className={`${tajawal.className} mt-1 text-sm text-[#043F2E]/60`}>
              جرّب قسمًا آخر، أو أزل التصفية والبحث.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {results.map((item) => (
              <LibraryCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${tajawal.className} min-h-11 w-full rounded-2xl border px-2.5 py-2 text-right text-[13px] font-bold leading-5 sm:min-h-16 sm:px-3 sm:py-3 sm:text-sm ${
        active ? "border-[#043F2E] bg-[#043F2E] text-white" : "border-[#043F2E]/10 bg-white text-[#043F2E]"
      }`}
    >
      <span className="block break-words">{label}</span>
      <span className={`mt-0.5 block text-[11px] sm:mt-1 sm:text-xs ${active ? "text-[#BEE663]" : "text-[#043F2E]/50"}`}>
        {formatArabicNumber(count)} عنصر
      </span>
    </button>
  );
}
