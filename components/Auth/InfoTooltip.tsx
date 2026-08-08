"use client";

import { Tajawal } from "next/font/google";
import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["500", "700"],
});

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="مزيد من المعلومات"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-5 h-5 shrink-0 rounded-full bg-[#043F2E]/10 hover:bg-[#BEE663] flex items-center justify-center transition-colors"
      >
        <Info className="w-2.5 h-2.5 text-[#043F2E]" strokeWidth={2.4} />
      </button>
      {open && (
        <div
          role="tooltip"
          dir="rtl"
          className={`${tajawal.className} absolute top-full left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-2 mt-2 z-50 w-[calc(100vw-2.5rem)] sm:w-64 max-w-64 p-3 bg-[#043F2E] text-white text-[13px] leading-[1.7] rounded-xl shadow-lg font-normal`}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-1 sm:-translate-x-2 w-3 h-3 bg-[#043F2E] rotate-45" />
          <p className="relative text-right">{text}</p>
        </div>
      )}
    </div>
  );
}
