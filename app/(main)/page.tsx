import type { Metadata } from "next";
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";
import DashboardContainer from "@/components/Home/DashboardContainer";

export const metadata: Metadata = {
  title: "الصفحة الرئيسية",
  description:
    "تابع هدف الشهر وتقدمك في الحفظ والتسميع، وشارك مجتمعك في المسابقة الشهرية على منصة مقرأة النيل.",
  robots: { index: false, follow: false },
};

export default async function Home() {
  const isValid = await checkTokenValidity();

  if (!isValid.isValid) {
    redirect("/auth");
  }

  return (
    <div className="w-full  bg-[#EBF0EB] min-h-screen py-8">
      <DashboardContainer />
    </div>
  );
}
