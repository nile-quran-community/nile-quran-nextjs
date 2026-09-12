"use client";
import { AlertCircle } from "lucide-react";
import type { FieldErrors } from "react-hook-form";

// Both auth forms list every outstanding message in one place under the fields,
// rather than one line per input including "root", where a server-side
// failure that belongs to no single field lands.
export default function FormErrorList({ errors }: { errors: FieldErrors }) {
  const messages = Object.entries(errors)
    .map(([field, error]) => [field, error?.message] as const)
    .filter(([, message]) => typeof message === "string" && message.length > 0);

  if (messages.length === 0) return null;

  return (
    <ul dir="rtl" className="list-none p-0 m-0 text-right w-full flex flex-col gap-2">
      {messages.map(([field, message]) => (
        <li
          key={field}
          role="alert"
          className="flex items-center gap-1.5 text-sm text-[#9B3D2E] font-medium"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
          <span>{message as string}</span>
        </li>
      ))}
    </ul>
  );
}
