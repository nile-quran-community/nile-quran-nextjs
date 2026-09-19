import { Tajawal } from "next/font/google";
import type { GroupName } from "@/lib/profile-types";
import { getGroupIcon, getGroupLabel } from "@/lib/profile-types";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  group: GroupName | string;
  size?: "sm" | "md" | "lg";
}

// One quiet treatment for every group — the three roles and the NQC teams alike.
// Filled pills in three different greens turned the row under the name into a
// strip of competing colour; a role is a label, not a status worth shouting, so
// it reads as text with a mark.
export default function RoleBadge({ group, size = "md" }: Props) {
  const Icon = getGroupIcon(group);
  const iconSize = size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";
  const sizeClass =
    size === "sm" ? "text-[11px] gap-1" : size === "lg" ? "text-sm gap-2" : "text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center text-[#043F2E]/70 font-medium ${sizeClass} ${tajawal.className}`}
    >
      <span className="text-[#043F2E]/50" aria-hidden="true">
        <Icon className={iconSize} strokeWidth={2.4} />
      </span>
      {getGroupLabel(group)}
    </span>
  );
}
