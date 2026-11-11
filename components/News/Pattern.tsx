import { preload } from "react-dom";

// Stands in for a cover image.
export default function Pattern({ className = "" }: { className?: string }) {
  preload("/og-pattern.png", { as: "image" });
  return (
    <div
      aria-hidden
      className={`bg-[#043F2E] bg-[url('/og-pattern.png')] bg-cover bg-center ${className}`}
    />
  );
}
