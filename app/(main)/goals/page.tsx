import type { Metadata } from "next";
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import GoalsPageClient from "@/components/Goals/GoalsPageClient";

export const metadata: Metadata = {
  title: "الأهداف",
  description: "تابع أهداف مجتمع مقرأة النيل الحالية والقادمة ومدى التقدم نحو تحقيقها.",
  robots: { index: false, follow: false },
};

export default async function GoalsPage() {
  const User = await checkTokenValidity();
  if (!User.isValid) {
    redirect("/auth");
  }

  const isAdmin = !!User.user.groups.includes("Admin");

  return <GoalsPageClient isAdmin={isAdmin} />;
}
