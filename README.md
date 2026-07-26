# Gimasys Intern Portal

Cổng thông tin Đào tạo & Quản lý Thực tập sinh của Gimasys. Intern theo dõi lộ trình học được giao, Mentor/Admin quản lý user/nhóm/tài liệu/tiến độ, và một trợ lý AI (Gemini) hỗ trợ hỏi đáp onboarding, đánh giá thực tập sinh, tổng hợp báo cáo standup hằng ngày.

## Kiến trúc

- **Frontend**: React 19 + TypeScript, build bằng Vite 6, giao diện Tailwind CSS v4. Entry point: `index.html` → `src/main.tsx` → `src/App.tsx`.
- **Server (repo này)**: Express (`server.ts`) — dev mode gắn Vite làm middleware (một process, một port); production phục vụ `dist/` tĩnh, cộng thêm các route `/api/ai/*` gọi Gemini API.
- **Backend dữ liệu thật**: Một service FastAPI riêng (có Swagger `/docs` riêng) là nguồn dữ liệu chính — auth, users, groups, documents, roadmaps, dashboard, comments. `src/services/api.ts` là client TypeScript gọi service này.

## Chạy local

**Yêu cầu:** Node.js 20+.

```bash
npm install
```

Tạo file `.env.local` ở thư mục gốc:

```
GEMINI_API_KEY=              # khoá Gemini API — cần để dùng AI Assistant/Evaluator/Standup Summary
VITE_API_BASE_URL=           # base URL backend FastAPI thật, vd: https://your-backend/api/v1
```

Chạy dev server (Express + Vite, một port duy nhất):

```bash
npm run dev
```

Mặc định chạy tại `http://localhost:3000`.

## Scripts

| Script | Mục đích |
|---|---|
| `npm run dev` | Chạy dev server (`tsx server.ts`, Vite middleware mode + HMR) |
| `npm run build` | Build client (`vite build` → `dist/`) + bundle server (`esbuild` → `dist/server.cjs`) |
| `npm start` | Chạy bản production đã build (`node dist/server.cjs`) |
| `npm run preview` | Xem thử bản build bằng Vite preview |
| `npm run lint` | Type-check (`tsc --noEmit`) — chưa có test suite riêng |
| `npm run clean` | Xoá `dist/` và `server.cjs` |

## Deploy lên GCP Cloud Run

`Dockerfile` build 2 giai đoạn (builder → runner, Node 20 alpine), `.github/workflows/deploy.yml` tự build/push Docker image lên Artifact Registry và deploy lên Cloud Run mỗi khi push vào `main`, dùng Workload Identity Federation (không cần key JSON).

Cần cấu hình trong **Settings → Secrets and variables → Actions** của repo GitHub:

**Variables:**
| Tên | Ví dụ | Ghi chú |
|---|---|---|
| `GCP_PROJECT_ID` | `my-project-123456` | |
| `GCP_REGION` | `asia-southeast1` | |
| `AR_REPOSITORY` | `gimasys-intern-portal` | Artifact Registry repo (phải tạo trước) |
| `CLOUD_RUN_SERVICE` | `gimasys-intern-portal` | Tên Cloud Run service |
| `WIF_SERVICE_ACCOUNT` | `gh-deployer@my-project.iam.gserviceaccount.com` | Service account deploy |
| `VITE_API_BASE_URL` | `https://your-backend/api/v1` | Không bí mật, nhưng được "nướng" vào bundle client lúc **build**, nên truyền qua Docker build-arg chứ không phải env runtime |

**Secrets:**
| Tên | Ghi chú |
|---|---|
| `WIF_PROVIDER` | `projects/<NUMBER>/locations/global/workloadIdentityPools/<POOL>/providers/<PROVIDER>` |
| `GEMINI_API_KEY` | Được forward vào Cloud Run runtime để `/api/ai/*` hoạt động ở production |

Setup GCP một lần (chạy `gcloud` local), tóm tắt trong comment đầu file `deploy.yml`:
1. Bật API: `run.googleapis.com`, `artifactregistry.googleapis.com`, `iamcredentials.googleapis.com`.
2. Tạo Artifact Registry docker repo (`AR_REPOSITORY`) trong `GCP_REGION`.
3. Tạo Workload Identity Pool + provider gắn với repo GitHub này.
4. Tạo service account deploy (`WIF_SERVICE_ACCOUNT`) với role `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser`.
5. Cho phép WIF principal impersonate service account đó.

## Tình trạng kết nối API/DB thật (đọc kỹ trước khi coi đây là bản hoàn chỉnh)

Repo có sẵn client API đầy đủ (`src/services/api.ts`, theo đúng đặc tả Swagger của backend FastAPI), nhưng **chưa phải mọi màn hình đều đã gọi qua client này**:

- ✅ **Đã nối thật, hoạt động online-first**: Đăng nhập / Đăng ký / Đăng xuất / Đổi mật khẩu (`LoginView.tsx`) — thử gọi backend thật trước, chỉ rơi về tài khoản demo cục bộ khi lỗi mạng (không fallback khi backend trả lỗi thật như sai mật khẩu).
- ✅ **Đã nối thật, kể cả tải danh sách**: Users/Groups/Documents — `App.tsx` có `useEffect` gọi `usersApi.list()`/`groupsApi.list()` (MENTOR/ADMIN) và `documentsApi.list()` (mọi role) ngay khi đăng nhập thật, thay hẳn dữ liệu mock bằng dữ liệu server; `Intern` giờ có đủ field hồ sơ thật (department/mentor/score/phone/...) qua `GET /users` + `PATCH /users/{id}/profile`.
- ✅ **Đã nối thật**: Projects/Tasks/Daily Reports — `App.tsx` tải danh sách + toàn bộ thao tác (thêm/sửa/xoá task, thêm/gỡ thành viên dự án, duyệt báo cáo...) đều gọi `projectsApi`/`tasksApi`/`dailyReportsApi` thật.
- ✅ **Đã nối thật**: Lộ trình đào tạo (`RoadmapView.tsx`, tab "Lộ trình Đào tạo & Skills") — viết lại hoàn toàn theo đúng mô hình backend (`Roadmap → Module → Lesson`), gồm cả 2 vai trò: INTERN xem lộ trình được giao + đánh dấu hoàn thành bài học; MENTOR/ADMIN tạo/sửa/xoá lộ trình, chặng học, gán tài liệu làm bài học, gán lộ trình cho intern/nhóm. Bình luận theo bài học (kèm code snippet, đánh dấu đã giải đáp) dùng `commentsApi` thật.
- ⚠️ **Còn lại, chỉ là việc Frontend** (backend đã sẵn sàng, không cần chờ): `DashboardView.tsx` chưa gọi `dashboardApi.me()`/`overview()` (vẫn tự tính từ dữ liệu cục bộ); `SkilljarCoursesView.tsx` (tab "Khóa học Anthropic Skilljar") vẫn dùng mock/localStorage cũ, trùng khái niệm với tab Roadmap thật ở trên — chưa rework.

Chi tiết lịch sử/đề xuất từng mục xem [`docs/backend-requirements.md`](docs/backend-requirements.md) (đã đánh dấu hoàn thành).

## Cấu trúc thư mục

```
├── index.html               # Vite entry point
├── server.ts                 # Express server (dev: Vite middleware, prod: static + /api/ai/*)
├── src/
│   ├── App.tsx                # State + routing top-level
│   ├── main.tsx
│   ├── types.ts
│   ├── components/             # *View.tsx = trang, *Modal.tsx = dialog
│   ├── context/ThemeContext.tsx
│   ├── data/mockData.ts        # Dữ liệu mẫu / fallback offline
│   └── services/
│       ├── api.ts               # Client REST cho backend FastAPI
│       └── mappers.ts           # Chuyển đổi shape API <-> shape frontend
├── Dockerfile
├── .github/workflows/deploy.yml # CI/CD: build + push + deploy Cloud Run
└── .dockerignore
```
