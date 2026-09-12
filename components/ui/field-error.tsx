"use client";
import { Tajawal } from "next/font/google";
import { AlertCircle } from "lucide-react";

const tajawal = Tajawal({ subsets: ["arabic"], weight: "500" });

// One message, under the input it belongs to. A failure that belongs to no
// single field — bad credentials, a dead API — renders the same way at the
// foot of the form, where RHF keeps it as "root".
export default function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className={`${tajawal.className} flex items-center gap-1.5 text-xs text-[#9B3D2E] font-medium`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
      <span>{message}</span>
    </p>
  );
}
