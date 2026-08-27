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

// All roles a user belongs to, highest first (a user can be e.g. Supervisor + Admin)
export function getRoles(groups: string[]): RoleType[] {
  const roles: RoleType[] = [];
  if (groups.includes("Admin")) roles.push("Admin");
  if (groups.includes("Supervisor")) roles.push("Supervisor");
  if (groups.includes("Student")) roles.push("Student");
  if (roles.length === 0) roles.push("Student");
  return roles;
}

export function getRoleLabel(role: RoleType): string {
  switch (role) {
    case "Admin":
      return "مدير";
    case "Supervisor":
      return "مشرف";
    case "Student":
      return "طالب";
  }
}

export function getRoleIcon(role: RoleType): string {
  switch (role) {
    case "Admin":
      return "👑";
    case "Supervisor":
      return "🛡️";
    case "Student":
      return "📚";
  }
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
