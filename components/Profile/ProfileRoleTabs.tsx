"use client";

// A member can hold more than one role. Stacking both dashboards makes one very
// long page, so they become two panels behind a switch. Both panels are rendered
// on the server and handed here as nodes — switching only changes which one is
// visible, it never refetches. The choice is written back into the URL
// (?view=student|supervisor) with the History API rather than a router
// navigation, so a reload or a shared link lands on the same dashboard without
// re-running the page's fetches.

import { useRef, useId, useState } from "react";
import { Tajawal } from "next/font/google";
import { BookOpen, Shield } from "lucide-react";

const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });

export type ProfileRoleView = "student" | "supervisor";

const TAB_ORDER: ProfileRoleView[] = ["student", "supervisor"];

const TAB_META: Record<
  ProfileRoleView,
  { label: string; icon: typeof BookOpen }
> = {
  student: { label: "لوحة الطالب", icon: BookOpen },
  supervisor: { label: "لوحة المشرف", icon: Shield },
};

interface Props {
  /** Which panel the server rendered as selected — keeps the first paint stable. */
  initialView: ProfileRoleView;
  studentPanel: React.ReactNode;
  supervisorPanel: React.ReactNode;
}

export default function ProfileRoleTabs({
  initialView,
  studentPanel,
  supervisorPanel,
}: Props) {
  const [view, setView] = useState<ProfileRoleView>(initialView);
  const uid = useId();
  const tabRefs = useRef<Partial<Record<ProfileRoleView, HTMLButtonElement | null>>>({});

  const tabId = (key: ProfileRoleView) => `${uid}-tab-${key}`;
  const panelId = (key: ProfileRoleView) => `${uid}-panel-${key}`;

  const select = (key: ProfileRoleView) => {
    if (key !== view) setView(key);
    // Update the address bar in place: no navigation, no refetch, but the
    // choice survives a reload and can be linked.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("view", key);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const index = TAB_ORDER.indexOf(view);
    let next: ProfileRoleView | null = null;

    switch (e.key) {
      // RTL: the tab to the visual left is the one that comes next in reading order
      case "ArrowLeft":
        next = TAB_ORDER[(index + 1) % TAB_ORDER.length];
        break;
      case "ArrowRight":
        next = TAB_ORDER[(index - 1 + TAB_ORDER.length) % TAB_ORDER.length];
        break;
      case "Home":
        next = TAB_ORDER[0];
        break;
      case "End":
        next = TAB_ORDER[TAB_ORDER.length - 1];
        break;
      default:
        return;
    }

    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-5 md:gap-6" dir="rtl">
      <div
        role="tablist"
        aria-label="لوحات العضوية"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F7FBEA] border border-[#043F2E]/15"
      >
        {TAB_ORDER.map((key) => {
          const { label, icon: Icon } = TAB_META[key];
          const isActive = key === view;

          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={tabId(key)}
              aria-selected={isActive}
              aria-controls={panelId(key)}
              tabIndex={isActive ? 0 : -1}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              onClick={() => select(key)}
              className={`${tajawal.className} h-12 md:h-11 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#043F2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7FBEA] ${
                isActive
                  ? "bg-[#043F2E] text-white shadow-sm"
                  : "text-[#043F2E] hover:bg-white/70"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
              {label}
            </button>
          );
        })}
      </div>

      {/* The inactive panel is hidden with the `hidden` attribute, so it leaves the
          accessibility tree and the tab order instead of merely disappearing. */}
      <div
        role="tabpanel"
        id={panelId("student")}
        aria-labelledby={tabId("student")}
        hidden={view !== "student"}
        className={view === "student" ? "flex flex-col gap-5 md:gap-6" : undefined}
      >
        {studentPanel}
      </div>

      <div
        role="tabpanel"
        id={panelId("supervisor")}
        aria-labelledby={tabId("supervisor")}
        hidden={view !== "supervisor"}
        className={view === "supervisor" ? "flex flex-col gap-5 md:gap-6" : undefined}
      >
        {supervisorPanel}
      </div>
    </div>
  );
}
