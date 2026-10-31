"use client";

import { useEffect, useState } from "react";
import { Tajawal } from "next/font/google";
import { Check, Link2, Share2 } from "lucide-react";

const tajawal = Tajawal({ subsets: ["arabic"], weight: "700" });

const buttonClass = `${tajawal.className} flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-bold transition-colors cursor-pointer`;

// Links stay inside the community (Discord, or member to member), so there are no
// social-network buttons: copy the link, or hand it to the phone's own share sheet.
export default function ShareButtons({ id, title }: { id: number; title: string }) {
  const [copied, setCopied] = useState(false);
  // Known only in the browser, so it is read after mount rather than during render (which
  // would render a different tree on the server)
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);
  const url = () => `${window.location.origin}/news/${id}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className={`${buttonClass} bg-[#043F2E] hover:bg-[#065f46] text-white`}
      >
        {copied ? (
          <Check className="w-4 h-4" strokeWidth={2.4} />
        ) : (
          <Link2 className="w-4 h-4" strokeWidth={2.4} />
        )}
        {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title, url: url() }).catch(() => {})}
          aria-label="مشاركة"
          className={`${buttonClass} bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E]`}
        >
          <Share2 className="w-4 h-4" strokeWidth={2.4} />
          مشاركة
        </button>
      )}
    </div>
  );
}
