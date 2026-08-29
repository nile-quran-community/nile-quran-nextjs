<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/nile-quran-community/nile-quran-nextjs">
    <img src="https://avatars.githubusercontent.com/u/186422981" alt="Logo" height="150" style="border-radius: 10px">
  </a>
  <h2 align="center">Nile Quran Community</h2>
  <p align="center">
    The community platform for a Quran-centered university student community 🌙
    <p align="center">
      <a href="https://techforpalestine.org/learn-more"><img alt="StandWithPalestine" src="https://raw.githubusercontent.com/Safouene1/support-palestine-banner/master/StandWithPalestine.svg"></a>
      <img alt="GitHub issues" src="https://img.shields.io/github/issues/nile-quran-community/nile-quran-nextjs">
      <img alt="Static Badge" src="https://img.shields.io/badge/Next.js-15.5-black?logo=next.js">
      <img alt="Static Badge" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
      <img alt="Static Badge" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
      <img alt="Static Badge" src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white">
    </p>
    <a href="#getting-started">Getting Started</a>
    ·
    <a href="https://github.com/nile-quran-community/nile-quran-nextjs/issues">Report Bug</a>
    ·
    <a href="https://github.com/nile-quran-community/nile-quran-nextjs/issues">Request Feature</a>
  </p>
</div>

## About The Project ✨

This app is where that community sees itself: who followed their weekly portion, who reflected, who showed up — rendered in a calm, Arabic-first interface that three kinds of people rely on every week — the student tracking their own consistency, the recitation supervisor following up on their group, and the administrator running the whole thing.

### Key Features:

- 📖 **Quran Progress Tracking** – Memorization, recitation, and completion status against a weekly portion, always shown with context, never as a bare number.
- 🏆 **Monthly Competition & Leaderboard** – A lightweight points system that rewards consistency — memorizing, reciting, reflecting, inviting others — without turning the community into a game.
- 🕌 **Role-Aware Experience** – Students see what they've done and what's next; supervisors get actionable follow-up; admins get a full operational control board.
- 🌙 **Hijri-Native** – Weeks, months, and goals are tracked in the Hijri calendar, not the Gregorian one.
- 🕋 **Arabic-First, RTL Throughout** – Built for Arabic from the ground up, not translated after the fact.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<a id="getting-started"></a>

## Getting Started 🚀

Follow these steps to set up the project locally.

### Prerequisites 📦

- Node.js (LTS) and pnpm
- A running instance of the [Nile Quran API](https://github.com/nile-quran-community/nile-quran-django) (backend)

### Installation ⚙️

1. Clone the repo

```sh
git clone https://github.com/nile-quran-community/nile-quran-nextjs.git
```

2. Navigate to the project directory

```sh
cd nile-quran-nextjs
```

3. Install dependencies

```sh
pnpm install
```

4. Configure environment variables

```sh
BASE_URL=http://127.0.0.1:8000/          # Django API base URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000/  # used to resolve absolute OG/metadata URLs
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage 🔧

Here is how to use the project:

1. Start the development server

```sh
pnpm dev
```

2. Visit `http://localhost:3000` in your browser.

Other useful commands:

```sh
pnpm build        # production build
pnpm start        # run the production build
pnpm lint         # eslint
npx tsc --noEmit  # type check
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing 👥

Contributions are welcome! To get started:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing-feature'`)
4. Push the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>
