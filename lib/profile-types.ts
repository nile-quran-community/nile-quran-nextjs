import {
  Target,
  Shield,
  BookOpen,
  Wallet,
  Video,
  Code2,
  Search,
  Flame,
  Users,
  type LucideIcon,
} from "lucide-react";

// ===============================
// Profile Types & Visibility Rules
// ===============================

export type RoleType = "Admin" | "Supervisor" | "Student";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  supervisor: string | null;
  referrer: string | null;
  date_joined: string;
}

export interface UserActivity {
  id: number;
  category: number;
  category_name?: string;
  date: string;
  multiplier: number;
  points?: number;
}

export interface UserProfileData {
  user: UserProfile;
  points: number;
  activities: UserActivity[];
}

export interface SupervisedStudent {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  groups: string[];
  points: number;
  activities_count: number;
  weekly_activities_count: number;
  recited_this_week: boolean;
  date_joined: string;
  /** ISO date of the member's most recent activity of any kind, null if they never had one */
  last_activity_at: string | null;
}

// ===============================
// Supervisor Activity Scope
// ===============================
// Recitation (تسميع, id 4) and Quran reading (قراءة, id 3) — the only activities a
// recitation supervisor records or removes. Every other category belongs to the
// control board. The API lets a supervisor touch any category of their own
// students, so this list is what both the profile UI and its server actions
// enforce; keep them reading the same constant.

// A member who has recorded nothing for this long has usually stopped coming.
// Their supervisor is told so they can follow up on recitation and reading;
// an administrator is told because they are the one who can reach out.
export const INACTIVITY_ALERT_WEEKS = 8;

// Half that, and the administrator is told without being asked to act yet
export const INACTIVITY_NOTICE_WEEKS = 4;

// Weeks a member has been silent, measured from their last activity, or from the
// day they joined when they have never recorded one. Null when neither is known.
export function weeksSilent(
  lastActivityAt: string | null,
  dateJoined?: string | null,
): number | null {
  return weeksSinceActivity(lastActivityAt ?? dateJoined ?? null);
}

export function weeksSinceActivity(lastActivityAt: string | null): number | null {
  if (!lastActivityAt) return null;
  const last = new Date(lastActivityAt);
  if (Number.isNaN(last.getTime())) return null;
  const days = (Date.now() - last.getTime()) / 86_400_000;
  return Math.floor(days / 7);
}

// A member who never recorded anything is measured from the day they joined, not
// from the beginning of time — someone who signed up last week has not lapsed.
export function isLongInactive(lastActivityAt: string | null, dateJoined?: string | null): boolean {
  if (!lastActivityAt) {
    const weeksAsMember = weeksSinceActivity(dateJoined ?? null);
    // No join date to go on: say nothing rather than accuse a new member
    if (weeksAsMember === null) return false;
    return weeksAsMember >= INACTIVITY_ALERT_WEEKS;
  }
  const weeks = weeksSinceActivity(lastActivityAt);
  return weeks !== null && weeks >= INACTIVITY_ALERT_WEEKS;
}

export const CAT_RECITATION = 4; // تسميع القرآن
export const CAT_QURAN_READING = 3; // قراءة القرآن
export const SUPERVISOR_MANAGED_CATEGORY_IDS = [CAT_RECITATION, CAT_QURAN_READING];

// دعوة طالب جامعي — here the multiplier counts how many people were invited,
// not a spectacular-performance bonus, so UI that explains the multiplier as
// "bonus points" must skip this category.
export const CAT_INVITE = 5;

// ===============================
// Role Helpers
// ===============================

export function getPrimaryRole(groups: string[]): RoleType {
  if (groups.includes("Admin")) return "Admin";
  if (groups.includes("Supervisor")) return "Supervisor";
  return "Student";
}

// All roles a user belongs to, highest first (a user can be e.g. Supervisor + Admin).
// No fallback: a member can hold a team and no role at all, and calling them a
// student on their own profile would contradict what the control board shows.
export function getRoles(groups: string[]): RoleType[] {
  const roles: RoleType[] = [];
  if (groups.includes("Admin")) roles.push("Admin");
  if (groups.includes("Supervisor")) roles.push("Supervisor");
  if (groups.includes("Student")) roles.push("Student");
  return roles;
}

// The teams a member can belong to alongside their role — the API's own group
// names (settings.GROUP_PERMISSIONS), which is what `user.groups` carries.
export const TEAM_GROUPS = ["Treasurer", "Media", "Developer", "Researcher", "Beast"] as const;
export type TeamGroup = (typeof TEAM_GROUPS)[number];
export type GroupName = RoleType | TeamGroup;

// Every group the API knows, roles first — the order the control board offers them in
export const ALL_GROUPS: GroupName[] = ["Admin", "Supervisor", "Student", ...TEAM_GROUPS];

// The one place a group is described: how a single member of it is named (badges,
// rows, checkboxes), how the group is named as a body of people (the about page's
// voice), what the team does, and the mark it wears. Rename a group here and every
// screen follows — nothing else should carry its Arabic name or its icon.
export interface GroupMeta {
  /** One member of the group */
  label: string;
  /** The group as a body of people */
  collective: string;
  /** What the team does — shown on the about page; the roles have no team card */
  description?: string;
  Icon: LucideIcon;
}

export const GROUPS: Record<GroupName, GroupMeta> = {
  Admin: {
    label: "مدير",
    collective: "الإداريون",
    description:
      "مسؤولون عن التأكد من تحقق رؤية المجتمع ورسالته وقيمه في أعماله، ومتابعة المشاريع والبحث العلمي.",
    Icon: Target,
  },
  Supervisor: { label: "مشرف", collective: "المشرفون", Icon: Shield },
  Student: { label: "طالب", collective: "الطلبة", Icon: BookOpen },
  Treasurer: {
    label: "أمين خزنة",
    collective: "أمناء الخزنة",
    description:
      "مسؤولون عن جمع الصدقات والتبرعات والغرامات المتعلقة بمخالفة القواعد، وتنظيم الموارد المالية للمجتمع.",
    Icon: Wallet,
  },
  Media: {
    label: "إعلامي",
    collective: "الإعلاميون",
    description:
      "يعملون على تحويل الأفكار إلى مواد مرئية جذابة، واستخدام مواقع التواصل الاجتماعي بصورة فعالة للتعريف بالمجتمع ونشر رسالته.",
    Icon: Video,
  },
  Developer: {
    label: "مطوّر",
    collective: "المطورون",
    description:
      "مسؤولون عن تطوير كل ما يخدم المجتمع، وصناعة الموقع الإلكتروني والإشراف عليه وتحسينه.",
    Icon: Code2,
  },
  Researcher: {
    label: "باحث",
    collective: "البحث العلمي",
    description: "يهتم فريق البحث العلمي بالبحث المنهجي في القضايا المؤثرة على مجتمعنا.",
    Icon: Search,
  },
  Beast: {
    label: "وحش",
    collective: "الوحوش",
    description:
      "مسؤولون عن تنظيم الفعاليات، والحرص على ظهورها بصورة جميلة ومرتبة ومنظمة، وابتكار المسابقات البدنية وغيرها من الأنشطة التي تشعل الحماس.",
    Icon: Flame,
  },
};

// A group the API has but this build doesn't know yet is shown under its own name
// rather than dropped — an admin should still see what a member belongs to.
export function getGroupLabel(group: string): string {
  return GROUPS[group as GroupName]?.label ?? group;
}

export function getGroupIcon(group: string): LucideIcon {
  return GROUPS[group as GroupName]?.Icon ?? Users;
}

// Who may write goals: the groups the API grants add/change/delete_goal to
// (settings.GROUP_PERMISSIONS — the goals endpoint is behind DjangoModelPermissions).
// /users/me hands back groups, not permissions, so this list has to be kept in step
// with the backend's; the API is still the one that enforces it.
export const GOAL_EDITOR_GROUPS: GroupName[] = ["Admin", "Treasurer", "Media"];

export function canEditGoals(groups: string[]): boolean {
  return GOAL_EDITOR_GROUPS.some((g) => groups.includes(g));
}

// Team memberships only, in the fixed order above (a member can hold several)
export function getTeams(groups: string[]): TeamGroup[] {
  return TEAM_GROUPS.filter((t) => groups.includes(t));
}

// ===============================
// Visibility Rules
// ===============================
// Determines which fields are visible when viewerRole looks at targetRole's profile.

export interface ProfileVisibility {
  showEmail: boolean;
  showDetailedActivities: boolean;
  showSupervisor: boolean;
  showReferrer: boolean;
  showDateJoined: boolean;
  showPoints: boolean;
}

export function getVisibility(viewerRole: RoleType, isOwnProfile: boolean): ProfileVisibility {
  // Always full access to own profile
  if (isOwnProfile) {
    return {
      showEmail: true,
      showDetailedActivities: true,
      showSupervisor: true,
      showReferrer: true,
      showDateJoined: true,
      showPoints: true,
    };
  }

  switch (viewerRole) {
    case "Admin":
      return {
        showEmail: true,
        showDetailedActivities: true,
        showSupervisor: true,
        showReferrer: true,
        showDateJoined: true,
        showPoints: true,
      };

    case "Supervisor":
      return {
        showEmail: false,
        showDetailedActivities: true,
        showSupervisor: true,
        showReferrer: false,
        showDateJoined: true,
        showPoints: true,
      };

    case "Student":
      return {
        showEmail: false,
        showDetailedActivities: true,
        showSupervisor: true,
        showReferrer: false,
        showDateJoined: true,
        showPoints: true,
      };
  }
}
