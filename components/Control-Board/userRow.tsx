"use client";

import { addUserActivity, deleteUserActivity, updateUserSupervisor } from "@/actions/ControlBoard";

import { Tajawal } from "next/font/google";
import { hijriToGregorian } from "@tabby_ai/hijri-converter";
import { Check, User, Users } from "lucide-react";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

type Category = { id: number; name: string };

type Activity = {
  id: number;
  category: number;
  date: string;
};

type UserPoints = {
  user: number;
  points: number;
  activities: Activity[];
};

type SupervisorOption = { username: string; first_name: string; last_name: string };

type Props = {
  userId: number;
  points: UserPoints[];
  firstname: string;
  lastname: string;
  supervisor: string | null;
  supervisors: SupervisorOption[];
  categories: Category[];
  setLoading: (arg0: boolean) => void;
  weekIndex: number;
  fetchWeekData: (arg0: number) => void;
  loading: boolean;
  currentYear: number;
  currentMonth: number;
  currentWeek: number;
  variant: "desktop" | "mobile";
  isLast?: boolean;
};

export default function UserRow({
  userId,
  points,
  firstname,
  lastname,
  supervisor,
  supervisors,
  categories,
  setLoading,
  weekIndex,
  fetchWeekData,
  loading,
  currentMonth,
  currentYear,
  currentWeek,
  variant,
  isLast,
}: Props) {
  const userData = points?.find((p) => p.user === userId);
  const userPoints = userData?.points ?? 0;
  const activitiesList: Activity[] = userData?.activities ?? [];

  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.trim();

  const handleInput = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    activityId: number | undefined,
    categoryId: number,
    uid: number,
    count?: number | string,
  ) => {
    if (loading) return;

    let date = "";

    if (weekIndex === currentWeek) {
      date = new Date().toISOString();
    } else {
      const day = weekIndex === 1 ? 1 : (weekIndex - 1) * 7 + 1;
      const currentDate = hijriToGregorian({
        year: currentYear,
        month: currentMonth,
        day,
      });
      date = `${currentDate.year}-${currentDate.month}-${currentDate.day}T17:55:09.157Z`;
    }

    setLoading(true);

    try {
      if (categoryId === 5) {
        const newCount = Number(count);
        const existingActivities = activitiesList.filter((a) => a.category === 5);
        const currentCount = existingActivities.length;
        if (newCount > currentCount) {
          const diff = newCount - currentCount;
          for (let i = 0; i < diff; i++) {
            await addUserActivity(uid, 5, date, 1);
          }
        } else if (newCount < currentCount) {
          const toDelete = existingActivities.slice(0, currentCount - newCount);
          for (const act of toDelete) {
            await deleteUserActivity(uid, act.id);
          }
        }
      } else {
        const checked = (e.target as HTMLInputElement).checked;
        if (checked) {
          await addUserActivity(uid, categoryId, date, 1);
        } else if (activityId !== undefined) {
          await deleteUserActivity(uid, activityId);
        }
      }

      await fetchWeekData(weekIndex);
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (loading) return;

    setLoading(true);
    const res = await updateUserSupervisor(userId, e.target.value || null);
    if (!res.success && res.error) {
      alert(res.error);
    }
    await fetchWeekData(weekIndex);
    setLoading(false);
  };

  if (variant === "mobile") {
    return (
      <MobileCard
        fullName={fullName}
        initials={initials}
        supervisor={supervisor}
        supervisors={supervisors}
        onSupervisorChange={handleSupervisorChange}
        userPoints={userPoints}
        categories={categories}
        activitiesList={activitiesList}
        loading={loading}
        onInput={handleInput}
        userId={userId}
      />
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${
        !isLast ? "border-b border-[#043F2E]/8" : ""
      }`}
    >
      {/* Avatar */}
      <div className="w-[44px] h-[44px] shrink-0 rounded-xl bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
        <span className={`${tajawal.className} text-sm font-bold leading-none`}>
          {initials || <User className="w-4 h-4" strokeWidth={2.2} />}
        </span>
      </div>

      {/* Name */}
      <div className="w-[150px] shrink-0 min-w-0">
        <p
          className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}
          title={fullName}
        >
          {fullName}
        </p>
      </div>

      {/* Group / Supervisor */}
      <div className="w-[120px] shrink-0 min-w-0 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5 text-[#043F2E]/40 shrink-0" strokeWidth={2.2} />
        <select
          value={supervisor || ""}
          disabled={loading}
          onChange={handleSupervisorChange}
          title={supervisor || "بدون مشرف"}
          className={`${tajawal.className} w-full h-8 min-w-0 bg-transparent border-none rounded-md text-xs font-medium text-[#043F2E]/70 truncate focus:outline-none focus:bg-[#F7FBEA] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer appearance-none`}
        >
          <option value="">— بدون مشرف —</option>
          {supervisors.map((s) => (
            <option key={s.username} value={s.username}>
              {`${s.first_name} ${s.last_name}`.trim() || s.username}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {[...(categories || [])]
          .sort((a, b) => (a.id === 5 ? 1 : b.id === 5 ? -1 : 0))
          .map((category: Category) => {
            const categoryActivities = activitiesList.filter((act) => act.category === category.id);

            const currentActivity = category.id === 5 ? categoryActivities : categoryActivities[0];

            if (category.id === 5) {
              return (
                <div key={category.id} className="flex-1 min-w-0 flex justify-center">
                  <select
                    value={Array.isArray(currentActivity) ? currentActivity.length : 0}
                    disabled={loading}
                    onChange={(e) =>
                      handleInput(
                        e,
                        Array.isArray(currentActivity) ? currentActivity[0]?.id : undefined,
                        category.id,
                        userId,
                        e.target.value,
                      )
                    }
                    className={`${tajawal.className} w-full max-w-[64px] h-9 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-lg cursor-pointer disabled:opacity-50 text-xs font-bold text-[#043F2E] text-center focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors appearance-none`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23043F2E'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "left 0.4rem center",
                      backgroundSize: "14px 14px",
                      paddingLeft: "1.5rem",
                      paddingRight: "0.5rem",
                    }}
                  >
                    {Array.from({ length: 21 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            const isChecked = !!currentActivity;
            return (
              <div key={category.id} className="flex-1 min-w-0 flex justify-center">
                <Checkbox
                  checked={isChecked}
                  disabled={loading}
                  onChange={(e) =>
                    handleInput(
                      e,
                      Array.isArray(currentActivity) ? currentActivity[0]?.id : currentActivity?.id,
                      category.id,
                      userId,
                    )
                  }
                  title={category.name}
                />
              </div>
            );
          })}
      </div>

      {/* Total */}
      <div className="w-[90px] shrink-0 flex justify-center">
        <div
          className={`${tajawal.className} min-w-[48px] h-9 px-3 flex items-center justify-center rounded-xl font-bold text-sm ${
            userPoints > 0 ? "bg-[#BEE663] text-[#043F2E]" : "bg-[#F7FBEA] text-[#043F2E]/40"
          }`}
        >
          {userPoints}
        </div>
      </div>
    </div>
  );
}

// ============================
// 🟢 Custom Checkbox
// ============================
function Checkbox({
  checked,
  disabled,
  onChange,
  title,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title?: string;
}) {
  return (
    <label
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
        checked
          ? "bg-[#BEE663] border-[#043F2E] shadow-sm"
          : "bg-[#F7FBEA] border-[#043F2E]/15 hover:border-[#043F2E]/40"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={title}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      {checked && <Check className="w-4 h-4 text-[#043F2E]" strokeWidth={3} />}
    </label>
  );
}

// ============================
// 🟢 Mobile Card variant
// ============================
function MobileCard({
  fullName,
  initials,
  supervisor,
  supervisors,
  onSupervisorChange,
  userPoints,
  categories,
  activitiesList,
  loading,
  onInput,
  userId,
}: {
  fullName: string;
  initials: string;
  supervisor: string | null;
  supervisors: SupervisorOption[];
  onSupervisorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userPoints: number;
  categories: Category[];
  activitiesList: Activity[];
  loading: boolean;
  onInput: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    activityId: number | undefined,
    categoryId: number,
    uid: number,
    count?: number | string,
  ) => void;
  userId: number;
}) {
  return (
    <div className="bg-[#F7FBEA] rounded-2xl border border-[#043F2E]/10 p-4 flex flex-col gap-4">
      {/* Header: Avatar + Name + Total */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
          <span className={`${tajawal.className} text-base font-bold leading-none`}>
            {initials || <User className="w-5 h-5" strokeWidth={2.2} />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${tajawal.className} text-base font-bold text-[#043F2E] truncate`}>
            {fullName}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3 text-[#043F2E]/40 shrink-0" strokeWidth={2.2} />
            <select
              value={supervisor || ""}
              disabled={loading}
              onChange={onSupervisorChange}
              className={`${tajawal.className} max-w-[150px] bg-transparent border-none text-xs font-medium text-[#043F2E]/60 truncate focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer appearance-none`}
            >
              <option value="">— بدون مشرف —</option>
              {supervisors.map((s) => (
                <option key={s.username} value={s.username}>
                  {`${s.first_name} ${s.last_name}`.trim() || s.username}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          className={`${tajawal.className} shrink-0 min-w-[56px] h-10 px-3 flex items-center justify-center rounded-xl font-bold text-base ${
            userPoints > 0
              ? "bg-[#BEE663] text-[#043F2E]"
              : "bg-white text-[#043F2E]/40 border border-[#043F2E]/10"
          }`}
        >
          {userPoints}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#043F2E]/10" />

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-2">
        {categories?.map((category: Category) => {
          const categoryActivities = activitiesList.filter((act) => act.category === category.id);

          const currentActivity = category.id === 5 ? categoryActivities : categoryActivities[0];

          if (category.id === 5) {
            return (
              <div
                key={category.id}
                className="flex flex-col gap-1.5 bg-white rounded-xl p-2.5 border border-[#043F2E]/8"
              >
                <span
                  className={`${tajawal.className} text-[11px] font-medium text-[#043F2E]/60 truncate`}
                >
                  {category.name}
                </span>
                <select
                  value={Array.isArray(currentActivity) ? currentActivity.length : 0}
                  disabled={loading}
                  onChange={(e) =>
                    onInput(
                      e,
                      Array.isArray(currentActivity) ? currentActivity[0]?.id : undefined,
                      category.id,
                      userId,
                      e.target.value,
                    )
                  }
                  className={`${tajawal.className} w-full h-9 bg-[#F7FBEA] border border-[#043F2E]/15 rounded-lg cursor-pointer disabled:opacity-50 text-xs font-bold text-[#043F2E] text-center focus:outline-none focus:border-[#043F2E]/40 focus:bg-white transition-colors appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23043F2E'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "left 0.4rem center",
                    backgroundSize: "14px 14px",
                    paddingLeft: "1.5rem",
                    paddingRight: "0.5rem",
                  }}
                >
                  {Array.from({ length: 21 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          const isChecked = !!currentActivity;
          return (
            <button
              key={category.id}
              type="button"
              disabled={loading}
              onClick={() => {
                const syntheticEvent = {
                  target: { checked: !isChecked },
                } as React.ChangeEvent<HTMLInputElement>;
                onInput(
                  syntheticEvent,
                  Array.isArray(currentActivity) ? currentActivity[0]?.id : currentActivity?.id,
                  category.id,
                  userId,
                );
              }}
              className={`flex items-center gap-2.5 bg-white rounded-xl p-2.5 border transition-all text-start ${
                isChecked ? "border-[#043F2E]/30 bg-[#BEE663]/10" : "border-[#043F2E]/8"
              } ${loading ? "opacity-50" : "active:scale-[0.98]"}`}
            >
              <div
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isChecked
                    ? "bg-[#BEE663] border border-[#043F2E]"
                    : "bg-[#F7FBEA] border border-[#043F2E]/15"
                }`}
              >
                {isChecked && <Check className="w-4 h-4 text-[#043F2E]" strokeWidth={3} />}
              </div>
              <span
                className={`${tajawal.className} text-xs font-medium text-[#043F2E] truncate flex-1`}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
