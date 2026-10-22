import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";
import LibraryPageClient from "@/components/Library/LibraryPageClient";

export const metadata: Metadata = {
  title: "المكتبة",
  description: "سلاسل ودروس وكتب من قناة المجتمع، مرتبة على أقسامها.",
  robots: { index: false, follow: false },
};

export default async function LibraryPage() {
  const User = await checkTokenValidity();
  if (!User.isValid) {
    redirect("/auth");
  }

  return <LibraryPageClient />;
}
