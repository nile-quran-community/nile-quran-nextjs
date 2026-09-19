import type { Metadata } from "next";
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import GoalsPageClient from "@/components/Goals/GoalsPageClient";
import { canEditGoals } from "@/lib/profile-types";

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

  // Not admins only — every group the API lets write goals (أمناء الخزنة, الإعلاميون)
  const canEdit = canEditGoals(User.user.groups || []);

  return <GoalsPageClient canEdit={canEdit} />;
}
