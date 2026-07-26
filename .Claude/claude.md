# Gimasys Intern Portal

A training & internship management portal for Gimasys Joint Stock Company. Interns follow assigned learning roadmaps, mentors/admins manage users, groups, documents, and progress, and an AI assistant (Gemini) helps with onboarding questions, intern evaluation, and daily-standup summaries.

## Tech stack

- **Frontend**: React 19 + TypeScript, built with Vite 6, styled with Tailwind CSS v4. Entry point: `index.html` → `src/main.tsx` → `src/App.tsx`.
- **Backend (this repo)**: Express server (`server.ts`) that in dev mode mounts Vite as middleware (single process, single port), and in production serves the built `dist/` static assets plus a few `/api/ai/*` routes that call the Gemini API (`@google/genai`).
- **Backend (real data)**: A separate FastAPI service (Swagger at its own `/docs`) is the system of record — auth, users, groups, documents, roadmaps, dashboards, comments. This repo's `src/services/api.ts` is the typed client for it.

## Roles

`ADMIN`, `MENTOR`, `INTERN` — see `src/types.ts` (`UserRole`).

## Key files

- `src/App.tsx` — top-level state, view routing, and the auth/session lifecycle.
- `src/services/api.ts` — REST client for the FastAPI backend (`/api/v1/...`), JWT bearer auth with auto-refresh on 401. Base URL from `VITE_API_BASE_URL` (defaults to same-origin `/api/v1`).
- `src/services/mappers.ts` — converts between the backend's snake_case shapes (`ApiUser`, `ApiDocument`, `ApiGroup`, ...) and the frontend's shapes (`AuthUser`, `DocumentResource`, `Group`, ...).
- `src/data/mockData.ts` — seed/demo data. Several views still read from here (see status below), and it also backs the offline-fallback / demo-login path.
- `server.ts` — Express app; `/api/ai/chat`, `/api/ai/evaluate`, `/api/ai/summarize-standup` call Gemini directly (needs `GEMINI_API_KEY`).

## Current integration status (be accurate about this — don't claim more than what's true)

- ✅ **Real backend, fully wired**: Auth (register/login/logout/me/change-password) in `LoginView.tsx` — "online-first" pattern: tries the real API first, falls back to local demo data only on a network error (not on a real API error like wrong password).
- ✅ **Real backend, fully wired incl. list-loading**: Users/Groups/Documents — a `useEffect` in `App.tsx` calls `usersApi.list()`/`groupsApi.list()` (MENTOR/ADMIN only) and `documentsApi.list()` (any authenticated role) on login, replacing mock state with server data; mutations (create/remove/lock/unlock) already called the real API too. Known gap: `GET /users` doesn't return intern profile fields (department/mentor/project/score/skills), so `apiUserToIntern()` in `mappers.ts` fills those with empty/zero placeholders — see `docs/backend-requirements.md` §1.
- ⚠️ **Client ready, not called anywhere yet**: `roadmapsApi`, `modulesApi`, `assignmentsApi`, `learningApi`, `dashboardApi`, `commentsApi`, `tagsApi` all exist fully in `api.ts` but no component calls them yet. Reason: `RoadmapView`/`SkilljarCoursesView`/`DashboardView` are built around a mock data model (`TrainingModule`, `CourseComment`) that doesn't match the backend's real shape (`Roadmap → Module → Lesson`, `ApiComment` keyed by `module_document_id`) — wiring this in means rebuilding UI, not just adding a fetch call. See `docs/backend-requirements.md` for the backend-side asks needed before that rebuild.
- ❌ **No backend support at all**: Projects, Tasks, Daily Reports have no corresponding endpoints in the FastAPI Swagger spec. These stay local-only (localStorage) unless/until the backend adds them (proposed endpoints in `docs/backend-requirements.md` §2-4) — don't imply they're persisted server-side.

## Conventions

- Views live in `src/components/*View.tsx`, dialogs in `src/components/*Modal.tsx`.
- Vietnamese comments in `api.ts`/`App.tsx` reference "đặc tả" (the API spec) — keep new endpoint integrations consistent with that naming/shape.
- `tsc --noEmit` (`npm run lint`) is the type-check gate; there's no separate test suite currently.
