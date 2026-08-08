## 1. Project Overview

**مقرأة النيل** is a community-driven Islamic initiative that helps Egyptian university students build a lifelong relationship with the Quran through memorization, recitation, tadabbur (reflection), mentorship, accountability, consistency, and companionship.

The product is a web app with three user roles:

- **Student (طالب)** — memorizes weekly, recites, attends reflections, invites peers, competes for monthly points
- **Recitation Supervisor (مشرف تسميع)** — manages a recitation group, tracks student progress
- **Administrator** — manages members, groups, competitions, analytics, reports

**Monthly Points System** — the core gamification loop (used only to encourage consistency, never to overshadow the spiritual purpose):

| Action                               | Points |
| ------------------------------------ | ------ |
| Memorized + recited weekly portion   | +2     |
| Recited without memorization         | +1     |
| Attended weekly reflection (خاطرة)   | +1     |
| Prepared + delivered a reflection    | +2     |
| Invited a university student to join | +1     |

**Pages in the app:**

- `/` — home with monthly goal + leaderboard (any logged-in user)
- `/control-board` — admin panel for adjusting student points (Admin only)
- `/about` — community about page (public)
- `/auth` — login + signup (public)

## 2. Tech Stack

| Layer      | Tool                                                                    |
| ---------- | ----------------------------------------------------------------------- |
| Framework  | Next.js 15.5.6 (App Router, Turbopack)                                  |
| UI         | React 19, TypeScript (strict)                                           |
| Styling    | Tailwind CSS 4 (`@tailwindcss/postcss`)                                 |
| Fonts      | `next/font/google` — Lalezar + Tajawal (Arabic subsets)                 |
| Icons      | `lucide-react`                                                          |
| Animation  | `framer-motion` (use sparingly)                                         |
| Date/Hijri | `@tabby_ai/hijri-converter`                                             |
| Auth       | JWT in `httpOnly` cookies (`access` + `refresh`)                        |
| Backend    | Django REST API at `process.env.BASE_URL` — schema at `/api/v1/schema/` |

**Package manager:** pnpm 11.14.0

## 3. Commands

```bash
pnpm dev          # next dev --turbopack
pnpm build        # next build --turbopack
pnpm start        # next start
pnpm lint         # eslint
npx tsc --noEmit  # type check (always run before finishing a task)
```

## 4. Design System

### 4.1 Brand colors — USE ONLY THESE

| Token         | Hex                    | Usage                                 |
| ------------- | ---------------------- | ------------------------------------- |
| Primary       | `#043F2E`              | Headings, dark surfaces, primary text |
| Accent        | `#BEE663`              | Buttons, highlights, badges           |
| Background    | `#EBF0EB`              | Page background                       |
| Card surface  | `#F7FBEA`              | Light cards, hover states             |
| Soft lime     | `#DEFF90`              | Progress bar tracks, subtle accents   |
| Strong lime   | `#9ADD00`              | Progress fill, hover on accent        |
| Dark hover    | `#065f46`              | Hover state on `#043F2E`              |
| Dark mid      | `#2A5A45`              | Nav bar mobile menu surface           |
| Subtle border | `#043F2E]/10` or `/15` | Card borders, dividers                |
| Muted text    | `#043F2E]/40`–`/70`    | Placeholders, secondary text          |

**Do NOT introduce new colors.** No grays, no blue, no red. Map status/feedback to brand tints (e.g., `text-[#043F2E]/70` for muted errors).

### 4.2 Typography

- **Lalezar** — page titles, section titles, major headings, stat values, closing lines
- **Tajawal** — everything else (body, buttons, labels, nav, forms, tables, tooltips)

```ts
import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });
```

Always use `subsets: ["arabic"]` (never `["latin"]`) — the app is fully Arabic.

### 4.3 Spacing & corners

- Generous whitespace: `p-5 md:p-7` on cards, `gap-4`/`gap-6` between sections
- Soft rounded corners: `rounded-2xl` (small cards), `rounded-3xl` (large cards), `rounded-xl` (tooltips/inputs)
- Subtle shadows: `shadow-sm` for cards, `shadow-lg` for tooltips/popovers
- No glassmorphism, no flashy gradients, no gaming aesthetics

### 4.4 Visual tone

- **Islamic Elegant** · **Modern** · **Minimal** · **Calm** · **Premium** · **Trustworthy** · **Community-oriented**
- Use subtle Islamic geometric motifs as decorative background elements only (e.g., `public/abstract mob.svg` at 4–5% opacity in hero/closing sections)
- Never use emoji as UI icons — use `lucide-react`

### 4.5 RTL rules

- Set `dir="rtl"` on the root container of any Arabic page/component
- Use logical properties where it matters: `text-start`/`text-end`, `ms-*`/`me-*`
- `lucide-react` chevron icons need to be swapped for RTL: `ChevronRight` for "next", `ChevronLeft` for "prev" in Arabic context
- Form fields with `dir="auto"` on inputs handle mixed Arabic/English content correctly (usernames, emails)
- Error/tooltip text rendered in an LTR page context must explicitly set `dir="rtl"` on the container

## 5. File Structure

```
app/
  (auth)/auth/          # public auth pages
    layout.tsx          # <html lang="en"> (do NOT change)
    page.tsx            # login + signup shell
  (main)/               # authenticated routes
    layout.tsx          # <html lang="en"> (do NOT change)
    page.tsx            # home (leaderboard + goal)
    control-board/      # admin panel
    about/              # community about page
  globals.css

components/
  Auth/                 # Auth.tsx, LoginForm.tsx, SignUpForm.tsx, InfoTooltip.tsx
  Control-Board/        # ControlPanelClient.tsx, userRow.tsx
  Home/                 # DashboardContainer, PerformanceBoardClient, MonthGoalClient
  NavBar/               # NavBar, NavBarMobileMenu, LogoutButton
  About/                # AboutContent.tsx
  ui/                   # progress.tsx, spinner.tsx (shared primitives)

actions/
  auth-actions.ts       # login, signup, checkTokenValidity, logout
  ControlBoard.ts       # getUsers, getCategories, getPoints, addUserActivity, deleteUserActivity
  PerformanceBoard.ts   # getLeaderboardData, getUserDetails
  goal.ts               # getGoalOfTheMonth

lib/
  utils.ts              # cn, getHijriMonth, toArabicDigits, getHijriMonthDays
  user.ts               # Login, createUser, getUserRole
  types.ts
  auth.ts

public/
  abstract.png          # desktop decorative background (auth page)
  abstract mob.svg      # mobile decorative background
  goalArrow.png
  menu.png
```

## 6. Code Patterns

### 6.1 Page anatomy

Every page follows this skeleton:

```tsx
<section className="relative bg-[#043F2E] text-white overflow-hidden">
  {/* optional decorative blurs */}
  <div className="relative max-w-4xl mx-auto px-6 md:px-10 py-16 md:py-20">
    <div className="flex items-center gap-3">{/* icon badge + eyebrow */}</div>
    <h1 className={`${lalezar.className} text-3xl md:text-5xl leading-tight`}>{title}</h1>
    {/* subtitle with horizontal accent lines */}
  </div>
</section>

<div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col gap-6">
  {/* content cards */}
</div>
```

### 6.2 Section card

```tsx
<section className="bg-white rounded-3xl border border-[#043F2E]/10 shadow-sm p-5 md:p-7">
  <div className="flex flex-col gap-2">
    <span
      className={`${tajawal.className} text-[11px] font-bold text-[#043F2E]/50 uppercase tracking-wider`}
    >
      {eyebrow}
    </span>
    <h2 className={`${lalezar.className} text-2xl md:text-3xl text-[#043F2E] leading-tight`}>
      {title}
    </h2>
  </div>
  <div className="h-px bg-[#043F2E]/8" />
  {children}
</section>
```

### 6.3 Stats chip / icon badge

```tsx
// Light stat chip
<div className="rounded-2xl px-3.5 py-3 border bg-[#F7FBEA] border-[#043F2E]/8 flex flex-col gap-1.5">
  <div className="flex items-center gap-1.5 text-[#043F2E]/60">
    {icon}
    <span className={`${tajawal.className} text-[11px] font-medium truncate`}>{label}</span>
  </div>
  <span className={`${lalezar.className} text-xl md:text-2xl text-[#043F2E] leading-none`}>{value}</span>
</div>

// Dark icon badge
<div className="w-10 h-10 rounded-xl bg-[#043F2E] text-[#BEE663] flex items-center justify-center">
  <Icon className="w-5 h-5" strokeWidth={2.2} />
</div>

// Lime icon badge (on white cards)
<div className="w-10 h-10 rounded-xl bg-[#BEE663] text-[#043F2E] flex items-center justify-center">
  <Icon className="w-5 h-5" strokeWidth={2.2} />
</div>
```

### 6.4 Button

```tsx
// Primary (lime)
className = "bg-[#BEE663] hover:bg-[#9ADD00] text-[#043F2E] font-bold transition-colors";

// Dark
className = "bg-[#043F2E] hover:bg-[#065f46] text-white transition-colors";

// Pill tab (active)
className = "bg-[#043F2E] text-white shadow-sm";

// Pill tab (inactive)
className = "text-[#043F2E] hover:bg-white/50";
```

### 6.5 Form input (auth)

Forms use the LTR page context with `items-end` for right-alignment:

```tsx
<div className="flex flex-col gap-3 items-end">
  <label className="text-[#043F2E] text-[20px] max-sm:text-[16px]">{label}</label>
  <div className="relative w-full">
    <Icon
      className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#043F2E]/60 pointer-events-none"
      strokeWidth={2.2}
    />
    <input
      dir="auto"
      className="bg-white w-full h-14 max-sm:h-11 rounded-[7px] border border-[#043F2E] placeholder:text-end pr-11 pl-5 focus:placeholder:opacity-0"
    />
  </div>
</div>
```

For RTL form contexts, swap to `items-start` + `placeholder:text-start` to keep right-alignment.

### 6.6 Server action (auth-gated fetcher)

```ts
"use server";
import { cookies } from "next/headers";

export async function getSomething(year: number, month: number) {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;
  if (!access) throw new Error("No access token found");
  const res = await fetch(`${process.env.BASE_URL}api/v1/...`, {
    headers: { Authorization: `Bearer ${access}`, "Accept-Language": "ar" },
    cache: "no-store",
  });
  // ...
}
```

### 6.7 Hijri date handling

```ts
import { gregorianToHijri, hijriToGregorian } from "@tabby_ai/hijri-converter";
import { getHijriMonthDays, getHijriMonth, toArabicDigits } from "@/lib/utils";

// Convert today to Hijri
const hijri = gregorianToHijri({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
});

// Bucket Hijri day into 5 weeks
const week = hijri.day <= 28 ? Math.ceil(hijri.day / 7) : 5;

// Get Arabic month name (index 0-11)
getHijriMonth(month - 1); // "محرم", "صفر", ...

// Convert any number to ٠-٩
toArabicDigits(123); // "١٢٣"

// Days in a Hijri month (29 or 30)
const days = getHijriMonthDays(year, month);
```

### 6.8 API response shape (DRF pagination)

Most endpoints return paginated lists:

```ts
{ count: number, next: string | null, previous: string | null, results: T[] }
```

Always read `.results`, never the raw response.

### 6.9 Page guard

```ts
// app/(main)/control-board/page.tsx
import { checkTokenValidity } from "@/actions/auth-actions";
import { redirect } from "next/navigation";

export default async function ControlPanelPage() {
  const User = await checkTokenValidity();
  if (!User.isValid || !User.user.groups.includes("Admin")) {
    redirect("/auth");
  }
  return <ControlPanelClient />;
}
```

### 6.10 Render conditions for data-driven components

```tsx
// 1. Loading — skeleton matching real layout
// 2. Error — branded card with refresh button
// 3. Empty — encouraging copy + icon
// 4. Main render
```

Never let the UI show undefined/NaN. Always derive `max`, `min`, `sum` safely:

```ts
const total = items?.reduce((s, u) => s + (u.points || 0), 0) ?? 0;
const max = items.length > 0 ? Math.max(...items.map((u) => u.points)) : 0;
```

### 6.11 Responsive layout

- Mobile-first, single column
- `sm:` (640px+) — tablet, 2 columns
- `lg:` (1024px+) — desktop, 3+ columns
- `max-sm:` — mobile-only override
- Use `flex` + `items-start` (not `stretch`) when children have different heights to prevent unwanted stretching (e.g., the goal card next to the leaderboard)

## 7. Common Gotchas

1. **Font subsets** — always `subsets: ["arabic"]` for Lalezar and Tajawal. `["latin"]` will render Arabic as fallback fonts.

2. **Tab order in RTL** — adding `dir="rtl"` to a form makes Tab move right-to-left, which is correct for Arabic. But it flips the visual alignment of `items-end`/`placeholder:text-end`. If you only want RTL tab order, accept the visual flip and swap to `items-start`/`placeholder:text-start`.

3. **Image hydration** — `next/image` with `fill` adds browser-only `data--h-b*` attributes during hydration. For decorative images, use plain `<img>` with explicit `style` instead.

4. **`<html lang>`** — both root layouts use `lang="en"` without `dir`. This is intentional for the current RTL handling pattern (using `items-end` + `placeholder:text-end` in an LTR context). **Do not change this** unless you refactor the entire form layout.

5. **`flex` stretching** — when a flex container has a short child next to a tall one, the short child stretches by default. Use `items-start` on the parent to prevent this (e.g., `DashboardContainer`).

6. **Page numbers** — always pass date filters even on endpoints that might not support them. The backend silently ignores unknown query params.

7. **`/api/v1/users/` vs `/api/v1/users/points/`** — the first returns user records, the second returns `{user, points, activities}`. Don't confuse them.

8. **Empty state for tables with < N items** — always use a fixed grid with invisible placeholders so the layout doesn't collapse. E.g., the top-3 podium always has 3 cells.

## 8. Things NOT to do

- ❌ Add new brand colors (blue, red, gray, etc.)
- ❌ Use `["latin"]` font subsets for Arabic content
- ❌ Use `next/image` for purely decorative backgrounds
- ❌ Use emoji as UI icons
- ❌ Use `glassmorphism`, `backdrop-blur`, flashy gradients
- ❌ Use gaming-style animations (bouncy, springy)
- ❌ Skip type-checking (`npx tsc --noEmit`) before finishing a task
- ❌ Add `// eslint-disable` without a comment explaining why
- ❌ Change the `<html lang>` in `app/(main)/layout.tsx` or `app/(auth)/auth/layout.tsx` without coordinating a full RTL refactor

## 9. Quick Reference: Utility Functions

From `lib/utils.ts`:

| Function                  | Signature                      | Purpose                                          |
| ------------------------- | ------------------------------ | ------------------------------------------------ |
| `cn(...inputs)`           | `(ClassValue[]) => string`     | Merge Tailwind classes (uses `clsx` + `twMerge`) |
| `getHijriMonth(i)`        | `(number) => string`           | Get Arabic month name (0-indexed)                |
| `toArabicDigits(n)`       | `(number \| string) => string` | Convert to ٠١٢٣٤٥٦٧٨٩                            |
| `getHijriMonthDays(y, m)` | `(number, number) => number`   | Returns 29 or 30                                 |
| `formatDate(d)`           | `(Date) => string`             | ISO yyyy-mm-dd                                   |
