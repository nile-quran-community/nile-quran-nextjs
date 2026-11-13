"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tajawal } from "next/font/google";
import { Newspaper, Search } from "lucide-react";
import {
  getAnnouncements,
  type Announcement,
  type AnnouncementPage,
} from "@/actions/announcements";
import AnnouncementCard from "./AnnouncementCard";
import { Spinner } from "../ui/spinner";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

export interface TypeChip {
  value: string;
  label: string;
}

interface Props {
  // null when the first fetch failed
  initial: AnnouncementPage | null;
  chips: TypeChip[];
}

const chipClass = (active: boolean) =>
  `${tajawal.className} px-3.5 h-9 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
    active ? "bg-[#043F2E] text-white shadow-sm" : "text-[#043F2E] hover:bg-white/50"
  }`;

export default function NewsListClient({ initial, chips }: Props) {
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Announcement[]>(initial?.results ?? []);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(!!initial?.next);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initial === null);
  // A slow response to an older filter must not overwrite a newer one
  const latest = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const request = ++latest.current;
      setLoading(true);
      setFailed(false);
      const res = await getAnnouncements({
        page: target,
        type,
        in_title: query.trim(),
        live: true,
        ordering: "-publish_at",
      });
      if (request !== latest.current) return;
      setLoading(false);
      if (!res.success) {
        setFailed(true);
        return;
      }
      setItems((prev) => (target === 1 ? res.data.results : [...prev, ...res.data.results]));
      setHasNext(!!res.data.next);
      setPage(target);
    },
    [type, query],
  );

  // The first page is already on screen from the server render; only a changed filter
  // fetches, after a short pause so typing doesn't fire a request per letter.
  // React runs effects twice in development, so a "first run" flag let a second needless
  // fetch through, and the list flashed its loading state right after arriving.
  const filters = JSON.stringify([type, query.trim()]);
  const shown = useRef(filters);
  useEffect(() => {
    if (filters === shown.current) return;
    const timer = setTimeout(() => {
      shown.current = filters;
      load(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, load]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
            strokeWidth={2.2}
          />
          {/* No dir="auto" here: a Latin first letter would flip the box away from the icon */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في العناوين..."
            className={`${tajawal.className} w-full h-11 pr-10 pl-3.5 bg-white border border-[#043F2E]/15 rounded-xl text-sm text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40 transition-colors`}
          />
        </div>
        {chips.length > 1 && (
          <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-[#DEFF90]/50">
            <button type="button" className={chipClass(type === "")} onClick={() => setType("")}>
              الكل
            </button>
            {chips.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={chipClass(type === chip.value)}
                onClick={() => setType(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {failed ? (
        <div className="rounded-2xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-5 flex items-center justify-between gap-3">
          <span className={`${tajawal.className} text-sm font-bold text-[#9B3D2E]`}>
            تعذر تحميل الإعلانات
          </span>
          <button
            type="button"
            onClick={() => load(1)}
            className={`${tajawal.className} px-4 h-9 rounded-xl bg-[#9B3D2E] text-white text-sm font-bold cursor-pointer`}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="grid gap-5 sm:grid-cols-2" aria-busy>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-white border border-[#043F2E]/10 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#043F2E]/10 p-10 flex flex-col items-center gap-3 text-center">
          <Newspaper className="w-8 h-8 text-[#043F2E]/30" strokeWidth={2} />
          <span className={`${tajawal.className} text-[#043F2E]/60 text-sm font-medium`}>
            {query || type
              ? "لا توجد إعلانات مطابقة"
              : "لا توجد إعلانات بعد، سنخبرك بكل جديد هنا بإذن الله"}
          </span>
        </div>
      ) : (
        <div className={`grid gap-5 sm:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {items.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}

      {hasNext && !failed && (
        <button
          type="button"
          disabled={loading}
          onClick={() => load(page + 1)}
          className={`${tajawal.className} self-center flex items-center gap-2 px-6 h-11 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] font-bold transition-colors cursor-pointer disabled:opacity-60`}
        >
          {loading && <Spinner />}
          عرض المزيد
        </button>
      )}
    </div>
  );
}
