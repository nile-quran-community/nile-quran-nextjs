import { Lalezar, Tajawal } from "next/font/google";
import { cn } from "@/lib/utils";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

/**
 * One figure with its label — the shape both dashboards use for their headline
 * numbers, so a member switching between them meets the same object twice
 * rather than two designers' versions of it.
 *
 * `tone="primary"` is the dark surface. Use it once per screen, on the single
 * number that screen exists to answer; everything else stays plain.
 */
export default function StatTile({
  label,
  value,
  icon,
  tone = "plain",
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "primary" | "plain";
  loading?: boolean;
}) {
  const primary = tone === "primary";

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3.5 flex items-center gap-3 h-full",
        primary ? "bg-[#043F2E] border-[#043F2E]" : "bg-[#F7FBEA] border-[#043F2E]/8",
      )}
    >
      <span
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          primary ? "bg-white/10 text-[#BEE663]" : "bg-white text-[#043F2E]/70",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex flex-col min-w-0 gap-1">
        <span
          className={cn(
            tajawal.className,
            "text-xs font-medium",
            primary ? "text-white/75" : "text-[#043F2E]/60",
          )}
        >
          {label}
        </span>
        {loading ? (
          <span
            className={cn(
              "h-6 w-12 rounded-lg animate-pulse motion-reduce:animate-none",
              primary ? "bg-[#BEE663]/25" : "bg-[#043F2E]/10",
            )}
            aria-hidden="true"
          />
        ) : (
          <span
            className={cn(
              lalezar.className,
              "leading-none",
              primary ? "text-[26px] text-[#BEE663]" : "text-2xl text-[#043F2E]",
            )}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
