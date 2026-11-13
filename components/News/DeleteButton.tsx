"use client";

import { useState } from "react";
import { Tajawal } from "next/font/google";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement, type Announcement } from "@/actions/announcements";
import FieldError from "../ui/field-error";

const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

// Two clicks, with the consequence spelled out: deleting also removes the post from Discord,
// and if Discord can't be reached the API refuses, so nothing is half-deleted.
export default function DeleteButton({
  announcement,
  onDeleted,
}: {
  announcement: Pick<Announcement, "id" | "deliveries">;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const onDiscord = announcement.deliveries?.some((d) => d.status === "sent");

  const remove = async () => {
    setBusy(true);
    setError(undefined);
    const res = await deleteAnnouncement(announcement.id);
    setBusy(false);
    if (res.success) onDeleted();
    else setError(res.error);
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={`${tajawal.className} flex items-center gap-1.5 px-3 h-9 rounded-xl border border-[#9B3D2E]/40 text-[#9B3D2E] hover:bg-[#F4E0D6] text-sm font-bold transition-colors cursor-pointer`}
      >
        <Trash2 className="w-4 h-4" strokeWidth={2.2} />
        حذف
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3">
      <span className={`${tajawal.className} text-sm text-[#9B3D2E]`}>
        {onDiscord
          ? "سيُحذف الإعلان وتُحذف رسالته من ديسكورد أيضًا. هل أنت متأكد؟"
          : "سيُحذف الإعلان نهائيًا. هل أنت متأكد؟"}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={remove}
          className={`${tajawal.className} px-3 h-9 rounded-xl bg-[#9B3D2E] text-white text-sm font-bold cursor-pointer disabled:opacity-60`}
        >
          {busy ? "جارٍ الحذف..." : "تأكيد الحذف"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className={`${tajawal.className} px-3 h-9 rounded-xl text-[#043F2E] hover:bg-white/60 text-sm font-bold cursor-pointer`}
        >
          إلغاء
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}
