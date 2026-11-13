import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getAnnouncement, getTypeOptions } from "@/actions/announcements";
import { canEditAnnouncements } from "@/lib/profile-types";
import { PageHero, PageHeroHeading } from "@/components/ui/PageHero";
import AnnouncementEditor from "@/components/News/AnnouncementEditor";

export const metadata: Metadata = {
  title: "تعديل الإعلان",
  robots: { index: false, follow: false },
};

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const User = await checkTokenValidity();
  if (!User.isValid || !canEditAnnouncements(User.user.groups || [])) {
    redirect("/auth");
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [res, types] = await Promise.all([getAnnouncement(id), getTypeOptions()]);
  // Someone else's draft is a 404 from the API, which is exactly what it should look like here
  if (!res.success) {
    if (res.notFound) notFound();
    throw new Error(res.error);
  }
  if (!types.success) throw new Error(types.error);

  return (
    <div className="w-full bg-[#EBF0EB] min-h-screen">
      <PageHero>
        <PageHeroHeading icon={PenLine} eyebrow="تعديل" title={res.data.title} />
      </PageHero>
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14" dir="rtl">
        <AnnouncementEditor announcement={res.data} typeOptions={types.data} />
      </div>
    </div>
  );
}
