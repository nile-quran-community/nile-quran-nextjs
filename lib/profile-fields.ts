// ===============================
// Community Profile Fields
// ===============================
// Value/label pairs mirroring the backend's TextChoices (users/models.py). Kept
// here once so the zod schema and the form's <select> options never drift apart.
// The backend is still the source of truth for validity; these are for display.

export const ACADEMIC_STATUS_OPTIONS = [
  { value: "undergraduate", label: "طالب بكالوريوس" },
  { value: "postgraduate", label: "طالب دراسات عليا" },
  { value: "other", label: "أخرى" },
] as const;

export const FACULTY_OPTIONS = [
  { value: "engineering", label: "هندسة" },
  { value: "computer_science", label: "علوم حاسب / ذكاء اصطناعي" },
  { value: "business", label: "إدارة أعمال" },
  { value: "biotechnology", label: "التكنولوجيا الحيوية" },
  { value: "other", label: "أخرى" },
] as const;

export const ACADEMIC_YEAR_OPTIONS = [
  { value: "1", label: "الأولى" },
  { value: "2", label: "الثانية" },
  { value: "3", label: "الثالثة" },
  { value: "4", label: "الرابعة" },
  { value: "5", label: "الخامسة" },
  { value: "graduate", label: "خريج" },
] as const;

export const TAJWEED_LEVEL_OPTIONS = [
  { value: "beginner", label: "مبتدئ (لم يسبق التعرض لأحكام التجويد)" },
  { value: "intermediate", label: "متوسط (على علم بسيط بأحكام التجويد)" },
  { value: "proficient", label: "متقن (على علم وإجادة لأحكام التجويد)" },
] as const;

export type AcademicStatus = (typeof ACADEMIC_STATUS_OPTIONS)[number]["value"];
export type Faculty = (typeof FACULTY_OPTIONS)[number]["value"];
export type AcademicYear = (typeof ACADEMIC_YEAR_OPTIONS)[number]["value"];
export type TajweedLevel = (typeof TAJWEED_LEVEL_OPTIONS)[number]["value"];

// The community profile fields as they appear on the User record (see
// UserSerializer on the backend). All optional/blank-able; nothing here is
// required at signup, only for `is_profile_complete` to become true.
export interface ProfileFields {
  phone_number: string;
  birth_date: string | null;
  academic_status: AcademicStatus | "";
  academic_status_other: string;
  faculty: Faculty | "";
  faculty_other: string;
  academic_year: AcademicYear | "";
  residence: string;
  hometown: string;
  memorized_juz: number | null;
  tajweed_level: TajweedLevel | "";
  has_islamic_studies: boolean | null;
  islamic_studies_source: string;
  skills: string;
  is_profile_complete: boolean;
}
