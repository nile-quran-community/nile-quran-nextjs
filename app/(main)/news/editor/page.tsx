import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getAnnouncements, getTypeOptions } from "@/actions/announcements";
import { canEditAnnouncements } from "@/lib/profile-types";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import EditorList from "@/components/News/EditorList";

export const metadata: Metadata = {
  title: "إدارة الإعلانات",
  description: "إدارة إعلانات مقرأة النيل: المسودات والمجدولة والمنشورة.",
  robots: { index: false, follow: false },
};

export default async function NewsEditorPage() {
  const User = await checkTokenValidity();
  if (!User.isValid || !canEditAnnouncements(User.user.groups || [])) {
    redirect("/auth");
  }

  const [list, types] = await Promise.all([
    getAnnouncements({ ordering: "-created_at" }),
    getTypeOptions(),
  ]);

  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen">
      <PageHero>
        <PageHeroHeading
          icon={Settings2}
          eyebrow="لوحة الإعلام"
          title="إدارة الإعلانات"
          subtitle="المسودات التي كتبتها تظهر لك وحدك، أما المجدولة والمنشورة فيراها كل أعضاء فريق الإعلام."
        />
      </PageHero>
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14" dir="rtl">
        <EditorList
          initial={list.success ? list.data : null}
          typeOptions={types.success ? types.data : []}
        />
      </div>
    </div>
  );
}
