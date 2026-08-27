import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";
import {
  getUserProfile,
  getUserByUsername,
  getProfileCategories,
  getSupervisedStudents,
  getStudentRank,
  getUserPointsForMonth,
  getCirclePeers,
  getQuietMembers,
  type CirclePeer,
} from "@/actions/profile";
import { gregorianToHijri } from "@tabby_ai/hijri-converter";

import { Lalezar, Tajawal } from "next/font/google";
import { ArrowRight, Info, History, BellRing } from "lucide-react";
import Link from "next/link";

import ProfileHeader from "@/components/Profile/ProfileHeader";
import QuietMembersCard from "@/components/Profile/QuietMembersCard";
import SectionHeading from "@/components/Profile/SectionHeading";
import ProfileMetaInfo from "@/components/Profile/ProfileMetaInfo";
import ProfileActivityList from "@/components/Profile/ProfileActivityList";
import EditOwnProfile from "@/components/Profile/EditOwnProfile";
import ProfileRoleTabs, {
  type ProfileRoleView,
} from "@/components/Profile/ProfileRoleTabs";
import ModeratorProfileView from "@/components/Profile/views/ModeratorProfileView";
import StudentProfileView from "@/components/Profile/views/StudentProfileView";

import { toArabicDigits, getHijriMonth } from "@/lib/utils";
import {
  getPrimaryRole,
  getVisibility,
  isLongInactive,
  weeksSinceActivity,
  type UserActivity,
  type SupervisedStudent,
} from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "الملف الشخصي",
  description: "عرض الملف الشخصي لأعضاء مقرأة النيل",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { isValid, user: currentUser } = await checkTokenValidity();

  if (!isValid || !currentUser) {
    redirect("/auth");
  }

  const { handle } = await params;
  const { view: requestedView } = await searchParams;

  // The address bar carries the member's username. Links that still carry the
  // numeric id keep working and are sent on to the readable address, so an old
  // link never dies and a shared one always says whose profile it is.
  const decodedHandle = decodeURIComponent(handle);
  const numericId = /^\d+$/.test(decodedHandle) ? parseInt(decodedHandle, 10) : null;

  let targetUserId = numericId;
  if (targetUserId === null) {
    const byUsername = await getUserByUsername(decodedHandle);
    if (!byUsername.success || !byUsername.data) {
      return <ProfileNotFound message="لم نعثر على هذا العضو" />;
    }
    targetUserId = byUsername.data.id;
  }

  const isOwnProfile = currentUser.id === targetUserId;
  const viewerRole = getPrimaryRole(currentUser.groups || []);

  // Fetch target user's profile
  const profileResult = await getUserProfile(targetUserId);

  if (numericId !== null && profileResult.success && profileResult.data) {
    const query = requestedView ? `?view=${encodeURIComponent(requestedView)}` : "";
    redirect(`/profile/${encodeURIComponent(profileResult.data.user.username)}${query}`);
  }

  if (!profileResult.success || !profileResult.data) {
    return <ProfileNotFound message={profileResult.error || "لم نعثر على هذا العضو"} />;
  }

  const { user: targetUser, points, activities } = profileResult.data;
  const visibility = getVisibility(viewerRole, isOwnProfile);

  // Relationship-based activity visibility:
  // - Moderator sees activities only for students they supervise
  // - Student sees activities only on their own profile (already handled by isOwnProfile)
  if (viewerRole === "Supervisor" && !isOwnProfile) {
    const isSupervisorOfTarget = targetUser.supervisor === currentUser.username;
    if (isSupervisorOfTarget) {
      visibility.showDetailedActivities = true;
    }
  }

  // Enrich activities with category names (values come from the API, not hard-coded)
  const categoriesResult = await getProfileCategories();
  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const enrichedActivities = enrichActivities(activities, categories);

  // Fetch supervisor info (id + full name) for clickable link
  let supervisorInfo: { id: number; fullName: string; username: string } | null = null;
  if (targetUser.supervisor) {
    const supResult = await getUserByUsername(targetUser.supervisor);
    if (supResult.success && supResult.data) {
      supervisorInfo = {
        id: supResult.data.id,
        fullName: `${supResult.data.first_name} ${supResult.data.last_name}`.trim() || supResult.data.username,
        username: supResult.data.username,
      };
    }
  }

  // Fetch referrer info (id + full name) for clickable link
  let referrerInfo: { id: number; fullName: string; username: string } | null = null;
  if (targetUser.referrer) {
    const refResult = await getUserByUsername(targetUser.referrer);
    if (refResult.success && refResult.data) {
      referrerInfo = {
        id: refResult.data.id,
        fullName: `${refResult.data.first_name} ${refResult.data.last_name}`.trim() || refResult.data.username,
        username: refResult.data.username,
      };
    }
  }

  // ============================
  // Own profile — role-specific dashboards, rendered on the server for every role
  // the member holds (Student + Admin, Supervisor + Admin, Student + Supervisor, ...)
  // ============================
  if (isOwnProfile) {
    const groups = targetUser.groups || [];
    const isAdmin = groups.includes("Admin");
    const isSupervisor = groups.includes("Supervisor");
    const isStudent = groups.includes("Student") || (!isAdmin && !isSupervisor);

    let studentPanel: React.ReactNode = null;
    let supervisorPanel: React.ReactNode = null;

    // Noticing a member slipping away is an administrator's work: they are the
    // one who can reach out. A supervisor gets the same signal for their own
    // circle, as a mark beside the student's name.
    const quietMembers = isAdmin ? await getQuietMembers() : null;

    if (isStudent) {
      // The dashboard speaks about one Hijri month, so it opens on the current one
      const today = new Date();
      const hijriToday = gregorianToHijri({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      });

      const [monthResult, rankResult, peersResult] = await Promise.all([
        getUserPointsForMonth(targetUser.id, hijriToday.year, hijriToday.month),
        getStudentRank(targetUser.id, hijriToday.year, hijriToday.month),
        targetUser.supervisor
          ? getCirclePeers(targetUser.supervisor, targetUser.id)
          : Promise.resolve({ success: true as const, data: [] as CirclePeer[] }),
      ]);

      const monthActivities = enrichActivities(
        monthResult.success ? (monthResult.data?.activities ?? []) : [],
        categories,
      );

      studentPanel = (
        <StudentProfileView
          userId={targetUser.id}
          initialYear={hijriToday.year}
          initialMonth={hijriToday.month}
          initialPoints={monthResult.success ? (monthResult.data?.points ?? 0) : 0}
          initialActivities={monthActivities}
          initialRank={rankResult.success ? rankResult.data : null}
          categories={categories}
          peers={peersResult.success ? (peersResult.data ?? []) : []}
          supervisorName={supervisorInfo?.fullName || targetUser.supervisor || undefined}
          supervisorHandle={supervisorInfo?.username ?? targetUser.supervisor ?? null}
        />
      );
    }

    if (isSupervisor) {
      const studentsResult = await getSupervisedStudents(targetUser.username);
      const students: SupervisedStudent[] = studentsResult.success
        ? (studentsResult.data ?? [])
        : [];

      supervisorPanel = (
        <ModeratorProfileView
          students={students}
          categories={categories}
          viewerIsAdmin={isAdmin}
        />
      );
    }

    const hasBothDashboards = studentPanel !== null && supervisorPanel !== null;
    // ?view= is what makes the choice linkable and survive a reload; anything
    // else (including no parameter) opens on the student dashboard.
    const initialView: ProfileRoleView =
      requestedView === "supervisor" ? "supervisor" : "student";

    return (
      <div className="w-full min-h-screen bg-[#EBF0EB] py-8 md:py-10" dir="rtl">
        <div className="container mx-auto px-4 lg:px-12 max-w-5xl flex flex-col gap-5 md:gap-6">
          <ProfileHeader
            firstName={targetUser.first_name}
            lastName={targetUser.last_name}
            username={targetUser.username}
            groups={groups}
            supervisor={isStudent ? supervisorInfo : null}
            action={
              <EditOwnProfile
                userId={targetUser.id}
                firstName={targetUser.first_name}
                lastName={targetUser.last_name}
                email={targetUser.email}
              />
            }
          />

          {/* معلومات on its own and first: standing facts about the member, said
              once, before any dashboard. It used to live inside the student
              dashboard, which meant a supervisor-only member never saw their own
              details at all and a member with both roles saw them under one tab. */}
          <section
            aria-labelledby="own-meta-heading"
            className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4"
          >
            <SectionHeading
              id="own-meta-heading"
              icon={<Info className="w-4 h-4" strokeWidth={2.2} />}
              title="معلومات"
            />
            <ProfileMetaInfo
              supervisor={null}
              referrer={referrerInfo}
              email={targetUser.email}
              dateJoined={targetUser.date_joined}
              visibility={visibility}
            />
            {isAdmin && (
              <Link
                href="/control-board"
                className={`${tajawal.className} inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-[#043F2E] text-white text-sm font-bold hover:bg-[#065f46] transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 self-start`}
              >
                الذهاب إلى لوحة التحكم
              </Link>
            )}
          </section>

          {quietMembers?.success && quietMembers.data && (
            <QuietMembersCard members={quietMembers.data} />
          )}

          {/* Two roles — one page: the member switches between their dashboards
              instead of scrolling past one to reach the other. */}
          {hasBothDashboards ? (
            <ProfileRoleTabs
              initialView={initialView}
              studentPanel={studentPanel}
              supervisorPanel={supervisorPanel}
            />
          ) : (
            (studentPanel ?? supervisorPanel)
          )}
        </div>
      </div>
    );
  }

  // ============================
  // Other user's profile — apply visibility rules
  // ============================
  const today = new Date();
  const hijriNow = gregorianToHijri({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
  const monthLabel = `${getHijriMonth(hijriNow.month - 1)} ${toArabicDigits(hijriNow.year)}`;

  const memberMonth = await getUserPointsForMonth(targetUser.id, hijriNow.year, hijriNow.month);
  const monthActivitiesForMember = enrichActivities(
    memberMonth.success ? (memberMonth.data?.activities ?? []) : [],
    categories,
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const monthPointsForMember = memberMonth.success ? (memberMonth.data?.points ?? 0) : 0;

  const viewerIsAdmin = (currentUser.groups || []).includes("Admin");
  // The API computes points for the Student group only, so a supervisor's or an
  // administrator's ٠ is an artefact of the query, not a fact about them.
  const targetIsStudent = (targetUser.groups || []).includes("Student");
  const lastActivityAt = activities.reduce<string | null>((latest, a) => {
    if (!latest) return a.date;
    return new Date(a.date).getTime() > new Date(latest).getTime() ? a.date : latest;
  }, null);
  const inactiveWeeks = weeksSinceActivity(lastActivityAt);

  return (
    <div className="w-full min-h-screen bg-[#EBF0EB] py-8 md:py-10" dir="rtl">
      <div className="container mx-auto px-4 lg:px-12 max-w-3xl flex flex-col gap-5 md:gap-6">
        <ProfileHeader
          firstName={targetUser.first_name}
          lastName={targetUser.last_name}
          username={targetUser.username}
          groups={targetUser.groups || []}
          supervisor={targetIsStudent && visibility.showSupervisor ? supervisorInfo : null}
        />

        {/* A member who has recorded nothing for weeks has usually stopped coming.
            Only an administrator sees this: reaching out is theirs to do, and a
            supervisor's part is limited to recitation and reading. */}
        {viewerIsAdmin && targetIsStudent && isLongInactive(lastActivityAt, targetUser.date_joined) && (
          <div className="bg-[#F4E0D6] border border-[#9B3D2E]/30 rounded-3xl p-5 md:p-6 flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-[#9B3D2E]/10 text-[#9B3D2E] flex items-center justify-center">
              <BellRing className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <h3 className={`${lalezar.className} text-lg text-[#9B3D2E] leading-none`}>
                منقطع عن النشاط
              </h3>
              <p className={`${tajawal.className} text-sm text-[#9B3D2E]/90 leading-relaxed`}>
                {inactiveWeeks === null
                  ? "لم يسجّل هذا العضو أي نشاط منذ انضمامه."
                  : `آخر نشاط لهذا العضو كان قبل ${toArabicDigits(inactiveWeeks)} أسبوعًا.`}{" "}
                يُستحسن التواصل معه والاطمئنان عليه.
              </p>
            </div>
          </div>
        )}

        {/* Meta info (visibility-controlled) */}
        <section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4">
          <SectionHeading
            id="member-meta-heading"
            icon={<Info className="w-4 h-4" strokeWidth={2.2} />}
            title="معلومات"
          />
          {/* The header names the supervisor; repeating it here says nothing new */}
          <ProfileMetaInfo
            supervisor={null}
            referrer={visibility.showReferrer ? referrerInfo : null}
            email={visibility.showEmail ? targetUser.email : ""}
            dateJoined={visibility.showDateJoined ? targetUser.date_joined : ""}
            visibility={visibility}
          />
        </section>

        {/* This member's month — the same Hijri month the rest of the product
            counts in, and open to every member rather than to a privileged few */}
        {targetIsStudent && (
          <section
            aria-labelledby="member-activities-heading"
            className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6 flex flex-col gap-4"
          >
            <SectionHeading
              id="member-activities-heading"
              icon={<History className="w-4 h-4" strokeWidth={2.2} />}
              title="نشاط هذا الشهر"
              sub={`${monthLabel} هـ · ${arabicPoints(monthPointsForMember)}`}
            />
            <ProfileActivityList
              activities={monthActivitiesForMember}
              emptyMessage="لم يسجّل أي نشاط هذا الشهر"
            />
          </section>
        )}
      </div>
    </div>
  );
}

// نقطة / نقطتان / نقاط — Arabic does not take one plural for every count
function arabicPoints(n: number): string {
  if (n === 0) return "لا نقاط";
  if (n === 1) return "نقطة واحدة";
  if (n === 2) return "نقطتان";
  if (n <= 10) return `${toArabicDigits(n)} نقاط`;
  return `${toArabicDigits(n)} نقطة`;
}

// Shown when a handle resolves to nobody, or the API cannot answer for them
function ProfileNotFound({ message }: { message: string }) {
  return (
    <div
      className="w-full min-h-screen bg-[#EBF0EB] flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className={`${lalezar.className} text-2xl text-[#043F2E]`}>
          تعذّر تحميل الملف الشخصي
        </h1>
        <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>{message}</p>
        <Link
          href="/"
          className={`${tajawal.className} inline-flex items-center gap-2 h-11 px-5 bg-[#043F2E] text-white rounded-xl text-sm font-bold hover:bg-[#065f46] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2`}
        >
          <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}

// Category names and point values come from the API — never hard-coded here
function enrichActivities(
  activities: { id: number; category: number; date: string; multiplier: number }[],
  categories: { id: number; name: string; value: number }[],
): UserActivity[] {
  if (categories.length === 0) return activities;
  const byId = new Map(categories.map((c) => [c.id, c]));
  return activities.map((a) => ({
    ...a,
    category_name: byId.get(a.category)?.name,
    points: (byId.get(a.category)?.value ?? 0) * a.multiplier,
  }));
}

