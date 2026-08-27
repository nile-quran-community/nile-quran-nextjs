"use client";

import { useState, memo } from "react";

import { Tajawal } from "next/font/google";
import { Check, Minus, Plus, User, Users, X } from "lucide-react";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

type Category = { id: number; name: string };

type Activity = {
  id: number;
  category: number;
  date: string;
  multiplier: number;
};

type UserPoints = {
  user: number;
  points: number;
  activities: Activity[];
};

type SupervisorOption = { username: string; first_name: string; last_name: string };

type MultiplierEdit = { categoryId: number; name: string; value: number };

// Sparse local override: a category key is present only once that category has been touched
// this session. Absent = "no local edit, use the server value." supervisor follows the same
// rule via `undefined`.
export type DraftEntry = {
  activities?: Record<number, number>;
  supervisor?: string | null;
};

type Props = {
  userId: number;
  points: UserPoints | undefined;
  firstname: string;
  lastname: string;
  supervisor: string | null;
  supervisors: SupervisorOption[];
  categories: Category[];
  draft: DraftEntry | undefined;
  isDirty: boolean;
  disabled: boolean;
  onCategoryDraftChange: (userId: number, categoryId: number, multiplier: number) => void;
  onSupervisorDraftChange: (userId: number, supervisor: string | null) => void;
  variant: "desktop" | "mobile";
  isLast?: boolean;
};

function UserRowComponent({
  userId,
  points,
  firstname,
  lastname,
  supervisor,
  supervisors,
  categories,
  draft,
  isDirty,
  disabled,
  onCategoryDraftChange,
  onSupervisorDraftChange,
  variant,
  isLast,
}: Props) {
  const userPoints = points?.points ?? 0;
  const activitiesList: Activity[] = points?.activities ?? [];

  const fullName = `${firstname} ${lastname}`.trim();
  const initials = `${firstname?.charAt(0) || ""}${lastname?.charAt(0) || ""}`.trim();

  const [multiplierEdit, setMultiplierEdit] = useState<MultiplierEdit | null>(null);

  const originalMultiplier = (categoryId: number) =>
    activitiesList.find((a) => a.category === categoryId)?.multiplier ?? 0;
  const effectiveMultiplier = (categoryId: number) =>
    draft?.activities?.[categoryId] ?? originalMultiplier(categoryId);
  const effectiveSupervisor = draft?.supervisor !== undefined ? draft.supervisor : supervisor;

  const setCategoryDraft = (categoryId: number, multiplier: number) =>
    onCategoryDraftChange(userId, categoryId, multiplier);

  const handleSupervisorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSupervisorDraftChange(userId, e.target.value || null);
  };

  const multiplierModal = multiplierEdit && (
    <MultiplierModal
      categoryName={multiplierEdit.name}
      value={multiplierEdit.value}
      loading={disabled}
      onClose={() => setMultiplierEdit(null)}
      onSelect={(n) => {
        setMultiplierEdit(null);
        setCategoryDraft(multiplierEdit.categoryId, n);
      }}
    />
  );

  if (variant === "mobile") {
    return (
      <>
        <MobileCard
          fullName={fullName}
          initials={initials}
          supervisor={effectiveSupervisor}
          supervisors={supervisors}
          onSupervisorChange={handleSupervisorChange}
          userPoints={userPoints}
          categories={categories}
          effectiveMultiplier={effectiveMultiplier}
          disabled={disabled}
          isDirty={isDirty}
          onToggle={(categoryId, checked) => setCategoryDraft(categoryId, checked ? 1 : 0)}
          onMultiplierChange={setCategoryDraft}
          onOpenMultiplier={setMultiplierEdit}
        />
        {multiplierModal}
      </>
    );
  }

  return (
    <div
      className={`group relative flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F7FBEA]/60 transition-colors ${
        isDirty ? "border-s-4 border-s-[#9ADD00] bg-[#F7FBEA]/40" : ""
      } ${!isLast ? "border-b border-[#043F2E]/8" : ""}`}
    >
      {/* Avatar */}
      <div className="w-[44px] h-[44px] shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
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
          value={effectiveSupervisor || ""}
          disabled={disabled}
          onChange={handleSupervisorChange}
          title={effectiveSupervisor || "بدون مشرف"}
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

      {/* Categories — the caller already sorts these (invite last) */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {(categories || []).map((category: Category) => {
          const value = effectiveMultiplier(category.id);

          if (category.id === 5) {
            return (
              <div key={category.id} className="flex-1 min-w-0 flex justify-center">
                <MultiplierStepper
                  value={value}
                  min={0}
                  max={20}
                  disabled={disabled}
                  title={category.name}
                  onCommit={(n) => setCategoryDraft(category.id, n)}
                />
              </div>
            );
          }

          const isChecked = value > 0;
          return (
            <div
              key={category.id}
              className="flex-1 min-w-0 flex items-center justify-center gap-1"
            >
              <Checkbox
                checked={isChecked}
                disabled={disabled}
                onChange={(e) => setCategoryDraft(category.id, e.target.checked ? 1 : 0)}
                title={category.name}
              />
              {isChecked && (
                <MultiplierBadge
                  value={value}
                  disabled={disabled}
                  title={category.name}
                  onClick={() =>
                    setMultiplierEdit({ categoryId: category.id, name: category.name, value })
                  }
                />
              )}
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

      {multiplierModal}
    </div>
  );
}

export default memo(UserRowComponent);

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
// 🟢 Multiplier stepper (invite member)
// ============================
function MultiplierStepper({
  value,
  min,
  max,
  disabled,
  title,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  title?: string;
  onCommit: (value: number) => void;
}) {
  const stepperButton =
    "w-7 h-full flex items-center justify-center text-[#043F2E]/70 hover:bg-[#DEFF90]/60 hover:text-[#043F2E] transition-colors disabled:opacity-30 disabled:pointer-events-none";

  return (
    <div
      title={title}
      className={`flex items-center shrink-0 h-9 rounded-lg border border-[#043F2E]/15 bg-[#F7FBEA] overflow-hidden ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        aria-label="إنقاص"
        disabled={disabled || value <= min}
        onClick={() => onCommit(value - 1)}
        className={stepperButton}
      >
        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
      <span
        className={`${tajawal.className} w-7 text-center text-xs font-bold text-[#043F2E] tabular-nums border-x border-[#043F2E]/10 leading-9`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="زيادة"
        disabled={disabled || value >= max}
        onClick={() => onCommit(value + 1)}
        className={stepperButton}
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ============================
// 🟢 Multiplier badge (opens modal)
// ============================
function MultiplierBadge({
  value,
  disabled,
  title,
  onClick,
}: {
  value: number;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`${tajawal.className} h-6 min-w-[28px] px-1.5 rounded-md bg-[#F7FBEA] border border-[#043F2E]/15 text-[11px] font-bold leading-none text-[#043F2E]/70 hover:border-[#043F2E]/40 hover:text-[#043F2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {value}x
    </button>
  );
}

// ============================
// 🟢 Multiplier modal
// ============================
function MultiplierModal({
  categoryName,
  value,
  loading,
  onSelect,
  onClose,
}: {
  categoryName: string;
  value: number;
  loading: boolean;
  onSelect: (value: number) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#043F2E]/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={categoryName}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[280px] bg-white rounded-3xl border border-[#043F2E]/10 shadow-lg p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className={`${tajawal.className} text-sm font-bold text-[#043F2E] truncate`}>
            {categoryName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[#043F2E]/60 hover:bg-[#F7FBEA] hover:text-[#043F2E] transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={loading}
              onClick={() => onSelect(n)}
              className={`${tajawal.className} w-10 h-10 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 ${
                n === value
                  ? "bg-[#BEE663] border-[#043F2E] text-[#043F2E] shadow-sm"
                  : "bg-[#F7FBEA] border-[#043F2E]/15 text-[#043F2E]/70 hover:border-[#043F2E]/40"
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>
    </div>
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
  effectiveMultiplier,
  disabled,
  isDirty,
  onToggle,
  onMultiplierChange,
  onOpenMultiplier,
}: {
  fullName: string;
  initials: string;
  supervisor: string | null;
  supervisors: SupervisorOption[];
  onSupervisorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userPoints: number;
  categories: Category[];
  effectiveMultiplier: (categoryId: number) => number;
  disabled: boolean;
  isDirty: boolean;
  onToggle: (categoryId: number, checked: boolean) => void;
  onMultiplierChange: (categoryId: number, multiplier: number) => void;
  onOpenMultiplier: (edit: MultiplierEdit) => void;
}) {
  return (
    <div
      className={`bg-[#F7FBEA] rounded-2xl border p-4 flex flex-col gap-4 ${
        isDirty ? "border-[#9ADD00]" : "border-[#043F2E]/10"
      }`}
    >
      {/* Header: Avatar + Name + Total */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#043F2E] to-[#065f46] flex items-center justify-center text-white shadow-sm">
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
              disabled={disabled}
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
          const value = effectiveMultiplier(category.id);

          if (category.id === 5) {
            return (
              <div
                key={category.id}
                className="flex items-center justify-between gap-2 bg-white rounded-xl p-2.5 border border-[#043F2E]/8"
              >
                <span
                  className={`${tajawal.className} flex-1 min-w-0 text-[11px] font-medium text-[#043F2E]/60 truncate`}
                >
                  {category.name}
                </span>
                <MultiplierStepper
                  value={value}
                  min={0}
                  max={20}
                  disabled={disabled}
                  title={category.name}
                  onCommit={(n) => onMultiplierChange(category.id, n)}
                />
              </div>
            );
          }

          const isChecked = value > 0;
          return (
            <div key={category.id} className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(category.id, !isChecked)}
                className={`flex-1 min-w-0 flex items-center gap-2.5 bg-white rounded-xl p-2.5 border transition-all text-start ${
                  isChecked ? "border-[#043F2E]/30 bg-[#BEE663]/10" : "border-[#043F2E]/8"
                } ${disabled ? "opacity-50" : "active:scale-[0.98]"}`}
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
              {isChecked && (
                <MultiplierBadge
                  value={value}
                  disabled={disabled}
                  title={category.name}
                  onClick={() =>
                    onOpenMultiplier({ categoryId: category.id, name: category.name, value })
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
