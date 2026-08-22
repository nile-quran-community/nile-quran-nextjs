import { Tajawal } from "next/font/google";
import { Crown, Shield, BookOpen } from "lucide-react";
import type { RoleType } from "@/lib/profile-types";
import { getRoleLabel } from "@/lib/profile-types";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  role: RoleType;
  size?: "sm" | "md" | "lg";
}

const roleConfig: Record<
  RoleType,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  Admin: {
    bg: "bg-[#043F2E]",
    text: "text-[#BEE663]",
    icon: <Crown className="w-3.5 h-3.5" strokeWidth={2.4} />,
  },
  Supervisor: {
    bg: "bg-[#065f46]",
    text: "text-[#DEFF90]",
    icon: <Shield className="w-3.5 h-3.5" strokeWidth={2.4} />,
  },
  Student: {
    bg: "bg-[#F7FBEA]",
    text: "text-[#043F2E]",
    icon: <BookOpen className="w-3.5 h-3.5" strokeWidth={2.4} />,
  },
};

export default function RoleBadge({ role, size = "md" }: Props) {
  const cfg = roleConfig[role];
  const sizeClass =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : size === "lg"
        ? "px-4 py-1.5 text-sm gap-2"
        : "px-3 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#043F2E]/15 font-bold ${cfg.bg} ${cfg.text} ${sizeClass} ${tajawal.className}`}
    >
      {cfg.icon}
      {getRoleLabel(role)}
    </span>
  );
}
