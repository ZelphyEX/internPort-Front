# Yêu cầu bổ sung/điều chỉnh API Backend — Gimasys Intern Portal

> **Cập nhật**: Backend đã triển khai đầy đủ tất cả các mục dưới đây (mục 1-8). Tài liệu này giữ lại làm lịch sử/tham chiếu — mỗi mục đã đánh dấu ✅ **Đã triển khai** kèm ghi chú xác minh thực tế. Chỉ còn 1 điểm mở ở mục 5 (xem ghi chú cuối mục).

Tài liệu gốc gửi cho team backend (FastAPI, Swagger tại `/docs`), tổng hợp từ việc rà soát Frontend (React) để nối API thật.

**Đã nối tốt (Frontend)**: `auth/*`, `users/*`, `groups/*`, `documents/*`, `tags/*`, `roadmaps/modules/assignments/learning/dashboard/comments/*`, `projects/*`, `tasks/*`, `daily-reports/*` — toàn bộ đã có component/hàm gọi API thật trong `src/App.tsx`/`src/components/RoadmapView.tsx`.

---

## 1. `Users` — field hồ sơ Intern — ✅ Đã triển khai

`GET /users` (schema `UserListItem`) và `GET /users/{id}` (schema `UserOut`) giờ trả đủ: `department, mentor_id, mentor_name, mentor_email, phone, start_date, end_date, university, major, bio, github_url, score, attendance_rate`, cùng endpoint `PATCH /users/{id}/profile` để sửa các field này (quyền MENTOR).

Xác minh: đọc trực tiếp `openapi.json`, khớp 100% với đề xuất ban đầu. Đã cập nhật `ApiUser`, `usersApi.updateProfile`, mapper `apiUserToIntern` trong Frontend.

Lưu ý nhỏ: `department` backend dùng `"Salesforce/ERP"` (không khoảng trắng), FE dùng `"Salesforce / ERP"` — Frontend đã tự map 2 chiều (`API_DEPARTMENT_TO_FE`/`FE_DEPARTMENT_TO_API` trong `mappers.ts`), backend không cần đổi gì thêm.

---

## 2. `Projects` — ✅ Đã triển khai

Đầy đủ `GET/POST /projects`, `GET/PATCH/DELETE /projects/{id}`, `POST/DELETE /projects/{id}/members[/{user_id}]`, đúng field đề xuất. Xác minh: `GET /projects`, tạo/xoá thành viên đã test qua Frontend, response khớp `ProjectOut`/`ProjectDetailOut`.

---

## 3. `Tasks` — ✅ Đã triển khai

Đầy đủ `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/{id}`, đúng field/enum đề xuất (`TaskStatus`, `TaskPriority`). Xác minh qua Frontend.

---

## 4. `Daily Reports` — ✅ Đã triển khai

Đầy đủ `GET/POST /daily-reports`, `GET/PATCH /daily-reports/{id}`, `PATCH /daily-reports/{id}/review`. **Đã test thật**: tạo 1 báo cáo qua `POST /daily-reports` với tài khoản INTERN thật, đọc lại đúng dữ liệu.

---

## 5. `Roadmap`/`Module` — ✅ Đã triển khai (Module), Section vẫn chỉ ở FE

Đã thêm đủ field cho `Module`: `track`, `week_number`, `duration_text`, `key_skills: string[]` — xác minh qua `ModuleCreate`/`ModuleOut` trong `openapi.json`.

**Quyết định cuối cùng cho phần "major task -> section"**: Frontend đã chọn hướng **bỏ cấp Section con**, xây lại `RoadmapView.tsx` hoàn toàn theo đúng mô hình 2 cấp của backend (`Roadmap → Module → Lesson`, mỗi Lesson là 1 Document được gán vào Module qua `POST /modules/{id}/documents`, chỉ có 1 trạng thái hoàn thành `completed: boolean`, không có checklist con). Không cần backend thay đổi gì thêm cho mục này — vấn đề coi như đã đóng, không phải chờ họp riêng nữa.

---

## 6. `Comments` — ✅ Đã triển khai

`ApiComment` giờ có `code_snippet`, `is_resolved`, kèm endpoint riêng `PATCH /comments/{id}/resolve`. Xác minh qua `CommentOut`/`CommentCreate` trong `openapi.json`; đã wire vào `RoadmapView.tsx` (component `CommentThread`).

---

## 7. `Dashboard` — ✅ Đã triển khai

`GET /dashboard/me` có thêm `task_completion_percent`, `pending_reports_count`; `GET /dashboard/overview` có thêm `avg_score`, `completed_tasks_this_week`, `pending_reviews_count`. Đã cập nhật type `ApiDashboardMe`/`ApiDashboardOverview` phía Frontend.

**Còn một việc phía Frontend** (không phải backend): `DashboardView.tsx` hiện vẫn tự tính toán từ `interns`/`projects`/`tasks`/`reports` cục bộ, **chưa gọi `dashboardApi.me()`/`overview()`** — đây là việc còn lại của Frontend, không cần backend làm gì thêm.

---

## 8. Sửa nhanh — ✅ Đã triển khai

- `ApiDocument.description`: đã sửa schema thành nullable đúng (`anyOf: [string, null]`).
- Giới hạn `size <= 100`: đã ghi rõ trong `description` của param `size` trên mọi endpoint list (`"Items per page, 1..100 (default 20). A value above 100 is rejected with 422."`).

---

## Việc còn lại (chỉ phía Frontend, không cần backend)

1. `DashboardView.tsx` chưa gọi `dashboardApi.me()`/`overview()` (mục 7).
2. `SkilljarCoursesView.tsx` (tab "Khóa học Anthropic Skilljar") **vẫn đang dùng dữ liệu mock/localStorage cũ**, chưa được rework sang API thật — chỉ có tab "Lộ trình Đào tạo & Skills" (`RoadmapView.tsx`) đã nối thật. Hai tab này trùng khái niệm; cân nhắc hợp nhất hoặc rework nốt Skilljar trong một đợt sau.
3. `Intern.roadmapProgress` (1 số duy nhất trên hồ sơ Intern) không còn khớp với mô hình thật (1 intern có thể có nhiều lộ trình, mỗi lộ trình 1 % tiến độ riêng qua `ApiAssignedRoadmap.progress_percent`) — cần quyết định UI hiển thị lại chỗ này nếu muốn chính xác.
