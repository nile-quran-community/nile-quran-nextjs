import type { Metadata } from "next";
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import ControlPanelClient from "@/components/Control-Board/ControlPanelClient";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description:
    "لوحة تحكم المدراء في مقرأة النيل لإدارة نقاط الطلاب وتفعيل الحسابات ومتابعة بيانات الأعضاء.",
  robots: { index: false, follow: false },
};

export default async function ControlPanelPage() {
  const User = await checkTokenValidity();
  if (!User.isValid || !User.user.groups.includes("Admin")) {
    redirect("/auth");
  }

  return <ControlPanelClient currentUserId={User.user.id} />;
}
