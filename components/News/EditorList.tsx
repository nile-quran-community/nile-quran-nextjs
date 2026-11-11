"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lalezar, Tajawal } from "next/font/google";
import { Plus, Search } from "lucide-react";
import {
  getAnnouncements,
  type Announcement,
  type AnnouncementPage,
  type AnnouncementStatus,
  type TypeOption,
} from "@/actions/announcements";
import { STATUS_LABELS, attemptsLabel, authorName } from "@/lib/announcements";
import { formatHijriDate } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import DeleteButton from "./DeleteButton";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

const STATUS_STYLE: Record<AnnouncementStatus, string> = {
  draft: "bg-white border border-[#043F2E]/20 text-[#043F2E]/70",
  scheduled: "bg-[#F7FBEA] border border-[#043F2E]/20 text-[#043F2E]",
  pending: "bg-[#DEFF90] text-[#043F2E]",
  published: "bg-[#BEE663] text-[#043F2E]",
  failed: "bg-[#F4E0D6] text-[#9B3D2E]",
};

const selectClass = `${tajawal.className} h-11 px-3 bg-white border border-[#043F2E]/15 rounded-xl text-sm text-[#043F2E] focus:outline-none focus:border-[#043F2E]/40`;

export default function EditorList({
  initial,
  typeOptions,
}: {
  // null when the first fetch failed
  initial: AnnouncementPage | null;
  typeOptions: TypeOption[];
}) {
  const [type, setType] = useState("");
  const [status, setStatus] = useState<AnnouncementStatus | "">("");
  const [author, setAuthor] = useState("");
  const [items, setItems] = useState<Announcement[]>(initial?.results ?? []);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(!!initial?.next);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initial === null);
  const latest = useRef(0);

  const load = useCallback(
    async (target: number) => {
      const request = ++latest.current;
      setLoading(true);
      setFailed(false);
      const res = await getAnnouncements({
        page: target,
        type,
        status: status || undefined,
        created_by: author.trim(),
        ordering: "-created_at",
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
    [type, status, author],
  );

  // React runs effects twice in development, so a "first run" flag let a second needless
  // fetch through, and the list flashed its loading state right after arriving.
  const filters = JSON.stringify([type, status, author.trim()]);
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
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="">كل الأنواع</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AnnouncementStatus | "")}
            className={selectClass}
          >
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as AnnouncementStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/50"
              strokeWidth={2.2}
            />
            {/* No dir="auto": usernames start with Latin letters and would flip away from the icon */}
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="اسم مستخدم الكاتب"
              className={`${tajawal.className} w-44 h-11 pr-10 pl-3.5 bg-white border border-[#043F2E]/15 rounded-xl text-sm text-[#043F2E] placeholder:text-[#043F2E]/40 focus:outline-none focus:border-[#043F2E]/40`}
            />
          </div>
        </div>
        <Link
          href="/news/editor/new"
          className={`${tajawal.className} flex items-center gap-1.5 px-4 h-11 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold transition-colors`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          إعلان جديد
        </Link>
      </div>

      {failed ? (
        <div className="rounded-2xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-5 flex items-center justify-between gap-3">
          <span className={`${tajawal.className} text-sm font-bold text-[#9B3D2E]`}>
            تعذر تحميل الأخبار
          </span>
          <button
            type="button"
            onClick={() => load(1)}
            className={`${tajawal.className} px-4 h-9 rounded-xl bg-[#9B3D2E] text-white text-sm font-bold cursor-pointer`}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-[#043F2E]/10 p-10 text-center">
          <span className={`${tajawal.className} text-[#043F2E]/60 text-sm font-medium`}>
            {loading ? "جارٍ التحميل..." : "لا توجد أخبار مطابقة"}
          </span>
        </div>
      ) : (
        <div className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((a) => (
            <Row
              key={a.id}
              announcement={a}
              onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== a.id))}
            />
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

function Row({
  announcement: a,
  onDeleted,
}: {
  announcement: Announcement;
  onDeleted: () => void;
}) {
  // The latest failed attempt explains a "failed" status; the cron retries it on its own
  const failure =
    a.status === "failed" ? a.deliveries?.find((d) => d.status === "failed") : undefined;

  return (
    <article className="bg-white rounded-2xl border border-[#043F2E]/10 shadow-sm p-4 md:p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`${tajawal.className} rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[a.status]}`}
            >
              {STATUS_LABELS[a.status]}
            </span>
            <span className={`${tajawal.className} text-xs text-[#043F2E]/50`}>
              {a.type_display}
            </span>
          </div>
          <Link
            href={`/news/${a.id}`}
            dir="auto"
            className={`${lalezar.className} text-xl text-[#043F2E] leading-tight hover:text-[#065f46] transition-colors`}
          >
            {a.title}
          </Link>
          <span className={`${tajawal.className} text-xs text-[#043F2E]/60`}>
            {authorName(a.created_by)}
            {a.publish_at && ` · ${formatHijriDate(a.publish_at)}`}
          </span>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Link
            href={`/news/editor/${a.id}`}
            className={`${tajawal.className} px-3 h-9 rounded-xl border border-[#043F2E]/20 text-[#043F2E] hover:bg-[#F7FBEA] text-sm font-bold flex items-center transition-colors`}
          >
            تعديل
          </Link>
          <DeleteButton announcement={a} onDeleted={onDeleted} />
        </div>
      </div>
      {failure && (
        <div className="rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-xs text-[#9B3D2E] flex flex-col gap-1">
          <span className={`${tajawal.className} font-bold`}>
            فشل النشر على ديسكورد بعد {attemptsLabel(failure.attempts)}، وستُعاد المحاولة تلقائيًا.
          </span>
          {/* Only Admins are sent the raw error, so this is simply absent for everyone else */}
          {failure.last_error && (
            <details className={tajawal.className}>
              <summary className="cursor-pointer font-bold">تفاصيل تقنية</summary>
              <code dir="ltr" className="mt-1 block text-start break-words">
                {failure.last_error}
              </code>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
