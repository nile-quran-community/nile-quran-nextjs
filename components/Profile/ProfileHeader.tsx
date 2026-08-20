import { Lalezar, Tajawal } from "next/font/google";
import { User } from "lucide-react";
import RoleBadge from "./RoleBadge";
import type { RoleType } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface Props {
  firstName: string;
  lastName: string;
  username: string;
  role: RoleType;
  isOwnProfile: boolean;
}

export default function ProfileHeader({
  firstName,
  lastName,
  username,
  role,
  isOwnProfile,
}: Props) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.trim();

  return (
    <div className="flex items-center gap-4 flex-wrap" dir="rtl">
      {/* Avatar */}
      <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-md">
        <span className={`${tajawal.className} text-xl md:text-2xl font-bold`}>
          {initials || <User className="w-6 h-6" strokeWidth={2.2} />}
        </span>
      </div>

      {/* Name + Username */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className={`${lalezar.className} text-2xl md:text-3xl text-[#043F2E] leading-tight`}>
            {fullName || "مستخدم"}
          </h1>
          <RoleBadge role={role} />
        </div>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/50 font-medium`}>
          @{username}
          {isOwnProfile && (
            <span className="ml-2 text-[10px] font-bold text-[#043F2E] bg-[#BEE663]/30 px-1.5 py-0.5 rounded">
              هذا أنت
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
