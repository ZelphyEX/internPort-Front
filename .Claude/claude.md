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
- ✅ **Real backend, fully wired incl. list-loading**: Users/Groups/Documents — a `useEffect` in `App.tsx` calls `usersApi.list()`/`groupsApi.list()` (MENTOR/ADMIN only) and `documentsApi.list()` (any authenticated role) on login, replacing mock state with server data; mutations (create/remove/lock/unlock) already called the real API too. `GET /users` now returns full intern profile fields (department/mentor/score/phone/...), mapped via `apiUserToIntern()` in `mappers.ts` (note the department string mismatch: backend uses `"Salesforce/ERP"`, FE uses `"Salesforce / ERP"` — mapped both ways via `API_DEPARTMENT_TO_FE`/`FE_DEPARTMENT_TO_API`).
- ✅ **Real backend, fully wired**: Projects/Tasks/Daily Reports — `App.tsx` loads lists and wires every mutation (add/update/delete task, add/remove project member, approve/request-revision report) through `projectsApi`/`tasksApi`/`dailyReportsApi`.
- ✅ **Real backend, fully wired**: `RoadmapView.tsx` (tab "Lộ trình Đào tạo & Skills") was fully rewritten to match the backend's actual model (`Roadmap → Module → Lesson`, no third nesting level — the old mock's `CourseMajorTask → CourseSection` checklist concept was dropped, per explicit product decision, since the backend has no equivalent). Covers both roles: INTERN views assigned roadmaps and toggles lesson completion (`learningApi`); MENTOR/ADMIN create/edit roadmaps, modules, assign existing documents as lessons, assign roadmaps to interns/groups (`roadmapsApi`, `modulesApi`, `moduleDocumentsApi`). Comments (with code snippet + resolve) use `commentsApi` directly, keyed by `module_document_id`.
- ⚠️ **Not yet migrated (frontend-only work, backend is ready)**:
  - `DashboardView.tsx` still computes all stats client-side from `interns`/`projects`/`tasks`/`reports` — doesn't call `dashboardApi.me()`/`overview()` yet, even though both are fully wired in `api.ts` and schema-verified.
  - `SkilljarCoursesView.tsx` (tab "Khóa học Anthropic Skilljar") is untouched — still runs entirely on the old `TrainingModule`/`CourseComment` mock model in `App.tsx`'s `modules` state + `gimasys_modules` localStorage key. It overlaps conceptually with the now-real `RoadmapView` tab; consider merging or migrating in a future pass.
  - `Intern.roadmapProgress` (a single scalar on the Intern profile) has no real backend source anymore — a real intern can have multiple roadmap assignments, each with its own `progress_percent` (`ApiAssignedRoadmap`). `apiUserToIntern()` always sets this to `0`.

## Conventions

- Views live in `src/components/*View.tsx`, dialogs in `src/components/*Modal.tsx`.
- Vietnamese comments in `api.ts`/`App.tsx` reference "đặc tả" (the API spec) — keep new endpoint integrations consistent with that naming/shape.
- `tsc --noEmit` (`npm run lint`) is the type-check gate; there's no separate test suite currently.
