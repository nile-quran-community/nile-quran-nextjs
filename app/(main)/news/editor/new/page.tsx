import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getTypeOptions } from "@/actions/announcements";
import { canEditAnnouncements } from "@/lib/profile-types";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import AnnouncementEditor from "@/components/News/AnnouncementEditor";

export const metadata: Metadata = {
  title: "إعلان جديد",
  robots: { index: false, follow: false },
};

export default async function NewAnnouncementPage() {
  const User = await checkTokenValidity();
  if (!User.isValid || !canEditAnnouncements(User.user.groups || [])) {
    redirect("/auth");
  }

  const types = await getTypeOptions();
  if (!types.success) throw new Error(types.error);

  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen">
      <PageHero>
        <PageHeroHeading icon={PenLine} eyebrow="إعلان جديد" title="كتابة إعلان" />
      </PageHero>
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14" dir="rtl">
        {/* The monthly leaderboard is written by the system, not by hand */}
        <AnnouncementEditor
          typeOptions={types.data.filter((o) => o.value !== "month_top_performers")}
        />
      </div>
    </div>
  );
}
