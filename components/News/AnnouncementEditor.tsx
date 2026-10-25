"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lalezar, Tajawal } from "next/font/google";
import { ArrowRight, CheckCircle2, ExternalLink, Eye, Globe, Lock } from "lucide-react";
import {
  createAnnouncement,
  updateAnnouncement,
  type Announcement,
  type TypeOption,
} from "@/actions/announcements";
import { announcementSchema, type AnnouncementValues } from "@/lib/schemas";
import { toArabicDigits } from "@/lib/utils";
import { savedMessage, toDatetimeLocal, toPublishAt } from "@/lib/announcements";
import { Spinner } from "../ui/spinner";
import FieldError from "../ui/field-error";
import ArticleBody from "./ArticleBody";
import DeleteButton from "./DeleteButton";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["500", "700"] });

const MODES = [
  { value: "draft", label: "حفظ كمسودة" },
  { value: "now", label: "نشر الآن" },
  { value: "schedule", label: "جدولة" },
] as const;

function fieldClass(hasError: boolean) {
  return [
    `${tajawal.className} w-full rounded-xl border bg-white px-3.5 text-sm text-[#043F2E] focus:outline-none transition-colors`,
    hasError
      ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
      : "border-[#043F2E]/30 focus:border-[#043F2E]",
  ].join(" ");
}

function Field({
  label,
  hint,
  counter,
  children,
}: {
  label: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className={`${tajawal.className} text-sm font-bold text-[#043F2E]`}>{label}</label>
        {counter && <span className="text-xs text-[#043F2E]/50">{counter}</span>}
      </div>
      {children}
      {hint && <p className={`${tajawal.className} text-xs text-[#043F2E]/60`}>{hint}</p>}
    </div>
  );
}

export default function AnnouncementEditor({
  announcement,
  typeOptions,
}: {
  announcement?: Announcement;
  typeOptions: TypeOption[];
}) {
  const router = useRouter();
  // After the first save a new announcement becomes an existing one, so later saves update it
  const [current, setCurrent] = useState(announcement);
  const [saved, setSaved] = useState<string>();
  const [formError, setFormError] = useState<string>();

  // Once Discord has (or is about to get) the post, its publish time is no longer the
  // author's to choose; only drafts and scheduled announcements still have one to set.
  const due = !!current && current.status !== "draft" && current.status !== "scheduled";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: current?.type ?? typeOptions[0]?.value ?? "",
      title: current?.title ?? "",
      summary: current?.summary ?? "",
      content: current?.content ?? "",
      publishMode: current?.publish_at ? "schedule" : "draft",
      publishAt: toDatetimeLocal(current?.publish_at ?? null),
    },
  });

  const [type, title, summary, content, mode, publishAt] = watch([
    "type",
    "title",
    "summary",
    "content",
    "publishMode",
    "publishAt",
  ]);

  // The link card's image is drawn by the server (/news/editor/og, the same code that draws
  // the one a crawler gets) from what is in the form, a short pause after typing stops. Its
  // date is the publish time; a draft or "publish now" shows today, as it will on publishing.
  const typeLabel = typeOptions.find((o) => o.value === type)?.label ?? "";
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const cardDate = (due ? current?.publish_at : toPublishAt(mode, publishAt)) ?? today;
  const cardUrl = `/news/editor/og?${new URLSearchParams({
    title: title.trim() || "عنوان الخبر",
    type: typeLabel,
    date: cardDate,
  })}`;
  const [cardSrc, setCardSrc] = useState(cardUrl);
  useEffect(() => {
    const timer = setTimeout(() => setCardSrc(cardUrl), 500);
    return () => clearTimeout(timer);
  }, [cardUrl]);

  // The Save button is at the foot of a long form, so the result is shown there too, and
  // brought into view in case the page is scrolled to somewhere else when it arrives.
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (saved || formError) {
      feedback.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [saved, formError]);

  const onSubmit = handleSubmit(async (values) => {
    setSaved(undefined);
    setFormError(undefined);
    const payload = {
      type: values.type,
      title: values.title,
      summary: values.summary,
      content: values.content,
      publish_at: due
        ? (current?.publish_at ?? null)
        : toPublishAt(values.publishMode, values.publishAt),
    };
    const res = current
      ? await updateAnnouncement(current.id, payload)
      : await createAnnouncement(payload);
    if (!res.success) {
      setFormError(res.error);
      return;
    }
    setCurrent(res.data);
    setSaved(savedMessage(res.data.status));
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <Link
        href="/news/editor"
        className={`${tajawal.className} self-start flex items-center gap-1.5 text-sm font-bold text-[#043F2E] hover:text-[#065f46] transition-colors`}
      >
        <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
        العودة إلى إدارة الأخبار
      </Link>

      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-5">
        <Field label="نوع الخبر">
          <select {...register("type")} className={`${fieldClass(!!errors.type)} h-11`}>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.type?.message} />
        </Field>

        <Field label="العنوان" counter={`${toArabicDigits(title.length)} / ${toArabicDigits(255)}`}>
          <input
            dir="auto"
            {...register("title")}
            className={`${fieldClass(!!errors.title)} h-11`}
          />
          <FieldError message={errors.title?.message} />
        </Field>

        <Field
          label="الوصف المختصر"
          counter={`${toArabicDigits(summary.length)} / ${toArabicDigits(200)}`}
          hint="يظهر لأي شخص يفتح الرابط حتى لو لم يسجّل دخوله، وفي معاينة الرابط عند مشاركته."
        >
          <textarea
            dir="auto"
            rows={2}
            {...register("summary")}
            className={`${fieldClass(!!errors.summary)} py-2.5 resize-none`}
          />
          <FieldError message={errors.summary?.message} />
        </Field>

        <Field
          label="المحتوى"
          counter={`${toArabicDigits(content.length)} / ${toArabicDigits(4096)}`}
          hint="لأعضاء المقرأة فقط. يدعم تنسيق ديسكورد: ## عنوان، **غامق**، - قائمة، > اقتباس."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <textarea
              dir="auto"
              rows={14}
              {...register("content")}
              className={`${fieldClass(!!errors.content)} py-2.5 leading-7 resize-y`}
            />
            <div className="rounded-xl border border-[#043F2E]/10 bg-[#F7FBEA] p-4 min-h-40">
              <span
                className={`${tajawal.className} mb-2 flex items-center gap-1.5 text-xs font-bold text-[#043F2E]/50`}
              >
                <Eye className="w-3.5 h-3.5" strokeWidth={2.2} />
                معاينة
              </span>
              {content.trim() ? (
                <ArticleBody content={content} />
              ) : (
                <p className={`${tajawal.className} text-sm text-[#043F2E]/40`}>
                  ستظهر المعاينة هنا أثناء الكتابة
                </p>
              )}
            </div>
          </div>
          <FieldError message={errors.content?.message} />
        </Field>
      </section>

      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-4">
        <h2 className={`${lalezar.className} text-xl text-[#043F2E]`}>موعد النشر</h2>
        {due ? (
          <p className={`${tajawal.className} text-sm text-[#043F2E]/70`}>
            هذا الخبر {current?.status === "published" ? "منشور" : "حان موعد نشره"} بالفعل، فيبقى
            موعده كما هو. أي تعديل على النص يصل إلى ديسكورد تلقائيًا.
          </p>
        ) : (
          <>
            {/* Three columns on a phone (the first label is the longest) so the options stay on one row; shrink-to-fit from sm up */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-1 p-1 rounded-2xl bg-[#DEFF90]/50 sm:flex sm:self-start">
              {MODES.map((m) => (
                <label
                  key={m.value}
                  className={`${tajawal.className} px-2 sm:px-3.5 min-h-9 py-1.5 rounded-xl text-sm font-bold leading-tight text-center flex items-center justify-center cursor-pointer transition-colors ${
                    mode === m.value
                      ? "bg-[#043F2E] text-white shadow-sm"
                      : "text-[#043F2E] hover:bg-white/50"
                  }`}
                >
                  <input
                    type="radio"
                    value={m.value}
                    {...register("publishMode")}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            {mode === "schedule" && (
              <Field label="الموعد">
                <input
                  type="datetime-local"
                  dir="ltr"
                  {...register("publishAt")}
                  className={`${fieldClass(!!errors.publishAt)} h-11 sm:max-w-xs text-end`}
                />
                <FieldError message={errors.publishAt?.message} />
              </Field>
            )}
            {mode === "draft" && (
              <p
                className={`${tajawal.className} flex items-center gap-1.5 text-xs text-[#043F2E]/60`}
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={2.2} />
                المسودة لا يراها غيرك، ولا تُنشر على ديسكورد.
              </p>
            )}
          </>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7 flex flex-col gap-3">
        <h2 className={`${lalezar.className} text-xl text-[#043F2E]`}>معاينة بطاقة الرابط</h2>
        <p className={`${tajawal.className} flex items-center gap-1.5 text-xs text-[#043F2E]/60`}>
          <Globe className="w-3.5 h-3.5" strokeWidth={2.2} />
          هذا ما يظهر عند مشاركة الرابط، وهو عام: العنوان والوصف فقط، دون المحتوى.
        </p>
        <div className="max-w-md rounded-2xl overflow-hidden border border-[#043F2E]/15">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated per request, nothing for next/image to optimise */}
          <img
            src={cardSrc}
            alt="معاينة صورة الرابط"
            className="block w-full aspect-[1200/630] bg-[#043F2E]"
          />
          <div className="p-4 flex flex-col gap-1">
            <span dir="auto" className={`${lalezar.className} text-lg text-[#043F2E]`}>
              {title || "عنوان الخبر"}
            </span>
            <span dir="auto" className={`${tajawal.className} text-sm text-[#043F2E]/70`}>
              {summary || "الوصف المختصر"}
            </span>
          </div>
        </div>
      </section>

      <div ref={feedback} className="flex flex-col gap-3 empty:hidden">
        {saved && (
          <div
            dir="rtl"
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl bg-[#DEFF90] border border-[#9ADD00]/40 p-3 text-sm text-[#043F2E] font-bold"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.4} />
              {saved}
            </span>
            {current && (
              <Link href={`/news/${current.id}`} className="underline shrink-0">
                عرض الخبر
              </Link>
            )}
          </div>
        )}
        {formError && (
          <div
            dir="rtl"
            role="alert"
            className="rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-sm text-[#9B3D2E]"
          >
            {formError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${tajawal.className} flex items-center gap-2 px-6 h-11 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] font-bold transition-colors cursor-pointer disabled:opacity-60`}
          >
            {isSubmitting && <Spinner />}
            {current ? "حفظ التعديلات" : "حفظ"}
          </button>
          <Link
            href="/news/editor"
            className={`${tajawal.className} flex items-center px-4 h-11 rounded-xl text-[#043F2E] hover:bg-white text-sm font-bold transition-colors`}
          >
            رجوع
          </Link>
          {current && (
            <Link
              href={`/news/${current.id}`}
              className={`${tajawal.className} flex items-center gap-1.5 px-4 h-11 rounded-xl border border-[#043F2E]/20 text-[#043F2E] hover:bg-white text-sm font-bold transition-colors`}
            >
              <ExternalLink className="w-4 h-4" strokeWidth={2.2} />
              عرض الخبر
            </Link>
          )}
        </div>
        {current && (
          <DeleteButton announcement={current} onDeleted={() => router.push("/news/editor")} />
        )}
      </div>
    </form>
  );
}
