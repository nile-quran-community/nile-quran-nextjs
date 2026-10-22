import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";
import LibraryItemClient from "@/components/Library/LibraryItemClient";
import { getLibraryItem, relatedLibraryItems } from "@/lib/library";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getLibraryItem(id);
  return {
    title: item?.title ?? "المكتبة",
    robots: { index: false, follow: false },
  };
}

export default async function LibraryItemPage({ params }: PageProps) {
  const User = await checkTokenValidity();
  if (!User.isValid) {
    redirect("/auth");
  }

  const { id } = await params;
  const item = getLibraryItem(id);
  if (!item) notFound();

  return <LibraryItemClient item={item} related={relatedLibraryItems(item)} />;
}
