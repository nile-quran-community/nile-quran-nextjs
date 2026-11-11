import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tajawal } from "next/font/google";
import { Newspaper, Plus, Settings2 } from "lucide-react";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getAnnouncements } from "@/actions/announcements";
import { canEditAnnouncements } from "@/lib/profile-types";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import NewsListClient, { type TypeChip } from "@/components/News/NewsListClient";

const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

export const metadata: Metadata = {
  title: "الأخبار",
  description: "إعلانات مجتمع مقرأة النيل: التجمعات الشهرية ودروس العلم وإعلان المتصدرين.",
  robots: { index: false, follow: false },
};

export default async function NewsPage() {
  const User = await checkTokenValidity();
  if (!User.isValid) {
    redirect("/auth?next=/news");
  }

  const res = await getAnnouncements({ live: true, ordering: "-publish_at" });

  // The type filter is built from what the API returned (it labels its own types), and only
  // from the unfiltered first page, so choosing one chip never makes the others vanish.
  const chips: TypeChip[] = [];
  if (res.success) {
    for (const { type, type_display } of res.data.results) {
      if (!chips.some((c) => c.value === type)) chips.push({ value: type, label: type_display });
    }
  }

  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen">
      <PageHero>
        <PageHeroHeading
          icon={Newspaper}
          eyebrow="أخبار المقرأة"
          title="الأخبار"
          subtitle="تجمعات المقرأة ودروس العلم وإعلان المتصدرين، كل ما يهم المجتمع في مكان واحد."
        />
      </PageHero>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-4" dir="rtl">
        {canEditAnnouncements(User.user.groups || []) && (
          // In this RTL row the first child is the rightmost: creating is the primary action,
          // so it sits to the right of the manage button.
          <div className="flex justify-end gap-2">
            <Link
              href="/news/editor/new"
              className={`${tajawal.className} shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] text-sm font-bold transition-colors`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.4} />
              إعلان جديد
            </Link>
            <Link
              href="/news/editor"
              className={`${tajawal.className} shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl border border-[#043F2E]/20 text-[#043F2E] hover:bg-white text-sm font-bold transition-colors`}
            >
              <Settings2 className="w-4 h-4" strokeWidth={2.4} />
              إدارة الأخبار
            </Link>
          </div>
        )}
        <NewsListClient initial={res.success ? res.data : null} chips={chips} />
      </div>
    </div>
  );
}
