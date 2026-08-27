import { Tajawal } from "next/font/google";
import { Crown, Shield, BookOpen } from "lucide-react";
import type { RoleType } from "@/lib/profile-types";
import { getRoleLabel } from "@/lib/profile-types";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  role: RoleType;
  size?: "sm" | "md" | "lg";
}

// One quiet treatment for all three roles. Filled pills in three different
// greens turned the row under the name into a strip of competing colour; a role
// is a label, not a status worth shouting, so it reads as text with a mark.
const roleConfig: Record<RoleType, { icon: React.ReactNode }> = {
  Admin: { icon: <Crown className="w-3.5 h-3.5" strokeWidth={2.4} /> },
  Supervisor: { icon: <Shield className="w-3.5 h-3.5" strokeWidth={2.4} /> },
  Student: { icon: <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} /> },
};

export default function RoleBadge({ role, size = "md" }: Props) {
  const cfg = roleConfig[role];
  const sizeClass =
    size === "sm" ? "text-[11px] gap-1" : size === "lg" ? "text-sm gap-2" : "text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center text-[#043F2E]/70 font-medium ${sizeClass} ${tajawal.className}`}
    >
      <span className="text-[#043F2E]/50" aria-hidden="true">
        {cfg.icon}
      </span>
      {getRoleLabel(role)}
    </span>
  );
}
