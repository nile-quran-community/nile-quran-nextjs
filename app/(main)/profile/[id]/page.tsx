import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkTokenValidity } from "@/actions/auth-actions";
import { getUserProfile } from "@/actions/profile";
import { getProfileCategories } from "@/actions/profile";
import { getAllUsersWithRoles } from "@/actions/profile";
import { getSupervisedStudents } from "@/actions/profile";

import { Lalezar, Tajawal } from "next/font/google";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileMetaInfo from "@/components/Profile/ProfileMetaInfo";
import ProfileActivityList from "@/components/Profile/ProfileActivityList";
import RoleBadge from "@/components/Profile/RoleBadge";
import AdminProfileView from "@/components/Profile/views/AdminProfileView";
import ModeratorProfileView from "@/components/Profile/views/ModeratorProfileView";
import StudentProfileView from "@/components/Profile/views/StudentProfileView";

import { toArabicDigits } from "@/lib/utils";
import {
  getPrimaryRole,
  getVisibility,
  type UserActivity,
  type AdminUserSummary,
  type SupervisedStudent,
} from "@/lib/profile-types";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "الملف الشخصي",
  description: "عرض الملف الشخصي للمستخدمين في مقرأة النيل",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isValid, user: currentUser } = await checkTokenValidity();

  if (!isValid || !currentUser) {
    redirect("/auth");
  }

  const { id } = await params;
  const targetUserId = parseInt(id, 10);

  if (isNaN(targetUserId)) {
    redirect("/");
  }

  const isOwnProfile = currentUser.id === targetUserId;
  const viewerRole = getPrimaryRole(currentUser.groups || []);

  // Fetch target user's profile
  const profileResult = await getUserProfile(targetUserId);

  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <h1 className={`${lalezar.className} text-2xl text-[#043F2E]`}>
            تعذّر تحميل الملف الشخصي
          </h1>
          <p className={`${tajawal.className} text-sm text-[#043F2E]/60`}>
            {profileResult.error || "لم نتمكن من العثور على هذا المستخدم"}
          </p>
          <Link
            href="/"
            className={`${tajawal.className} inline-flex items-center gap-2 h-11 px-5 bg-[#043F2E] text-white rounded-xl text-sm font-bold hover:bg-[#065f46] transition-colors`}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const { user: targetUser, points, activities } = profileResult.data;
  const targetRole = getPrimaryRole(targetUser.groups || []);
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

  // Enrich activities with category names
  let enrichedActivities: UserActivity[] = activities;
  const categoriesResult = await getProfileCategories();
  if (categoriesResult.success && categoriesResult.data) {
    const catMap = new Map(categoriesResult.data.map((c) => [c.id, c]));
    enrichedActivities = activities.map((a) => ({
      ...a,
      category_name: catMap.get(a.category)?.name,
      points: (catMap.get(a.category)?.value ?? 0) * a.multiplier,
    }));
  }

  const multiplierTotal = activities.reduce((sum, a) => sum + a.multiplier, 0);
  const fullName = `${targetUser.first_name} ${targetUser.last_name}`.trim();

  // ============================
  // Own profile — show role-specific dashboard
  // ============================
  if (isOwnProfile) {
    let roleView: React.ReactNode = null;

    if (viewerRole === "Admin") {
      // Fetch all users with their data
      const allUsersResult = await getAllUsersWithRoles();
      const allUsers: AdminUserSummary[] = [];

      if (allUsersResult.success && allUsersResult.data) {
        // Try to fetch points for all users
        for (const u of allUsersResult.data) {
          allUsers.push({
            id: u.id,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            groups: u.groups,
            supervisor: u.supervisor,
            referrer: u.referrer,
            date_joined: u.date_joined,
            points: 0, // Will be enriched if points API supports bulk
          });
        }
      }

      roleView = <AdminProfileView users={allUsers} />;
    } else if (viewerRole === "Supervisor") {
      const studentsResult = await getSupervisedStudents(targetUser.username);
      const students: SupervisedStudent[] = studentsResult.success
        ? (studentsResult.data ?? [])
        : [];

      roleView = (
        <ModeratorProfileView
          students={students}
          moderatorName={fullName || targetUser.username}
        />
      );
    } else {
      roleView = (
        <StudentProfileView
          points={points}
          activities={enrichedActivities}
          multiplierTotal={multiplierTotal}
        />
      );
    }

    return (
      <div className="w-full min-h-screen bg-[#EBF0EB] py-8" dir="rtl">
        <div className="container mx-auto px-4 lg:px-12 max-w-5xl flex flex-col gap-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7">
            <ProfileHeader
              firstName={targetUser.first_name}
              lastName={targetUser.last_name}
              username={targetUser.username}
              role={targetRole}
              isOwnProfile={true}
            />
          </div>

          {/* Role-specific view */}
          {roleView}
        </div>
      </div>
    );
  }

  // ============================
  // Other user's profile — apply visibility rules
  // ============================
  const visibleActivities = visibility.showDetailedActivities
    ? enrichedActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    : [];

  return (
    <div className="w-full min-h-screen bg-[#EBF0EB] py-8" dir="rtl">
      <div className="container mx-auto px-4 lg:px-12 max-w-3xl flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7">
          <ProfileHeader
            firstName={targetUser.first_name}
            lastName={targetUser.last_name}
            username={targetUser.username}
            role={targetRole}
            isOwnProfile={false}
          />
        </div>

        {/* Stats (points always visible) */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-[#BEE663] rounded-2xl border border-[#043F2E]/15 px-4 py-3 flex flex-col gap-1">
              <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/70`}>النقاط</span>
              <span className={`${lalezar.className} text-2xl text-[#043F2E]`}>
                {toArabicDigits(points)}
              </span>
            </div>
            <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 flex flex-col gap-1">
              <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>الأنشطة</span>
              <span className={`${lalezar.className} text-2xl text-[#043F2E]`}>
                {toArabicDigits(visibility.showDetailedActivities ? activities.length : 0)}
              </span>
            </div>
            <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/8 px-4 py-3 flex flex-col gap-1">
              <span className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/50`}>الدور</span>
              <div className="flex items-center pt-1">
                <RoleBadge role={targetRole} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Meta info (visibility-controlled) */}
        <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6">
          <h3 className={`${lalezar.className} text-lg text-[#043F2E] mb-4`}>معلومات</h3>
          <ProfileMetaInfo
            supervisor={visibility.showSupervisor ? targetUser.supervisor : null}
            referrer={visibility.showReferrer ? targetUser.referrer : null}
            email={visibility.showEmail ? targetUser.email : ""}
            dateJoined={visibility.showDateJoined ? targetUser.date_joined : ""}
            visibility={visibility}
          />
        </div>

        {/* Activities (only if visible) */}
        {visibility.showDetailedActivities && visibleActivities.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-6">
            <h3 className={`${lalezar.className} text-lg text-[#043F2E] mb-4`}>آخر الأنشطة</h3>
            <ProfileActivityList activities={visibleActivities} />
          </div>
        )}

        {/* Back link */}
        <div className="flex justify-center">
          <Link
            href="/"
            className={`${tajawal.className} inline-flex items-center gap-2 h-11 px-5 bg-white border border-[#043F2E]/15 text-[#043F2E] rounded-xl text-sm font-bold hover:bg-[#F7FBEA] transition-colors`}
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}


