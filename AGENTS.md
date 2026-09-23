## 1. Platform & Project Overview

**مقرأة النيل (Nile Maqra'a)** is a community platform supporting a Quran-centered community of university students.

Its purpose is to help members build consistency around:

- Quran memorization and recitation
- Tadabbur and weekly reflections
- Good companionship and accountability
- Community participation and contribution

The platform supports the community's real-world and online activities. It is **not** a Quran reader, LMS, generic social network, productivity app, or gaming platform.

> **Good companionship, around the Quran, toward lasting impact.**

The technology is a means to support the community, not the purpose itself.

### User Roles

| Role | Needs |
|------|-------|
| **Student (طالب)** | Understand what they have done and what to do next |
| **Recitation Supervisor (مشرف تسميع)** | Actionable student follow-up |
| **Administrator (مدير)** | Operational overview |

A member can also belong to one or more **NQC teams** alongside their role — `Treasurer`, `Media`, `Developer`, `Researcher`, `Beast` (backend `settings.GROUP_PERMISSIONS`, frontend `TEAM_GROUPS` in `lib/profile-types.ts`). Roles and teams both live in the same `user.groups` array from the API; `getPrimaryRole`/`getRoles` extract the three roles, `getTeams` extracts team membership. Every group's label, icon, and description is defined once in the `GROUPS` map (`lib/profile-types.ts`) — render a group via `getGroupLabel`/`getGroupIcon`, never a hand-written switch.

### Core Domain Concepts

#### Quran Progress

Members may have a weekly Quran portion with separate:

- Memorization status
- Recitation status
- Completion status
- Current Surah/Ayah
- Progress toward the weekly target

Always keep Quran progress meaningful and understandable — never expose unnecessary metrics.

#### Weekly Activities

Common activities include:

- Memorizing and reciting the weekly portion
- Reciting without memorizing
- Attending a weekly reflection (`خاطرة`)
- Preparing and delivering a reflection
- Inviting another university student

Activities must make clear **what happened, when it happened, whether it was completed, and how many points it contributed**.

#### Points & Monthly Competition

Points are used as a lightweight mechanism to encourage consistency through a monthly competition.

| Category id | Action | Points |
| ----------: | ------ | -----: |
| 4 | Memorized + recited weekly portion | +2 |
| 3 | Recited without memorization | +1 |
| 1 | Attended weekly reflection (`خاطرة`) | +1 |
| 2 | Prepared + delivered a reflection | +2 |
| 5 | Invited a university student to join | +1 |
| 6 | Attended the team meeting | +1 |

**Domain rules:** Never change point values, activity meanings, or labels in frontend code.

Category ids are the API's own (`/api/v1/users/points/categories/`). Read labels and values from that endpoint — never hard-code them; the table above is the contract, not a substitute for the response.

When displaying points, always provide context:

> Weekly reflection attended — **+1**

Never display only: **+1**

Competition features must remain motivational and community-oriented — never make the product feel like a competitive game.

#### Achievements

Achievements recognize meaningful participation and consistency, such as Quran progress, reflection participation, consistency, and community contribution. They must reinforce valuable community behavior rather than exist purely to increase engagement.

#### Community Profile

Beyond activity tracking, every member has a **community profile** — phone, birth date, faculty, academic year, Quran memorization progress, tajweed level, residence, prior Islamic studies, skills, etc. (backend `User` model fields, mirrored in `lib/profile-fields.ts` as `ProfileFields`). None of it is required at signup; the backend computes `is_profile_complete` as a model property (one definition, never recomputed on the frontend).

- **`components/Profile/PersonalInfoSection.tsx`** renders the read-only summary and the editable form (RHF + zod, schema in `lib/schemas.ts`). It takes an `isOwnProfile` prop: on the member's own incomplete profile it opens straight into the form (the nudge); on anyone else's it always opens read-only and always offers a way to cancel back out, regardless of completeness. Default the prop to `true` and pass `false` explicitly wherever an admin can land on someone else's profile — don't assume "own profile" behavior is safe just because the component works when tested against your own account.
- **The nag** (`components/NavBar/ProfileCompletionNag.tsx` + a banner in `NavBar.tsx`) applies to every role, not just Students — a Supervisor or Admin with an incomplete profile gets nagged too. The modal is a native `<dialog>` (focus trap + Escape + top-layer for free), dismissal tracked per-user in `sessionStorage` (known limitation: this resets per browser tab, not per login).
- **Admin oversight** lives in `components/Control-Board/MembersTable.tsx` (the "الأعضاء" tab in `ControlPanelClient.tsx`) and reuses `PersonalInfoSection` on the profile page itself for editing — there's no separate admin edit UI. The backend already grants Admins edit rights on any member's profile fields (Django `CanModifyUser` + the `change_user` permission); the frontend doesn't need its own permission gate, only the `isOwnProfile` UX toggle above.

### Important Domain Principle

Points, rankings, achievements, roles, permissions, Quran assignments, and activity rules are **business/domain rules**. Frontend code must represent these rules accurately — never invent, reinterpret, or silently modify them.

When choosing between two valid UX approaches, prefer the one that better supports members in staying **connected to the Quran, connected to one another, and consistent in meaningful action**.

### Current Pages

Pages in the app:

- `/` — home with monthly goal + leaderboard (any logged-in user)
- `/about` — about page
- `/control-board` — admin panel for adjusting student points (Admin only)
- `/goals` — monthly goals page
- `/profile` — own profile (redirects to `/profile/<handle>`)
- `/profile/<handle>` — public profile by username
- `/auth` — login + signup (public; the only crawlable page, since `/` redirects unauthenticated users here)

## 2. Tech Stack

| Layer       | Tool                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| Framework   | Next.js 15 (App Router, Turbopack, `output: "standalone"` for Docker)  |
| UI          | React 19, TypeScript (strict)                                               |
| Styling     | Tailwind CSS 4 (`@tailwindcss/postcss`) + `tw-animate-css`                  |
| Primitives  | `@radix-ui/react-progress` (wrapped in `components/ui/progress.tsx`)        |
| Fonts       | `next/font/google` — Lalezar + Tajawal (Arabic subsets; see §4.6 debt)      |
| Icons       | `lucide-react`                                                              |
| Animation   | `framer-motion` (use sparingly)                                             |
| Date/Hijri  | `@tabby_ai/hijri-converter`                                                 |
| Forms       | `react-hook-form` + `zod` + `@hookform/resolvers` — canonical for every form; see §6.5 |
| Phone input | `react-phone-number-input` (UI) + `libphonenumber-js` (validation) — **not interchangeable**, see Gotcha #13 |
| Auth        | JWT in `httpOnly` cookies (`access` + `refresh`), decoded with `jwt-decode` |
| Class utils | `clsx` + `tailwind-merge` (via `cn()` in `lib/utils.ts`)                    |
| Backend     | Django REST API at `process.env.BASE_URL` — schema at `/api/v1/schema/`     |

**Package manager:** pnpm (invoked through mise tasks — see §3)

Notes:

- `components.json` (shadcn config) exists and `class-variance-authority` is installed but currently unused — a leftover from `shadcn init`. Only `progress.tsx` and `spinner.tsx` were generated.
- `globals.css` still carries the default shadcn oklch grayscale theme variables — they are effectively unused; brand colors are applied as Tailwind arbitrary values (`bg-[#043F2E]`, etc.) directly in components.

## 3. Commands

```bash
mise run dev                 # next dev --turbopack
mise run build               # next build --turbopack
mise run start               # next start
mise run lint                # oxlint (use --format flag for output format)
mise run format              # oxfmt
mise run typecheck           # tsc --noEmit
mise run hooks               # pre-commit hooks
mise run install             # pnpm install (alias: i)
```

**Always run `mise run typecheck` before finishing any task.** Never skip this.

**Testing an admin/backend-dependent flow end-to-end** (not just `tsc`/lint) needs a live Django backend, since server actions call it directly — there's no mock layer:

1. Backend is a separate repo, `nile-quran-django`, checked out wherever your local setup puts it. `rm -f dev.sqlite && mise run migrate` for a fresh DB, then run the dev server with `DJANGO_ALLOWED_HOSTS` set explicitly (the default is empty) — e.g. `DJANGO_ALLOWED_HOSTS="localhost,127.0.0.1" uv run python src/manage.py runserver 8000`.
2. Create test accounts through `uv run python src/manage.py shell` (`User.objects.create_user(...)`, `.groups.add(Group.objects.get(name="Admin"))`) rather than the signup form — new signups are inactive until an admin activates them, and `is_active=True` is a required kwarg you'd otherwise miss.
3. Run this Next.js app with `BASE_URL=http://localhost:8000/` (already the `.env.local` default) — check that port `3000` is actually free first, another process (yours or a stray one) is often already sitting on it; run on another port explicitly rather than fighting it: `./node_modules/.bin/next dev --turbopack -p 3001`.
4. Verify in a real browser against these two local servers, not by reading the diff — a change can type-check and look right while still being wrong at runtime (RTL direction bugs, a viewer-context prop left at its default, a conflict-merge that silently dropped a branch).

## 4. Design System

### 4.1 Brand colors — USE ONLY THESE

| Token         | Hex                    | Usage                                                               |
| ------------- | ---------------------- | ------------------------------------------------------------------- |
| Primary       | `#043F2E`              | Headings, dark surfaces, primary text                               |
| Accent        | `#BEE663`              | Buttons, highlights, badges                                         |
| Background    | `#EBF0EB`              | Page background                                                     |
| Card surface  | `#F7FBEA`              | Light cards, hover states                                           |
| Soft lime     | `#DEFF90`              | Progress bar tracks, subtle accents, success banners                |
| Strong lime   | `#9ADD00`              | Progress fill, hover on accent                                      |
| Dark hover    | `#065f46`              | Hover state on `#043F2E`                                            |
| Dark mid      | `#2A5A45`              | Nav bar mobile menu surface                                         |
| Subtle border | `#043F2E]/10` or `/15` | Card borders, dividers                                              |
| Muted text    | `#043F2E]/40`–`/70`    | Placeholders, secondary text                                        |
| Error         | `#9B3D2E`              | Error text, error icons, error borders on inputs                    |
| Error surface | `#F4E0D6`              | Error banners / callouts background (defined, not yet used in code) |

### 4.2 Typography

- **Lalezar** — page titles, section titles, major headings, stat values, closing lines
- **Tajawal** — everything else (body, buttons, labels, nav, forms, tables, tooltips)

```ts
import { Lalezar, Tajawal } from "next/font/google";

const lalezar = Lalezar({ subsets: ["arabic"], weight: "400" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"] });
```

Always use `subsets: ["arabic"]` (never `["latin"]`) — the app is fully Arabic.

The two root layouts additionally load Geist/Geist_Mono (`["latin"]`) as CSS variables (`--font-geist-sans/mono`) from the create-next-app scaffold; components don't rely on them — each component instantiates its own Lalezar/Tajawal fonts.

### 4.3 Spacing & corners

- Generous whitespace: `p-5 md:p-7` on cards, `gap-4`/`gap-6` between sections
- Soft rounded corners: `rounded-2xl` (small cards), `rounded-3xl` (large cards), `rounded-xl` (tooltips/inputs)
- Subtle shadows: `shadow-sm` for cards, `shadow-lg` for tooltips/popovers
- No glassmorphism, no flashy gradients, no gaming aesthetics

### 4.4 Visual tone

- **Islamic Elegant** · **Modern** · **Minimal** · **Calm** · **Premium** · **Trustworthy** · **Community-oriented**
- Never use emoji as UI icons — use `lucide-react`

### 4.5 RTL rules

- Set `dir="rtl"` on the root container of any Arabic page/component
- Use logical properties where it matters: `text-start`/`text-end`, `ms-*`/`me-*`
- `lucide-react` chevron icons need to be swapped for RTL: `ChevronRight` for "next", `ChevronLeft` for "prev" in Arabic context
- **In a `dir="rtl"` flex row, JSX/DOM order runs right-to-left**: the *first* child renders rightmost, the *last* child renders leftmost. This is the opposite of LTR intuition and easy to get backwards — if a design calls for something to always be "the leftmost tab/button," make it the last element in JSX, not the first.
- `dir="auto"` on a plain text-entry input (name, email, referrer) is fine — it lets mixed Arabic/English content align itself. **Don't use it on an input that sits next to a fixed-position icon** (e.g. a search box with an absolutely-positioned `<Search>` icon): typing a query that starts with a Latin character (a username) flips the whole input to LTR mid-typing, pulling the text away from the icon. Leave `dir` unset there and let it inherit the ancestor's `dir="rtl"` instead — compare the (correct) points-table search box in `ControlPanelClient.tsx` against the search box in `MembersTable.tsx` for the same input styled two ways.
- A value that's inherently LTR (phone numbers, in particular) needs an explicit `dir="ltr"` wherever it's displayed inside RTL context, or the leading `+`/digits render in the wrong order. Pair it with `text-end` so it still aligns to the same edge as the rest of the row.
- Error/tooltip text rendered in an LTR page context must explicitly set `dir="rtl"` on the container

### 4.6 Current state vs. Standard (legacy debt — migrate when touching these files)

The standards above are the target. Parts of the existing codebase predate them:

- **Font subsets** — `Auth/*` components correctly use `["arabic"]`, but `NavBar.tsx`, `NavBarMobileMenu.tsx`, `ControlPanelClient.tsx`, `userRow.tsx`, `PerformanceBoardClient.tsx`, and `GoalsClient.tsx` still use `["latin"]`. Switch them to `["arabic"]` when you edit them.
- **Off-palette greens in legacy code** (do not extend usage; migrate to tokens): `#EBFFBD` (Auth tabs), `#2C5234` (leaderboard heading), `#B4C197` / `#B5CF7C` (leaderboard bars), `#E6EECD` (leaderboard nav buttons), `#E6F0E9` (mobile menu text).
- **Tailwind default colors** — `PerformanceBoardClient.tsx` error/empty/skeleton states use `gray-*`, `red-50/200/800`, `blue-600/700`, and `text-red-400`. These violate the palette; restyle with the Error tokens when touched.
- **Emoji comments** — `ControlPanelClient.tsx` uses 🟢 in section comments. Not user-facing, but clean up if editing.
- **`next/image` for decoration** — `GoalsClient.tsx`, `NavBarMobileMenu.tsx`, `ControlPanelClient.tsx` use `next/image` for decorative assets, contrary to Gotcha #3. The auth page (`app/(auth)/auth/page.tsx`) shows the preferred plain `<img>` pattern.

## 5. File Structure

```
app/
  (auth)/auth/          # public auth pages (own root layout)
    layout.tsx          # <html lang="en"> (do NOT change) + auth-page SEO metadata
    page.tsx            # login + signup shell, switched by ?mode=login|signup
  (main)/               # authenticated routes (own root layout)
    layout.tsx          # <html lang="en"> (do NOT change) + NavBar + base SEO metadata
                        # (title template "%s | مقرأة النيل", description, keywords, OpenGraph)
    page.tsx            # home (leaderboard + goal); metadata: noindex
    about/
      page.tsx          # about page
    control-board/
      page.tsx          # admin panel; page guard + metadata: noindex
    goals/
      page.tsx          # monthly goals page
    profile/
      page.tsx          # own profile (redirects to /profile/<handle>)
      [handle]/
        loading.tsx     # profile skeleton
        page.tsx        # public profile by username
  globals.css           # Tailwind 4 import + shadcn theme vars (mostly unused)
  favicon.ico
  robots.ts             # allow all crawlers, disallow /control-board

components/
  About/                # AboutContent.tsx
  Auth/                 # Auth.tsx (login/signup tab switch), LoginForm.tsx, SignUpForm.tsx, InfoTooltip.tsx
                        # (both forms: react-hook-form + zod, schemas from lib/schemas.ts)
  Control-Board/        # ControlPanelClient.tsx — 4 tabs: جدول النقاط / المجموعات / الأعضاء / قيد التفعيل
                        # (order matters in this RTL layout — see §4.5), month/week nav,
                        # module-level category cache; userRow.tsx; MembersTable.tsx (search + filter
                        # + sortable-by-API table, admin-only)
  Goals/                # GoalsPageClient.tsx
  Home/                 # DashboardContainer.tsx (client orchestrator: Hijri month state + data fetching),
                        # PerformanceBoardClient.tsx (bar chart + month nav), GoalsClient.tsx (goal card)
  NavBar/               # NavBar.tsx (server component, role-aware links + profile-completion banner),
                        # NavBarMobileMenu.tsx, ProfileCompletionNag.tsx (nag modal, see §1 Community Profile),
                        # LogoutButton.tsx, NavLinks.tsx, navLinkItems.ts
  Profile/              # EditOwnProfile.tsx, PersonalInfoSection.tsx (community profile form/summary,
                        # see §1), ProfileActivityList.tsx, ProfileHeader.tsx,
                        # ProfileMetaInfo.tsx, ProfileRoleTabs.tsx, QuietMembersCard.tsx,
                        # RoleBadge.tsx, SectionHeading.tsx, StatTile.tsx,
                        # views/StudentProfileView.tsx, views/SupervisorProfileView.tsx
  ui/                   # PageHero.tsx, progress.tsx (Radix wrapper), spinner.tsx, field-error.tsx
                        # (shared RHF error display, see §6.6)

actions/
  auth-actions.ts       # login, signup, logout, checkTokenValidity (auto-refreshes access token internally)
  categories.ts         # getCategories (shared category cache helper)
  ControlBoard.ts       # getUsers, getAllMembers (walks full pagination, admin-only, ?ordering=
                        # first_name,last_name — sort server-side, never client-side), getPoints,
                        # getCategories, getUserActivities, addUserActivity, updateUserActivity,
                        # deleteUserActivity, updateUserSupervisor, updateUserActiveStatus
  PerformanceBoard.ts   # getLeaderboardData, getUserDetails
  goal.ts               # getGoalOfTheMonth
  profile.ts            # getUserByUsername, getUserProfile, getUserPointsForMonth, getCirclePeers,
                        # getStudentRank, getQuietMembers, getSupervisedStudents, updateUser (generic
                        # field name/value payload — also used for the community profile fields, see §6.6),
                        # getStudentActivities + per-activity update/move/delete, getProfileCategories

lib/
  utils.ts              # cn, getHijriMonth, toArabicDigits, getHijriMonthDays, formatDate (currently unused), WeekRange
  user.ts               # Login (named export), createUser (default export), getUserRole
  schemas.ts            # zod schemas for every form (login, signup, edit-profile, community profile) —
                        # the one place validation rules live; forms just wire zodResolver to these
  profile-fields.ts     # ProfileFields type + the *_OPTIONS value/label arrays for every choice field
                        # (mirrors backend TextChoices — keep them in sync by hand, there's no codegen)
  profile-types.ts      # RoleType/GroupName, GROUPS map (label/icon/description per role+team),
                        # getGroupLabel/getGroupIcon/getRoles/getTeams, getVisibility (profile field
                        # visibility rules), UserProfile (extends ProfileFields)
  auth.ts               # destroySession — dead code, never imported (see Gotcha #11)
  week-helpers.check.mts # Week-range helper tests (node --test)

public/
  abstract.png          # desktop decorative background (auth page)
  abstract mob.svg      # mobile decorative background (auth page)
  menu.png              # mobile nav trigger icon
  ArrowLeft.png         # control-board week navigation
  Arrowright.png        # control-board week navigation
  Mask.png / Mask2.png  # control-board decorations
  logo.jpeg             # brand logo
  opengraph-image.png   # static OG image (1200×630), referenced from both root layouts

# Config files
next.config.ts          # output: "standalone" (Docker deployment)
components.json         # shadcn config
tsconfig.json           # strict, path alias @/* → ./*
mise.toml / mise.local.toml / mise.lock  # toolchain pinning
Dockerfile / .dockerignore
package.json / pnpm-lock.yaml / pnpm-workspace.yaml
postcss.config.mjs
eslint.config.mjs / .oxlintrc.json
.oxfmtrc.json
.pre-commit-config.yaml
.github/workflows/     # publish.yml, release.yml
.releaserc.yml
README.md
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

### 6.5 Form input — react-hook-form + zod (canonical, every form)

Every form in the app is `react-hook-form` bound to a `zod` schema from `lib/schemas.ts`, submitted with `handleSubmit`, errors read off `formState.errors` and rendered with the shared `<FieldError />` (`components/ui/field-error.tsx`). Don't hand-roll validation, manual `useState` error objects, or `useActionState` for a new form — add a schema to `lib/schemas.ts` and follow this shape:

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
  resolver: zodResolver(someSchema),
  defaultValues: { /* ... */ },
});

const onSubmit = handleSubmit(async (values) => {
  const res = await someServerAction(values);
  // ...
});

<form onSubmit={onSubmit} noValidate>
  <input {...register("fieldName")} className={inputClass(!!errors.fieldName)} />
  <FieldError message={errors.fieldName?.message} />
</form>
```

`noValidate` is required — otherwise the browser's native validation UI (unstyled, LTR, untranslated) fires before zod gets a chance to. A field that needs a non-`<input>` control (the phone number's country-code picker, a `<select>`) still goes through the same `register`/`Controller`/`errors` wiring — see `PersonalInfoForm` in `PersonalInfoSection.tsx` for a `Controller`-backed example (`PhoneInputField` from `react-phone-number-input/react-hook-form`).

The input markup itself is unchanged from before the RHF migration — LTR page context, `items-end` for right-alignment:

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
      {...register("fieldName")}
    />
  </div>
</div>
```

For RTL form contexts, swap to `items-start` + `placeholder:text-start` to keep right-alignment. See §4.5 for when `dir="auto"` is (and isn't) the right call.

### 6.6 Form error styling

Form errors use the **Error** + **Error surface** tokens (`#9B3D2E` and `#F4E0D6`). Prefer the shared `<FieldError message={errors.fieldName?.message} />` over hand-writing this markup — it already renders exactly this:

```tsx
<p role="alert" className={`${tajawal.className} flex items-center gap-1.5 text-xs text-[#9B3D2E] font-medium`}>
  <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
  <span>{message}</span>
</p>
```

**Invalid input border** — the input class flips to `border-[#9B3D2E]` and the focus state also flips to `focus:border-[#9B3D2E]` so the border stays red while focused:

```tsx
hasError
  ? "border-[#9B3D2E] focus:border-[#9B3D2E]"
  : "border-[#043F2E]/30 focus:border-[#043F2E]",
```

**Form-level alert banner** (e.g. for `errors.general`):

```tsx
{
  state.errors.general && (
    <div
      dir="rtl"
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-[#F4E0D6] border border-[#9B3D2E]/30 p-3 text-sm text-[#9B3D2E]"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.2} />
      <span>{state.errors.general}</span>
    </div>
  );
}
```

**Success banner** (no new color needed — use existing `Soft lime`):

```tsx
{
  state.success && (
    <div
      dir="rtl"
      role="status"
      className="flex items-center gap-2 rounded-xl bg-[#DEFF90] border border-[#9ADD00]/40 p-3 text-sm text-[#043F2E] font-bold"
    >
      <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
      <span>تم الحفظ بنجاح.</span>
    </div>
  );
}
```

**Extracting a DRF error message generically** — a server action that PATCHes a growing object (like `updateUser`, which now covers ~20 fields across the profile + community-profile forms) shouldn't enumerate every possible field name to find the error. DRF keys field errors by field name and puts permission/object-level errors in `detail`; take whichever one is actually present instead of naming them all:

```ts
const errData = JSON.parse(text);
const firstFieldError = Object.values(errData ?? {}).find(
  (v): v is string[] => Array.isArray(v) && typeof v[0] === "string",
)?.[0];
errorMsg = errData?.detail || firstFieldError || errorMsg;
```

### 6.7 Server action (auth-gated fetcher)

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

Backend endpoints currently in use: `auth/` (login), `auth/refresh/`, `api/v1/users/`, `api/v1/users/me`, `api/v1/users/{id}/`, `api/v1/users/points/`, `api/v1/users/points/categories/`, `api/v1/users/{id}/activities/` (+ `POST/DELETE` on activities).

Note: `DashboardContainer` and `ControlPanelClient` are **client components that call these server actions directly** from event handlers/effects — that is the established data-flow pattern in this codebase (no route handlers, no SWR).

### 6.8 Hijri date handling

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

### 6.9 API response shape (DRF pagination)

Most endpoints return paginated lists:

```ts
{ count: number, next: string | null, previous: string | null, results: T[] }
```

Always read `.results`, never the raw response.

### 6.10 Page guard

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

### 6.11 Render conditions for data-driven components

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

### 6.12 Responsive layout

- Mobile-first, single column
- `sm:` (640px+) — tablet, 2 columns
- `lg:` (1024px+) — desktop, 3+ columns
- `max-sm:` — mobile-only override
- Use `flex` + `items-start` (not `stretch`) when children have different heights to prevent unwanted stretching (e.g., the goal card next to the leaderboard)

### 6.13 SEO metadata

- `app/(main)/layout.tsx` owns the base metadata: `title.template` is `"%s | مقرأة النيل"`, plus description, keywords, and OpenGraph (`locale: "ar_EG"`, `siteName: "مقرأة النيل"`).
- `app/(auth)/auth/layout.tsx` is a **separate root layout** — it does NOT inherit the template, so it sets its own full title/description. `/auth` is the only public, crawlable page; keep its metadata descriptive of the platform and cause.
- Every page exports its own `metadata` with at least a `title`. Authenticated/admin pages must keep `robots: { index: false, follow: false }` (see `/` and `/control-board`).
- `app/robots.ts` allows all crawlers and disallows `/control-board`.
- Both root layouts set `metadataBase` to `https://nile-quran-community.com` so the `og:image` (and any future static assets) resolve to absolute URLs. `NEXT_PUBLIC_SITE_URL` overrides this for local/preview builds.
- OG image lives at `public/opengraph-image.png` (1200×630, branded) and is referenced from both root layouts' `openGraph.images` (URL + width + height + alt). It serves as the fallback for all routes (every layout declares it). `metadataBase` resolves the URL to an absolute `https://nile-quran-community.com/...`.

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم", // renders as "لوحة التحكم | مقرأة النيل" via the template
  description: "...",
  robots: { index: false, follow: false }, // for auth-gated pages
};
```

## 7. Common Gotchas

1. **Font subsets** — always `subsets: ["arabic"]` for Lalezar and Tajawal. `["latin"]` will render Arabic as fallback fonts. (Several legacy components still violate this — see §4.6.)

2. **Tab order in RTL** — adding `dir="rtl"` to a form makes Tab move right-to-left, which is correct for Arabic. But it flips the visual alignment of `items-end`/`placeholder:text-end`. If you only want RTL tab order, accept the visual flip and swap to `items-start`/`placeholder:text-start`.

3. **Image hydration** — `next/image` with `fill` adds browser-only `data--h-b*` attributes during hydration. For decorative images, use plain `<img>` with explicit `style` instead (as done in `app/(auth)/auth/page.tsx`). Note: `GoalsClient`, `NavBarMobileMenu`, and `ControlPanelClient` still use `next/image` for decoration — legacy debt.

4. **`<html lang>`** — both root layouts use `lang="en"` without `dir`. This is intentional for the current RTL handling pattern (using `items-end` + `placeholder:text-end` in an LTR context). **Do not change this** unless you refactor the entire form layout.

5. **`flex` stretching** — when a flex container has a short child next to a tall one, the short child stretches by default. Use `items-start` on the parent to prevent this (e.g., `DashboardContainer`).

6. **Page numbers** — always pass date filters even on endpoints that might not support them. The backend silently ignores unknown query params.

7. **`/api/v1/users/` vs `/api/v1/users/points/`** — the first returns user records, the second returns `{user, points, activities}`. Don't confuse them.

8. **Empty state for tables with < N items** — always use a fixed grid with invisible placeholders so the layout doesn't collapse. E.g., the top-3 podium always has 3 cells.

9. **No `phone_number` field** — the backend `User` schema does NOT include `phone_number`, despite the legacy interface field in `actions/PerformanceBoard.ts:16`. Don't rely on it.

10. **`lib/auth.ts` is dead code** — `destroySession()` is never imported anywhere (logout lives in `actions/auth-actions.ts`), and it even checks for a nonexistent `auth-token` cookie. Delete it or fix it, but don't build on it.

11. **`searchParams` read synchronously** — `app/(auth)/auth/page.tsx` types `searchParams` as a plain object and reads `searchParams.mode` directly. Next.js 15 makes `searchParams` a Promise; this works today only because the page is dynamic, but it will warn/fail if the page is ever prerendered. Await it (`const { mode } = await searchParams`) when touching the page.

12. **Token refresh is automatic but hidden** — `checkTokenValidity()` silently refreshes an expired access token via `auth/refresh/` using the `refresh` cookie. Don't add a second refresh mechanism; reuse this function.

13. **`react-phone-number-input`'s entry point bundles its React component, even for logic-only imports** — importing `isValidPhoneNumber` (or any other pure validation export) from `react-phone-number-input` or `react-phone-number-input/min`/`/max`/`/core` also pulls in the `<PhoneInput>` class component, because they all ship from the same file. That's fine in a client component, but `lib/schemas.ts` is also imported by `"use server"` action files, so it gets evaluated in the Server Actions module graph — a different, more restricted context than normal SSR — where the bundled class component crashes with `Super expression must either be null or a function` and takes the whole page down with it (this happened, took down `/auth` with a 500). **Import validation logic from `libphonenumber-js` directly** (the pure-JS library the component itself wraps); reserve `react-phone-number-input` imports for actual `"use client"` components.

14. **A component defaulting to "nudge the owner" behavior needs an explicit viewer-context prop** — `PersonalInfoSection`'s auto-open-into-edit-mode (and its no-cancel-button) made sense for a member looking at their own incomplete profile, but silently carried over when an admin opened someone else's — dropping them into an edit form for a stranger's data with no way out. If you build a component that changes behavior based on "is this mine," give it an explicit prop (`isOwnProfile`) rather than inferring it from data that happens to be true in the common case; default it to the owner behavior, but pass the override everywhere the component can render for someone other than the signed-in user.

## 8. Things NOT to do

- ❌ Add new brand colors beyond the approved Error tokens (no blue, no bright red, no gray)
- ❌ Use `["latin"]` font subsets for Arabic content
- ❌ Use `next/image` for purely decorative backgrounds
- ❌ Use emoji as UI icons
- ❌ Use `glassmorphism`, `backdrop-blur`, flashy gradients
- ❌ Use gaming-style animations (bouncy, springy)
- ❌ Skip type-checking (`mise run typecheck`) before finishing a task
- ❌ Add `// eslint-disable` without a comment explaining why
- ❌ Change the `<html lang>` in `app/(main)/layout.tsx` or `app/(auth)/auth/layout.tsx` without coordinating a full RTL refactor
- ❌ Remove `robots: { index: false }` from authenticated pages, or make `/control-board` crawlable in `app/robots.ts`

## 9. Quick Reference: Utility Functions

From `lib/utils.ts`:

| Function                  | Signature                      | Purpose                                          |
| ------------------------- | ------------------------------ | ------------------------------------------------ |
| `cn(...inputs)`           | `(ClassValue[]) => string`     | Merge Tailwind classes (uses `clsx` + `twMerge`) |
| `getHijriMonth(i)`        | `(number) => string`           | Get Arabic month name (0-indexed)                |
| `toArabicDigits(n)`       | `(number \| string) => string` | Convert to ٠١٢٣٤٥٦٧٨٩                            |
| `getHijriMonthDays(y, m)` | `(number, number) => number`   | Returns 29 or 30                                 |
| `formatDate(d)`           | `(Date) => string`             | ISO yyyy-mm-dd (exported but currently unused)   |

Also exported: `interface WeekRange { start: string; end: string }`.
