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
}

export interface AdminUserSummary {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  groups: string[];
  supervisor: string | null;
  referrer: string | null;
  date_joined: string;
  points: number;
}

// ===============================
// Role Helpers
// ===============================

export function getPrimaryRole(groups: string[]): RoleType {
  if (groups.includes("Admin")) return "Admin";
  if (groups.includes("Supervisor")) return "Supervisor";
  return "Student";
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

export function getVisibility(
  viewerRole: RoleType,
  isOwnProfile: boolean,
): ProfileVisibility {
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
        showDetailedActivities: false, // overridden per-relationship in page
        showSupervisor: true,
        showReferrer: false,
        showDateJoined: true,
        showPoints: true,
      };

    case "Student":
      return {
        showEmail: false,
        showDetailedActivities: true, // students can see other students' activities
        showSupervisor: true,
        showReferrer: false,
        showDateJoined: false,
        showPoints: true,
      };
  }
}
