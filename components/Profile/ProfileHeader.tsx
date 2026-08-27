import { Lalezar, Tajawal } from "next/font/google";
import { User, UserCheck } from "lucide-react";
import Link from "next/link";
import RoleBadge from "./RoleBadge";
import { getRoles } from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

interface SupervisorInfo {
  id: number;
  fullName: string;
  username: string;
}

interface Props {
  firstName: string;
  lastName: string;
  username: string;
  groups: string[];
  supervisor?: SupervisorInfo | null;
  action?: React.ReactNode;
}

// The page's title block, not another card in the stack: it sits directly on the
// page background so the white cards below start the content, and the member's
// name is the first thing the eye lands on.
export default function ProfileHeader({
  firstName,
  lastName,
  username,
  groups,
  supervisor,
  action,
}: Props) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.trim();
  const roles = getRoles(groups);

  return (
    <header className="flex flex-col gap-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-4">
        {/* Avatar */}
        {/* The same green the control board wears, so the profile and the board
            read as one product rather than two palettes. */}
        <div className="shrink-0 w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-[#043F2E] flex items-center justify-center text-[#BEE663]">
          {initials ? (
            <span className={`${tajawal.className} text-xl md:text-2xl font-bold`}>
              {initials}
            </span>
          ) : (
            <User className="w-7 h-7" strokeWidth={2.2} />
          )}
        </div>

        {/* Name, then who they are — the roles sit on the same line as the
            username rather than in a strip of their own below the block */}
        <div className="flex-1 min-w-[9rem] flex flex-col gap-1">
          <h1
            className={`${lalezar.className} text-2xl md:text-4xl text-[#043F2E] leading-tight break-words`}
          >
            {fullName || username}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className={`${tajawal.className} text-sm text-[#043F2E]/60 font-medium`}>
              @{username}
            </span>
            {roles.map((r) => (
              <RoleBadge key={r} role={r} size="sm" />
            ))}
          </div>
        </div>

        {/* Optional action (e.g. edit own data) — `ms-auto` keeps it pinned to the
            end of the row, including on the line it wraps onto at narrow widths */}
        {action && <div className="shrink-0 ms-auto">{action}</div>}
      </div>

      {/* The supervisor is a fact about this member, not a control: a plain line
          with a link on the name, rather than another bordered pill. */}
      {supervisor && (
        <p className={`${tajawal.className} flex items-center gap-1.5 text-sm text-[#043F2E]/60`}>
          <UserCheck className="w-4 h-4 shrink-0 text-[#043F2E]/50" strokeWidth={2.2} aria-hidden="true" />
          المشرف
          <Link
            href={`/profile/${encodeURIComponent(supervisor.username)}`}
            className={`font-bold text-[#043F2E] hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2`}
          >
            {supervisor.fullName}
          </Link>
        </p>
      )}

    </header>
  );
}
