// ============================================================================
// API Client — Gimasys Intern Portal
// Bám sát "ĐẶC TẢ API — INTERN PORTAL". Base URL: /api/v1, JWT Bearer auth.
// FE dùng file này như "hợp đồng" gọi API. Backend sinh Swagger tại /docs.
// ============================================================================

// ---- Cấu hình chung -------------------------------------------------------

/**
 * Base URL của API. Ưu tiên biến môi trường VITE_API_BASE_URL (đặt trong .env),
 * mặc định là "/api/v1" (đi qua proxy/same-origin khi deploy chung server).
 *
 * Lưu ý: PHẢI viết `import.meta.env.VITE_API_BASE_URL` liền mạch (không optional-chain
 * lên `import.meta`/`env`) vì Vite/esbuild chỉ tĩnh thay thế đúng cú pháp này lúc build.
 * Viết `(import.meta as any)?.env?.VITE_API_BASE_URL` sẽ KHÔNG được inline — bundle
 * production sẽ luôn rơi về fallback "/api/v1" dù đã set biến môi trường lúc build.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';

// Khóa lưu token trong localStorage
const ACCESS_TOKEN_KEY = 'gimasys_access_token';
const REFRESH_TOKEN_KEY = 'gimasys_refresh_token';
/** Hạn tuyệt đối của phiên (ms epoch) — server quyết định, xem TokenResponse. */
const SESSION_EXPIRES_AT_KEY = 'gimasys_session_expires_at';

// ---- Quản lý token --------------------------------------------------------

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken?: string, sessionExpiresAt?: string): void {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (sessionExpiresAt) {
      const ms = Date.parse(sessionExpiresAt);
      if (!Number.isNaN(ms)) localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(ms));
    }
  },
  setAccess(accessToken: string): void {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  /** Mốc hết hạn phiên (ms epoch), null nếu server không gửi (backend cũ). */
  getSessionExpiresAt(): number | null {
    const raw = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
    if (!raw) return null;
    const ms = Number(raw);
    return Number.isFinite(ms) ? ms : null;
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

/**
 * True khi phiên đã quá hạn tuyệt đối.
 *
 * Server không gia hạn mốc này khi refresh, nên đây là "1 ngày kể từ lúc đăng
 * nhập", không phải "1 ngày kể từ lần thao tác cuối". Trả false nếu chưa biết mốc
 * (backend cũ chưa trả `session_expires_at`) — khi đó vẫn còn 401 làm lưới đỡ.
 */
export function isSessionExpired(): boolean {
  const expiresAt = tokenStore.getSessionExpiresAt();
  return expiresAt !== null && Date.now() >= expiresAt;
}

/** Thông báo dùng chung khi phiên hết hạn theo thời gian. */
export const SESSION_EXPIRED_DETAIL =
  'Phiên đăng nhập đã hết hạn (mỗi phiên chỉ kéo dài 1 ngày). Vui lòng đăng nhập lại.';

// ---- Kiểu dữ liệu chung ---------------------------------------------------

/** Response phân trang chuẩn (mục 1 - Quy ước chung). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** Lỗi API — bọc "detail" của FastAPI kèm HTTP status. */
export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// ---- Lõi request + tự refresh token khi 401 -------------------------------

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  /** Query params — tự bỏ qua giá trị undefined/null/'' */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** true = endpoint công khai, không đính kèm Authorization */
  auth?: boolean;
  /** true = gửi FormData (multipart) thay vì JSON */
  isFormData?: boolean;
  /** Cho phép tự refresh token khi gặp 401 (mặc định true) */
  allowRetry?: boolean;
}

/** Cho phép ứng dụng đăng ký callback khi phiên hết hạn (điều hướng về Login). */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

/** Lý do phiên vừa kết thúc, để màn đăng nhập giải thích thay vì đá ra im lặng. */
const SESSION_ENDED_KEY = 'gimasys_session_ended';

/** Kết thúc phiên tại chỗ: xoá token và đưa app về màn đăng nhập. */
export function endSession(reason: string = SESSION_EXPIRED_DETAIL): void {
  tokenStore.clear();
  try {
    localStorage.setItem(SESSION_ENDED_KEY, reason);
  } catch {
    /* localStorage đầy/bị chặn: mất lời nhắn thôi, vẫn phải đăng xuất */
  }
  if (onUnauthorized) onUnauthorized();
}

/** Đọc rồi XOÁ lý do phiên trước kết thúc (chỉ hiện một lần). */
export function takeSessionEndedReason(): string | null {
  const reason = localStorage.getItem(SESSION_ENDED_KEY);
  if (reason) localStorage.removeItem(SESSION_ENDED_KEY);
  return reason;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = res.statusText || 'Lỗi không xác định';
  try {
    const data = await res.json();
    if (data?.detail) {
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } else if (data?.error) {
      detail = data.error;
    }
  } catch {
    /* body không phải JSON — giữ statusText */
  }
  return new ApiError(res.status, detail);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    auth = true,
    isFormData = false,
    allowRetry = true,
  } = options;

  // Phiên hết hạn theo thời gian: kết thúc ngay tại client, không gửi request nào
  // nữa. Nếu để đi tiếp thì server trả 401, FE lại thử refresh (cũng hỏng) rồi mới
  // đăng xuất — chậm hơn và tạo ra một loạt request rác.
  if (auth && isSessionExpired()) {
    endSession();
    throw new ApiError(401, SESSION_EXPIRED_DETAIL);
  }

  const headers: Record<string, string> = {};
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormData
        ? (body as FormData)
        : JSON.stringify(body),
  });

  // Token hết hạn: thử refresh một lần rồi gọi lại
  if (res.status === 401 && auth && allowRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, { ...options, allowRetry: false });
    }
    endSession('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.');
    throw await parseError(res);
  }

  if (!res.ok) throw await parseError(res);

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // Một số endpoint trả body rỗng
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Gọi /auth/refresh để lấy access_token mới. Trả true nếu thành công. */
async function tryRefresh(): Promise<boolean> {
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) return false;
  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access_token: string };
    if (data?.access_token) {
      tokenStore.setAccess(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// Kiểu dữ liệu theo đặc tả (server-side shapes)
// ============================================================================

export type ApiRole = 'ADMIN' | 'MENTOR' | 'INTERN';
/** PENDING = Mentor mới đăng ký, đang chờ Admin duyệt (chưa đăng nhập được). */
export type ApiUserStatus = 'ACTIVE' | 'LOCKED' | 'PENDING';
/** Vai trò có thể chuyển qua lại bằng yêu cầu chuyển vai trò — không có ADMIN. */
export type ApiSwitchableRole = 'INTERN' | 'MENTOR';

/**
 * Backend trả 403 kèm detail bắt đầu bằng chuỗi này khi tài khoản Mentor chưa
 * được duyệt. Frontend dựa vào đó để chuyển sang màn "đang chờ duyệt".
 */
export const PENDING_APPROVAL_CODE = 'PENDING_APPROVAL';

/** True nếu lỗi là "tài khoản Mentor đang chờ Admin duyệt". */
export function isPendingApprovalError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 403 && err.detail.includes(PENDING_APPROVAL_CODE);
}
export type ApiDocType = 'VIDEO' | 'PDF' | 'LINK' | 'ARTICLE';

// Lưu ý: giá trị "Salesforce/ERP" (không có khoảng trắng quanh dấu "/") — khác với
// Department phía FE ("Salesforce / ERP"). Phải map qua lại bằng mappers.ts, không ép kiểu trực tiếp.
export type ApiDepartment =
  | 'Java Back-End'
  | 'React Front-End'
  | 'Cloud & DevOps'
  | 'Salesforce/ERP'
  | 'AI & Data Science';

export interface ApiUser {
  id: number;
  full_name: string;
  email: string;
  role: ApiRole;
  status?: ApiUserStatus;
  avatar_url?: string | null;
  // Hồ sơ Intern — chỉ có ý nghĩa khi role === 'INTERN', đều optional/nullable.
  // Khối hành chính (phone / university / mentor_id / start_date / end_date) đã bị
  // bỏ khỏi bảng users ở backend (migration d5c8a2e64f19).
  department?: ApiDepartment | null;
  major?: string | null;
  bio?: string | null;
  github_url?: string | null;
  score?: number | null;
  attendance_rate?: number | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: ApiUser;
  /**
   * Hạn TUYỆT ĐỐI của phiên (ISO 8601 UTC). `/auth/refresh` không đẩy mốc này ra
   * xa, nên đến lúc đó là phải đăng nhập lại dù đang dùng liên tục.
   */
  session_expires_at: string;
}

// ---- Đăng nhập bằng Google (đường vào duy nhất) ---------------------------

/** Hồ sơ Google trả về, dùng để điền sẵn form đăng ký khi chưa có tài khoản. */
export interface ApiGoogleProfile {
  email: string;
  full_name: string;
  avatar_url?: string | null;
  /**
   * Vai trò sẽ được cấp (FE không chọn được). Hiện luôn là `INTERN`: muốn lên
   * MENTOR thì gửi yêu cầu chuyển vai trò sau khi vào portal.
   */
  assigned_role: ApiRole;
  /** true = tài khoản tạo ra phải chờ Admin duyệt. Luồng hiện tại luôn false. */
  needs_admin_approval: boolean;
}

/**
 * Kết quả `POST /auth/google` (và `POST /auth/google/complete`).
 *  - `AUTHENTICATED`      -> `tokens` có giá trị, đã đăng nhập.
 *  - `NEEDS_REGISTRATION` -> chưa có tài khoản: dùng `profile` + `signup_ticket`
 *                            để hiện form nhập hồ sơ.
 */
export interface ApiGoogleAuthResult {
  status: 'AUTHENTICATED' | 'NEEDS_REGISTRATION';
  tokens?: LoginResponse | null;
  profile?: ApiGoogleProfile | null;
  signup_ticket?: string | null;
}

/**
 * Dữ liệu tạo tài khoản mới. **Chỉ cần họ tên** — email lấy từ `signup_ticket` đã
 * ký, vai trò do server quyết định (luôn INTERN). Hồ sơ chi tiết (SĐT, trường,
 * ngành, đơn vị) Mentor bổ sung sau qua `usersApi.updateProfile`.
 */
export interface GoogleSignupPayload {
  signup_ticket: string;
  full_name: string;
}

// ---- Điểm thi thử Anthropic Mock Exam -------------------------------------

/**
 * Thang điểm bài thi thử. PHẢI khớp `app/services/exam_service.py` bên backend —
 * server là nơi tính điểm chính thức, hằng số ở đây chỉ để hiển thị (thanh tiến
 * độ, màu đỗ/trượt) mà không phải chờ gọi API.
 *
 * Mọi câu tính như nhau; điểm = phần trăm câu đúng × 10. Đỗ khi đúng >= 80%.
 */
export const EXAM_SCORE_MIN = 0;
export const EXAM_SCORE_MAX = 1000;
export const EXAM_PASS_PERCENT = 80;
export const EXAM_PASSING_SCORE = (EXAM_SCORE_MAX * EXAM_PASS_PERCENT) / 100; // 800

/** Quy đổi số câu đúng sang thang 0..1000 (cùng công thức với backend). */
export function examScaledScore(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return EXAM_SCORE_MIN;
  const ratio = Math.min(1, Math.max(0, correctCount / totalQuestions));
  return Math.round(ratio * EXAM_SCORE_MAX);
}

/** Phần trăm câu đúng suy từ điểm (điểm = phần trăm × 10). */
export function examPercent(score: number): number {
  return score / 10;
}

/**
 * Đỗ hay không, tính trên SỐ CÂU chứ không trên điểm đã làm tròn — giống backend.
 * Dùng bản này ngay sau khi chấm bài; với dữ liệu đã lưu thì so `score >= 800`.
 */
export function examIsPassing(correctCount: number, totalQuestions: number): boolean {
  if (totalQuestions <= 0) return false;
  return correctCount * 100 >= totalQuestions * EXAM_PASS_PERCENT;
}

/** Một lần làm bài ở chế độ thi. */
export interface ApiExamAttempt {
  id: number;
  user_id: number;
  exam_id: string;
  exam_title: string;
  exam_code?: string | null;
  total_questions: number;
  correct_count: number;
  score: number;
  passed: boolean;
  duration_seconds?: number | null;
  created_at: string;
}

/** Kết quả tốt nhất của một người ở một đề. */
export interface ApiExamBest {
  exam_id: string;
  exam_title: string;
  exam_code?: string | null;
  best_score: number;
  passed: boolean;
  attempts: number;
  last_taken_at: string;
}

/**
 * Tổng hợp điểm của MỘT người. `avg_score` là trung bình điểm TỐT NHẤT của mỗi đề
 * (làm lại nhiều lần không kéo trung bình xuống); `null` nếu chưa thi bài nào.
 */
export interface ApiExamSummary {
  user_id: number;
  full_name?: string | null;
  email?: string | null;
  role?: ApiRole;
  avg_score?: number | null;
  best_score?: number | null;
  exams_taken: number;
  exams_passed: number;
  attempts_count: number;
  per_exam: ApiExamBest[];
}

/** Tổng hợp cho Mentor/Admin: điểm trung bình toàn bộ Thực tập sinh. */
export interface ApiExamOverview {
  avg_score?: number | null;
  interns_with_attempts: number;
  interns_total: number;
  interns: ApiExamSummary[];
}

// ---- Gán nhóm (luật thường trực) ------------------------------------------

/**
 * Kết quả thêm thành viên vào nhóm. Gán nhóm là LUẬT THƯỜNG TRỰC: vào nhóm là
 * nhận ngay mọi lộ trình + dự án nhóm đang có, kể cả khi nhóm được gán từ trước.
 */
export interface ApiAddMembersResult {
  members: ApiGroupMember[];
  added_count: number;
  skipped_existing: number;
  inherited_roadmaps: number;
  inherited_projects: number;
}

/**
 * Kết quả gỡ thành viên khỏi nhóm. `kept_*` = số lộ trình/dự án KHÔNG bị thu hồi
 * vì người đó đã có tiến độ — chúng chuyển thành gán cá nhân thay vì bị xoá.
 */
export interface ApiRemoveMemberResult {
  revoked_roadmaps: number;
  kept_roadmaps: number;
  revoked_projects: number;
  kept_projects: number;
}

// ---- Yêu cầu chuyển vai trò ----------------------------------------------

export type ApiRoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApiRoleRequest {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  from_role: ApiRole;
  to_role: ApiRole;
  status: ApiRoleRequestStatus;
  created_at: string;
  decided_at?: string | null;
  /** true = vai trò đã đổi ngay (Mentor tự hạ xuống Thực tập sinh). */
  applied: boolean;
}

export interface ApiTag {
  id: number;
  name: string;
}

export interface ApiDocument {
  id: number;
  title: string;
  description: string;
  content_url: string;
  type: ApiDocType;
  tags: string[];
  created_at: string;
}

export interface ApiGroupMember {
  id: number;
  full_name: string;
  email: string;
  role?: ApiRole;
}

export interface ApiGroup {
  id: number;
  name: string;
  cohort: string;
  description: string;
  member_count?: number;
  members?: ApiGroupMember[];
}

export interface ApiRoadmapListItem {
  id: number;
  title: string;
  description: string;
  module_count?: number;
}

/** Tài liệu đính kèm hiển thị ngay dưới một bài học. */
export interface ApiLessonAttachment {
  attachment_id: number;
  document_id: number;
  title: string;
  type: ApiDocType;
  content_url: string;
  position: number;
}

export interface ApiModuleDocument {
  module_document_id: number;
  /** null với bài học tạo tay (chỉ có tên + link), không lấy từ Thư viện. */
  document_id?: number | null;
  title: string;
  type?: ApiDocType | null;
  /** Link mở khi bấm vào tên bài học (video / bài giảng). */
  content_url?: string | null;
  position?: number;
  attachments?: ApiLessonAttachment[];
}

export interface ApiModule {
  id: number;
  title: string;
  position: number;
  description?: string;
  track?: ApiDepartment | null;
  week_number?: number | null;
  duration_text?: string | null;
  key_skills?: string[];
  /** Hạn của chặng học (YYYY-MM-DD) — dùng để hiển thị "còn N ngày". */
  start_date?: string | null;
  end_date?: string | null;
  documents?: ApiModuleDocument[];
}

export interface ApiRoadmapDetail {
  id: number;
  title: string;
  description: string;
  modules: ApiModule[];
}

export interface ApiAssignedRoadmap {
  assignment_id: number;
  roadmap_id: number;
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
}

/** GET /roadmap-assignments item — khác shape với ApiAssignedRoadmap (GET /me/roadmaps). */
export interface ApiAssignmentListItem {
  assignment_id: number;
  roadmap_id: number;
  roadmap_title: string;
  user_id: number;
  user_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  progress_percent: number;
  assigned_at: string;
}

export interface ApiLessonState {
  module_document_id: number;
  title: string;
  type?: ApiDocType | null;
  content_url?: string | null;
  completed: boolean;
  completed_at?: string | null;
  attachments?: ApiLessonAttachment[];
}

export interface ApiAssignedRoadmapDetail {
  assignment_id: number;
  roadmap_id: number;
  title: string;
  progress_percent: number;
  modules: Array<{
    id: number;
    title: string;
    position: number;
    track?: ApiDepartment | null;
    week_number?: number | null;
    duration_text?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    lessons: ApiLessonState[];
  }>;
}

export interface ApiCompleteLessonResponse {
  module_document_id: number;
  completed: boolean;
  completed_at?: string;
  progress_percent: number;
}

export interface ApiComment {
  id: number;
  user: { id: number; full_name: string; avatar_url?: string };
  content: string;
  code_snippet?: string | null;
  is_resolved?: boolean;
  created_at: string;
  parent_comment_id?: number | null;
  replies?: ApiComment[];
}

export interface ApiDashboardMe {
  total_roadmaps: number;
  completed_roadmaps: number;
  overall_progress_percent: number;
  task_completion_percent: number;
  pending_reports_count: number;
  roadmaps: Array<{ assignment_id: number; title: string; progress_percent: number }>;
}

export interface ApiDashboardOverview {
  total_interns: number;
  active_assignments: number;
  completed_assignments: number;
  avg_score: number;
  completed_tasks_this_week: number;
  pending_reviews_count: number;
  by_group: Array<{ group_id: number; name: string; avg_progress_percent: number }>;
}

// ---- Projects ---------------------------------------------------------------

export type ApiProjectStatus = 'In Planning' | 'Active' | 'Under Review' | 'Completed';

export interface ApiProject {
  id: number;
  code: string;
  title: string;
  department?: ApiDepartment | null;
  status: ApiProjectStatus;
  lead_user_id?: number | null;
  lead_name?: string | null;
  progress_percent: number;
  deadline?: string | null;
  description?: string | null;
  tags: string[];
  member_count: number;
  created_at: string;
}

export interface ApiProjectMember {
  id: number;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

export interface ApiProjectDetail extends ApiProject {
  members: ApiProjectMember[];
}

// ---- Tasks --------------------------------------------------------------------

export type ApiTaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';
export type ApiTaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ApiTask {
  id: number;
  title: string;
  project_id?: number | null;
  project_code?: string | null;
  project_title?: string | null;
  assigned_intern_id?: number | null;
  assigned_intern_name?: string | null;
  mentor_id?: number | null;
  mentor_name?: string | null;
  status: ApiTaskStatus;
  priority: ApiTaskPriority;
  due_date?: string | null;
  description?: string | null;
  pr_url?: string | null;
  mentor_feedback?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Daily Reports --------------------------------------------------------------

export type ApiDailyReportStatus = 'Pending' | 'Approved' | 'Needs Revision';

export interface ApiDailyReport {
  id: number;
  intern_id: number;
  intern_name?: string | null;
  date: string;
  completed_today: string;
  tomorrow_plan?: string | null;
  blockers?: string | null;
  hours_logged?: number | null;
  status: ApiDailyReportStatus;
  mentor_comment?: string | null;
  rating?: number | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 2. Auth & Profile
// ============================================================================

export const authApi = {
  /**
   * POST /auth/login — Đăng nhập bằng mật khẩu. **Chỉ dùng cho tài khoản ADMIN.**
   *
   * Backend trả 403 nếu tài khoản không phải ADMIN: Intern/Mentor bắt buộc đi qua
   * Google, nên đường mật khẩu không thể dùng để đi vòng qua xác thực Google.
   * Tự lưu token khi thành công.
   */
  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStore.set(data.access_token, data.refresh_token, data.session_expires_at);
    return data;
  },

  /**
   * POST /auth/google — Bước 1: đăng nhập bằng Google. Công khai.
   *
   * Đây là đường vào DUY NHẤT của người dùng (không còn form đăng ký/đăng nhập
   * bằng mật khẩu). Tự lưu token nếu tài khoản đã tồn tại; nếu chưa thì trả
   * `NEEDS_REGISTRATION` kèm `signup_ticket` để gọi tiếp `completeGoogleSignup`.
   *
   * 403 nếu email ngoài tên miền Gimasys, tài khoản bị khoá, hoặc Mentor chưa
   * được duyệt (detail chứa `PENDING_APPROVAL`).
   */
  async loginWithGoogle(payload: { credential: string }): Promise<ApiGoogleAuthResult> {
    const data = await request<ApiGoogleAuthResult>('/auth/google', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    if (data.status === 'AUTHENTICATED' && data.tokens) {
      tokenStore.set(
        data.tokens.access_token,
        data.tokens.refresh_token,
        data.tokens.session_expires_at
      );
    }
    return data;
  },

  /**
   * POST /auth/google/complete — Bước 2: tạo tài khoản (chỉ cần họ tên).
   * Vai trò do server quyết định (luôn INTERN), FE không gửi lên.
   */
  async completeGoogleSignup(payload: GoogleSignupPayload): Promise<ApiGoogleAuthResult> {
    const data = await request<ApiGoogleAuthResult>('/auth/google/complete', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    if (data.status === 'AUTHENTICATED' && data.tokens) {
      tokenStore.set(
        data.tokens.access_token,
        data.tokens.refresh_token,
        data.tokens.session_expires_at
      );
    }
    return data;
  },

  /** POST /auth/logout — Thu hồi refresh token hiện tại, xóa token cục bộ. */
  async logout(): Promise<void> {
    const refresh_token = tokenStore.getRefresh();
    try {
      if (refresh_token) {
        await request<void>('/auth/logout', { method: 'POST', body: { refresh_token } });
      }
    } finally {
      tokenStore.clear();
    }
  },

  /** GET /auth/me — Thông tin tài khoản hiện tại. */
  me() {
    return request<ApiUser>('/auth/me');
  },

  /** PATCH /auth/me — Cập nhật tên/ảnh đại diện. */
  updateProfile(payload: { full_name?: string; avatar_url?: string }) {
    return request<ApiUser>('/auth/me', { method: 'PATCH', body: payload });
  },

  deleteAccount() {
    return request<void>('/auth/me', { method: 'DELETE' });
  },

  /** POST /auth/change-password — Đổi mật khẩu. 400 nếu mật khẩu cũ sai. */
  changePassword(payload: { old_password: string; new_password: string }) {
    return request<void>('/auth/change-password', { method: 'POST', body: payload });
  },
};

// ============================================================================
// 3. Quản lý User (Mentor/Admin)
// ============================================================================

export const usersApi = {
  /** GET /users — Liệt kê/tìm kiếm/phân trang. Quyền: MENTOR. */
  list(params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: ApiRole;
    status?: ApiUserStatus;
  }) {
    return request<Paginated<ApiUser>>('/users', { query: params });
  },

  /**
   * POST /users — Tạo tài khoản. Quyền: MENTOR trở lên.
   * Luật vai trò (403 nếu vi phạm): MENTOR chỉ tạo được `INTERN`;
   * ADMIN tạo được `INTERN` hoặc `MENTOR`. Không tạo được ADMIN qua API.
   */
  create(payload: {
    full_name: string;
    email: string;
    password: string;
    role?: 'INTERN' | 'MENTOR';
  }) {
    return request<ApiUser>('/users', { method: 'POST', body: payload });
  },

  /** PATCH /users/{id}/approve — Duyệt Mentor đang chờ (PENDING -> ACTIVE). Quyền: ADMIN. */
  approve(id: number) {
    return request<ApiUser>(`/users/${id}/approve`, { method: 'PATCH' });
  },

  /** GET /users/{id} — Chi tiết user. Quyền: MENTOR. */
  get(id: number) {
    return request<ApiUser>(`/users/${id}`);
  },

  /** PATCH /users/{id}/profile — Cập nhật hồ sơ Intern (department/mentor/score...). Quyền: MENTOR. */
  updateProfile(
    id: number,
    payload: Partial<{
      department: ApiDepartment;
      major: string;
      bio: string;
      github_url: string;
      score: number;
      attendance_rate: number;
    }>
  ) {
    return request<ApiUser>(`/users/${id}/profile`, { method: 'PATCH', body: payload });
  },

  /** PATCH /users/{id}/lock — Khóa tài khoản. Quyền: MENTOR. */
  lock(id: number) {
    return request<ApiUser>(`/users/${id}/lock`, { method: 'PATCH' });
  },

  /** PATCH /users/{id}/unlock — Mở khóa. Quyền: MENTOR. */
  unlock(id: number) {
    return request<ApiUser>(`/users/${id}/unlock`, { method: 'PATCH' });
  },

  /**
   * DELETE /users/{id} — Xoá mềm. Quyền: MENTOR trở lên.
   * MENTOR chỉ xoá được INTERN; ADMIN xoá được INTERN/MENTOR; không ai xoá được ADMIN.
   */
  remove(id: number) {
    return request<void>(`/users/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// 3b. Yêu cầu chuyển vai trò (Thực tập sinh <-> Mentor)
// ============================================================================

export const roleRequestsApi = {
  /** GET /role-requests/me — Yêu cầu đang chờ duyệt của mình, `null` nếu không có. */
  me() {
    return request<ApiRoleRequest | null>('/role-requests/me');
  },

  /**
   * POST /role-requests — Gửi yêu cầu chuyển vai trò.
   *  - `MENTOR`: tạo yêu cầu **chờ Admin duyệt** (`applied: false`).
   *  - `INTERN`: là hạ quyền nên **áp dụng ngay** (`applied: true`) — sau khi gọi
   *    phải tải lại phiên (`authApi.me()`) để giao diện khớp vai trò mới.
   * 409 nếu đang có yêu cầu chờ duyệt.
   */
  create(toRole: ApiSwitchableRole) {
    return request<ApiRoleRequest>('/role-requests', {
      method: 'POST',
      body: { to_role: toRole },
    });
  },

  /** DELETE /role-requests/me — Tự rút yêu cầu khi chưa được duyệt. 404 nếu không có. */
  cancelMine() {
    return request<void>('/role-requests/me', { method: 'DELETE' });
  },

  /** GET /role-requests — Hàng đợi yêu cầu, ai gửi trước xếp trước. Quyền: ADMIN. */
  list(params?: { page?: number; size?: number; status?: ApiRoleRequestStatus }) {
    return request<Paginated<ApiRoleRequest>>('/role-requests', { query: params });
  },

  /** PATCH /role-requests/{id}/approve — Duyệt, đổi vai trò người gửi. Quyền: ADMIN. */
  approve(id: number) {
    return request<ApiRoleRequest>(`/role-requests/${id}/approve`, { method: 'PATCH' });
  },

  /** PATCH /role-requests/{id}/reject — Từ chối, vai trò giữ nguyên. Quyền: ADMIN. */
  reject(id: number) {
    return request<ApiRoleRequest>(`/role-requests/${id}/reject`, { method: 'PATCH' });
  },
};

// ============================================================================
// 3c. Điểm thi thử Anthropic Mock Exam
// ============================================================================

export const examAttemptsApi = {
  /**
   * POST /exam-attempts — Nộp kết quả một lần thi ở **chế độ thi**.
   * Không gửi `score`: server tự tính từ số câu đúng theo thang 100..1000.
   */
  submit(payload: {
    exam_id: string;
    exam_title: string;
    exam_code?: string;
    total_questions: number;
    correct_count: number;
    duration_seconds?: number;
  }) {
    return request<ApiExamAttempt>('/exam-attempts', { method: 'POST', body: payload });
  },

  /** GET /exam-attempts/me — Lịch sử làm bài của mình, mới nhất trước. */
  mine(params?: { page?: number; size?: number }) {
    return request<Paginated<ApiExamAttempt>>('/exam-attempts/me', { query: params });
  },

  /** GET /exam-attempts/me/summary — Điểm TB + điểm tốt nhất từng đề của mình. */
  mySummary() {
    return request<ApiExamSummary>('/exam-attempts/me/summary');
  },

  /**
   * GET /exam-attempts/overview — Điểm TB toàn bộ Thực tập sinh + bảng điểm từng
   * người. Quyền: MENTOR trở lên.
   */
  overview() {
    return request<ApiExamOverview>('/exam-attempts/overview');
  },

  /** GET /users/{id}/exam-attempts — Lịch sử làm bài của một người. Quyền: MENTOR. */
  forUser(userId: number, params?: { page?: number; size?: number }) {
    return request<Paginated<ApiExamAttempt>>(`/users/${userId}/exam-attempts`, {
      query: params,
    });
  },

  /** GET /users/{id}/exam-attempts/summary — Điểm từng đề của một người. Quyền: MENTOR. */
  summaryForUser(userId: number) {
    return request<ApiExamSummary>(`/users/${userId}/exam-attempts/summary`);
  },
};

// ============================================================================
// 4. Nhóm (Groups)
// ============================================================================

export const groupsApi = {
  /** GET /groups — Danh sách nhóm. Quyền: MENTOR. */
  list(params?: { search?: string; cohort?: string; page?: number; size?: number }) {
    return request<Paginated<ApiGroup>>('/groups', { query: params });
  },

  /** POST /groups — Tạo nhóm. Quyền: MENTOR. */
  create(payload: { name: string; cohort: string; description?: string }) {
    return request<ApiGroup>('/groups', { method: 'POST', body: payload });
  },

  /** GET /groups/{id} — Chi tiết nhóm kèm thành viên. Quyền: MENTOR. */
  get(id: number) {
    return request<ApiGroup>(`/groups/${id}`);
  },

  /** PATCH /groups/{id} — Sửa nhóm. Quyền: MENTOR. */
  update(id: number, payload: Partial<{ name: string; cohort: string; description: string }>) {
    return request<ApiGroup>(`/groups/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /groups/{id} — Xóa nhóm. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/groups/${id}`, { method: 'DELETE' });
  },

  /**
   * POST /groups/{id}/members — Thêm nhiều Intern vào nhóm. Quyền: MENTOR.
   *
   * Người mới **tự động kế thừa** mọi lộ trình và dự án đang gán cho nhóm —
   * `inherited_roadmaps` / `inherited_projects` cho biết đã cấp thêm bao nhiêu.
   */
  addMembers(id: number, user_ids: number[]) {
    return request<ApiAddMembersResult>(`/groups/${id}/members`, {
      method: 'POST',
      body: { user_ids },
    });
  },

  /**
   * DELETE /groups/{id}/members/{user_id} — Gỡ 1 Intern khỏi nhóm. Quyền: MENTOR.
   *
   * Chỉ thu hồi lộ trình/dự án người đó có VÌ thuộc nhóm này và chưa động vào;
   * phần đã có tiến độ được giữ lại (`kept_*`) dưới dạng gán cá nhân.
   */
  removeMember(id: number, userId: number) {
    return request<ApiRemoveMemberResult>(`/groups/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// 5. Tài liệu (Documents) & Tags
// ============================================================================

export const documentsApi = {
  /** GET /documents — Danh sách + lọc tag. Quyền: INTERN/MENTOR. */
  list(params?: { page?: number; size?: number; search?: string; tag?: string; type?: ApiDocType }) {
    return request<Paginated<ApiDocument>>('/documents', { query: params });
  },

  /** POST /documents — Tạo tài liệu mới. Quyền: MENTOR. */
  create(payload: {
    title: string;
    description: string;
    content_url: string;
    type: ApiDocType;
    tag_ids?: number[];
  }) {
    return request<ApiDocument>('/documents', { method: 'POST', body: payload });
  },

  /** GET /documents/{id} — Chi tiết. Quyền: INTERN/MENTOR. */
  get(id: number) {
    return request<ApiDocument>(`/documents/${id}`);
  },

  /** PATCH /documents/{id} — Sửa (có thể cập nhật tag_ids). Quyền: MENTOR. */
  update(
    id: number,
    payload: Partial<{
      title: string;
      description: string;
      content_url: string;
      type: ApiDocType;
      tag_ids: number[];
    }>
  ) {
    return request<ApiDocument>(`/documents/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /documents/{id} — Xóa. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/documents/${id}`, { method: 'DELETE' });
  },

  /** POST /documents/upload — Upload file (multipart, field "file"). Trả content_url. */
  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return request<{ content_url: string }>('/documents/upload', {
      method: 'POST',
      body: form,
      isFormData: true,
    });
  },
};

export const tagsApi = {
  /** GET /tags — Danh sách tag. Quyền: INTERN/MENTOR. */
  list() {
    return request<ApiTag[]>('/tags');
  },

  /** POST /tags — Tạo tag. Quyền: MENTOR. 409 nếu trùng tên. */
  create(name: string) {
    return request<ApiTag>('/tags', { method: 'POST', body: { name } });
  },

  /** DELETE /tags/{id} — Xóa tag. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/tags/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// 6. Lộ trình (Roadmaps), Chặng (Modules), gán tài liệu
// ============================================================================

export const roadmapsApi = {
  /**
   * GET /roadmaps — Danh sách lộ trình. Quyền: INTERN/MENTOR.
   * Backend trả **Page** (`{items,total,page,size,pages}`) như mọi list endpoint khác,
   * KHÔNG phải mảng trần — khai sai kiểu ở đây từng làm `roadmaps.map` ném TypeError
   * và trắng cả trang ở tab Lộ trình (xem RoadmapView.loadRoadmaps).
   */
  list(params?: { page?: number; size?: number; search?: string }) {
    return request<Paginated<ApiRoadmapListItem>>('/roadmaps', { query: params });
  },

  /** POST /roadmaps — Tạo lộ trình. Quyền: MENTOR. */
  create(payload: { title: string; description?: string }) {
    return request<ApiRoadmapListItem>('/roadmaps', { method: 'POST', body: payload });
  },

  /** GET /roadmaps/{id} — Chi tiết kèm chặng + bài. Quyền: INTERN/MENTOR. */
  get(id: number) {
    return request<ApiRoadmapDetail>(`/roadmaps/${id}`);
  },

  /** PATCH /roadmaps/{id} — Sửa. Quyền: MENTOR. */
  update(id: number, payload: Partial<{ title: string; description: string }>) {
    return request<ApiRoadmapDetail>(`/roadmaps/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /roadmaps/{id} — Xóa. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/roadmaps/${id}`, { method: 'DELETE' });
  },

  /** POST /roadmaps/{roadmap_id}/modules — Thêm chặng. Quyền: MENTOR. */
  addModule(
    roadmapId: number,
    payload: {
      title: string;
      description?: string;
      position?: number;
      track?: ApiDepartment;
      week_number?: number;
      duration_text?: string;
      key_skills?: string[];
      start_date?: string | null;
      end_date?: string | null;
    }
  ) {
    return request<ApiModule>(`/roadmaps/${roadmapId}/modules`, { method: 'POST', body: payload });
  },

  /** POST /roadmaps/{roadmap_id}/assign — Gán lộ trình cho 1/nhiều Intern. Quyền: MENTOR. */
  assign(roadmapId: number, user_ids: number[]) {
    return request<{ created: Array<{ assignment_id: number; user_id: number }> }>(
      `/roadmaps/${roadmapId}/assign`,
      { method: 'POST', body: { user_ids } }
    );
  },

  /**
   * POST /roadmaps/{roadmap_id}/assign-group — Bulk assign cho cả nhóm. Quyền: MENTOR.
   * Response KHÁC endpoint assign cá nhân: trả về số đếm (`assigned_count`,
   * `skipped_existing`) chứ không phải mảng `created`.
   */
  assignGroup(roadmapId: number, group_id: number) {
    return request<{ group_id: number; assigned_count: number; skipped_existing: number }>(
      `/roadmaps/${roadmapId}/assign-group`,
      { method: 'POST', body: { group_id } }
    );
  },
};

export const modulesApi = {
  /** PATCH /modules/{id} — Sửa chặng (kể cả đổi position, hạn hoàn thành). Quyền: MENTOR. */
  update(
    id: number,
    payload: Partial<{
      title: string;
      description: string;
      position: number;
      track: ApiDepartment;
      week_number: number;
      duration_text: string;
      key_skills: string[];
      start_date: string | null;
      end_date: string | null;
    }>
  ) {
    return request<ApiModule>(`/modules/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /modules/{id} — Xóa chặng. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/modules/${id}`, { method: 'DELETE' });
  },

  /**
   * POST /modules/{module_id}/lessons — Tạo BÀI HỌC bằng tên + link. Quyền: MENTOR.
   * Không sinh bản ghi nào trong Thư viện Tài liệu.
   */
  createLesson(moduleId: number, payload: { title: string; content_url: string; position?: number }) {
    return request<ApiModuleDocument>(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: payload,
    });
  },

  /** POST /modules/{module_id}/documents — Tạo bài học TỪ tài liệu có sẵn. Quyền: MENTOR. */
  addDocuments(moduleId: number, items: Array<{ document_id: number; position: number }>) {
    return request<ApiModuleDocument[]>(`/modules/${moduleId}/documents`, {
      method: 'POST',
      body: { items },
    });
  },
};

export const moduleDocumentsApi = {
  /** PATCH /module-documents/{id} — Sửa tên/link/thứ tự bài học. Quyền: MENTOR. */
  update(id: number, payload: Partial<{ title: string; content_url: string; position: number }>) {
    return request<ApiModuleDocument>(`/module-documents/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /module-documents/{id} — Xoá 1 bài học khỏi chặng. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/module-documents/${id}`, { method: 'DELETE' });
  },

  /** POST /module-documents/{id}/attachments — Đính tài liệu vào bài học. Quyền: MENTOR. */
  attachDocuments(moduleDocumentId: number, document_ids: number[]) {
    return request<ApiLessonAttachment[]>(`/module-documents/${moduleDocumentId}/attachments`, {
      method: 'POST',
      body: { document_ids },
    });
  },

  /** DELETE /module-documents/{id}/attachments/{document_id} — Gỡ tài liệu khỏi bài học. */
  detachDocument(moduleDocumentId: number, documentId: number) {
    return request<void>(`/module-documents/${moduleDocumentId}/attachments/${documentId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// 7. Gán lộ trình (Assignments)
// ============================================================================

export const assignmentsApi = {
  /** GET /roadmap-assignments — Danh sách lượt gán, lọc theo roadmap/intern/nhóm/status. Quyền: MENTOR. */
  list(params?: { page?: number; size?: number; roadmap_id?: number; user_id?: number; group_id?: number; status?: 'IN_PROGRESS' | 'COMPLETED' }) {
    return request<Paginated<ApiAssignmentListItem>>('/roadmap-assignments', { query: params });
  },

  /** DELETE /roadmap-assignments/{id} — Hủy gán. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/roadmap-assignments/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// 8. Học tập & Tiến độ (Progress)
// ============================================================================

export const learningApi = {
  /** GET /me/roadmaps — Lộ trình được giao cho Intern hiện tại. Quyền: INTERN. */
  myRoadmaps() {
    return request<ApiAssignedRoadmap[]>('/me/roadmaps');
  },

  /** GET /me/roadmaps/{assignment_id} — Chi tiết + trạng thái từng bài. Quyền: INTERN. */
  myRoadmapDetail(assignmentId: number) {
    return request<ApiAssignedRoadmapDetail>(`/me/roadmaps/${assignmentId}`);
  },

  /** POST /lessons/{module_document_id}/complete — Đánh dấu hoàn thành. Quyền: INTERN. */
  completeLesson(moduleDocumentId: number, assignmentId: number) {
    return request<ApiCompleteLessonResponse>(`/lessons/${moduleDocumentId}/complete`, {
      method: 'POST',
      body: { assignment_id: assignmentId },
    });
  },

  /** DELETE /lessons/{module_document_id}/complete — Bỏ đánh dấu. Quyền: INTERN. */
  uncompleteLesson(moduleDocumentId: number, assignmentId: number) {
    return request<{ progress_percent: number }>(`/lessons/${moduleDocumentId}/complete`, {
      method: 'DELETE',
      query: { assignment_id: assignmentId },
    });
  },
};

// ============================================================================
// 9. Dashboard
// ============================================================================

export const dashboardApi = {
  /** GET /dashboard/me — Dashboard của Intern. Quyền: INTERN. */
  me() {
    return request<ApiDashboardMe>('/dashboard/me');
  },

  /** GET /dashboard/overview — Dashboard tổng quan. Quyền: MENTOR. */
  overview() {
    return request<ApiDashboardOverview>('/dashboard/overview');
  },

  /** GET /dashboard/roadmaps/{roadmap_id} — Tiến độ mọi Intern trong 1 lộ trình. Quyền: MENTOR. */
  roadmapProgress(roadmapId: number) {
    return request<{
      roadmap_id: number;
      title: string;
      interns: Array<{ user_id: number; full_name: string; progress_percent: number; status: string }>;
    }>(`/dashboard/roadmaps/${roadmapId}`);
  },
};

// ============================================================================
// 10. Comment
// ============================================================================

export const commentsApi = {
  /** GET /lessons/{module_document_id}/comments — Danh sách comment (kèm reply). */
  list(moduleDocumentId: number) {
    return request<ApiComment[]>(`/lessons/${moduleDocumentId}/comments`);
  },

  /** POST /lessons/{module_document_id}/comments — Viết comment/reply, có thể kèm code_snippet. */
  create(
    moduleDocumentId: number,
    content: string,
    parent_comment_id: number | null = null,
    code_snippet?: string
  ) {
    return request<ApiComment>(`/lessons/${moduleDocumentId}/comments`, {
      method: 'POST',
      body: { content, parent_comment_id, code_snippet },
    });
  },

  /** PATCH /comments/{id} — Sửa comment của chính mình. */
  update(id: number, content: string) {
    return request<ApiComment>(`/comments/${id}`, { method: 'PATCH', body: { content } });
  },

  /** DELETE /comments/{id} — Xóa comment (chủ comment hoặc MENTOR). */
  remove(id: number) {
    return request<void>(`/comments/${id}`, { method: 'DELETE' });
  },

  /** PATCH /comments/{id}/resolve — Đánh dấu đã giải quyết câu hỏi. Quyền: MENTOR. */
  resolve(id: number, isResolved = true) {
    return request<ApiComment>(`/comments/${id}/resolve`, {
      method: 'PATCH',
      body: { is_resolved: isResolved },
    });
  },
};

// ============================================================================
// 11. Dự án (Projects)
// ============================================================================

export const projectsApi = {
  /**
   * GET /projects — Danh sách dự án. Quyền: INTERN/MENTOR (INTERN luôn chỉ thấy
   * dự án của chính mình bất kể filter truyền vào).
   */
  list(params?: {
    page?: number;
    size?: number;
    search?: string;
    department?: ApiDepartment;
    status?: ApiProjectStatus;
    member_id?: number;
  }) {
    return request<Paginated<ApiProject>>('/projects', { query: params });
  },

  /** POST /projects — Tạo dự án. Quyền: MENTOR/ADMIN. 409 nếu trùng `code`. */
  create(payload: {
    code: string;
    title: string;
    department?: ApiDepartment;
    status?: ApiProjectStatus;
    lead_user_id?: number;
    progress_percent?: number;
    deadline?: string;
    description?: string;
    tag_ids?: number[];
    member_ids?: number[];
  }) {
    return request<ApiProject>('/projects', { method: 'POST', body: payload });
  },

  /** GET /projects/{id} — Chi tiết dự án kèm thành viên. */
  get(id: number) {
    return request<ApiProjectDetail>(`/projects/${id}`);
  },

  /** PATCH /projects/{id} — Sửa dự án. Quyền: MENTOR/ADMIN. */
  update(
    id: number,
    payload: Partial<{
      code: string;
      title: string;
      department: ApiDepartment;
      status: ApiProjectStatus;
      lead_user_id: number;
      progress_percent: number;
      deadline: string;
      description: string;
      tag_ids: number[];
    }>
  ) {
    return request<ApiProject>(`/projects/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /projects/{id} — Xóa mềm. Quyền: MENTOR/ADMIN. */
  remove(id: number) {
    return request<void>(`/projects/${id}`, { method: 'DELETE' });
  },

  /** POST /projects/{id}/members — Thêm nhiều thành viên. Quyền: MENTOR/ADMIN. */
  addMembers(id: number, user_ids: number[]) {
    return request<ApiProjectMember[]>(`/projects/${id}/members`, {
      method: 'POST',
      body: { user_ids },
    });
  },

  /**
   * POST /projects/{id}/members/group — Gán cả một NHÓM vào dự án. Quyền: MENTOR.
   *
   * Là luật thường trực, không phải chép một lần: ai vào nhóm sau cũng tự được
   * thêm vào dự án này. Đối xứng với `roadmapsApi.assignGroup`.
   */
  addGroup(id: number, group_id: number) {
    return request<{ added_count: number; skipped_existing: number }>(
      `/projects/${id}/members/group`,
      { method: 'POST', body: { group_id } }
    );
  },

  /** DELETE /projects/{id}/members/{user_id} — Gỡ 1 thành viên. Quyền: MENTOR/ADMIN. */
  removeMember(id: number, userId: number) {
    return request<void>(`/projects/${id}/members/${userId}`, { method: 'DELETE' });
  },
};

// ============================================================================
// 12. Công việc (Tasks)
// ============================================================================

export const tasksApi = {
  /** GET /tasks — Danh sách task, lọc theo project/intern/status/priority. */
  list(params?: {
    page?: number;
    size?: number;
    project_id?: number;
    assigned_intern_id?: number;
    status?: ApiTaskStatus;
    priority?: ApiTaskPriority;
  }) {
    return request<Paginated<ApiTask>>('/tasks', { query: params });
  },

  /** POST /tasks — Tạo task. Quyền: MENTOR/ADMIN. `mentor_id` mặc định là người gọi. */
  create(payload: {
    title: string;
    project_id?: number;
    assigned_intern_id?: number;
    mentor_id?: number;
    status?: ApiTaskStatus;
    priority?: ApiTaskPriority;
    due_date?: string;
    description?: string;
    pr_url?: string;
  }) {
    return request<ApiTask>('/tasks', { method: 'POST', body: payload });
  },

  /** GET /tasks/{id} — Chi tiết task. */
  get(id: number) {
    return request<ApiTask>(`/tasks/${id}`);
  },

  /** PATCH /tasks/{id} — Sửa task (đổi status, PR url, feedback...). */
  update(
    id: number,
    payload: Partial<{
      title: string;
      project_id: number;
      assigned_intern_id: number;
      mentor_id: number;
      status: ApiTaskStatus;
      priority: ApiTaskPriority;
      due_date: string;
      description: string;
      pr_url: string;
      mentor_feedback: string;
    }>
  ) {
    return request<ApiTask>(`/tasks/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /tasks/{id} — Xóa task. Quyền: MENTOR/ADMIN. */
  remove(id: number) {
    return request<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// 13. Báo cáo hằng ngày (Daily Reports)
// ============================================================================

export const dailyReportsApi = {
  /** GET /daily-reports — Danh sách báo cáo, lọc theo intern/khoảng ngày/status. */
  list(params?: {
    page?: number;
    size?: number;
    intern_id?: number;
    date_from?: string;
    date_to?: string;
    status?: ApiDailyReportStatus;
  }) {
    return request<Paginated<ApiDailyReport>>('/daily-reports', { query: params });
  },

  /** POST /daily-reports — Tạo báo cáo của chính mình. 409 nếu đã báo cáo ngày đó. */
  create(payload: {
    date: string;
    completed_today: string;
    tomorrow_plan?: string;
    blockers?: string;
    hours_logged?: number;
  }) {
    return request<ApiDailyReport>('/daily-reports', { method: 'POST', body: payload });
  },

  /** GET /daily-reports/{id} — Chi tiết báo cáo. */
  get(id: number) {
    return request<ApiDailyReport>(`/daily-reports/${id}`);
  },

  /** PATCH /daily-reports/{id} — Sửa báo cáo của chính mình. */
  update(
    id: number,
    payload: Partial<{
      date: string;
      completed_today: string;
      tomorrow_plan: string;
      blockers: string;
      hours_logged: number;
    }>
  ) {
    return request<ApiDailyReport>(`/daily-reports/${id}`, { method: 'PATCH', body: payload });
  },

  /** PATCH /daily-reports/{id}/review — Duyệt báo cáo (Approved/Needs Revision). Quyền: MENTOR/ADMIN. */
  review(id: number, payload: { status: ApiDailyReportStatus; mentor_comment?: string; rating?: number }) {
    return request<ApiDailyReport>(`/daily-reports/${id}/review`, { method: 'PATCH', body: payload });
  },
};

// ============================================================================
// Gom nhóm export tiện dùng
// ============================================================================

export const api = {
  auth: authApi,
  users: usersApi,
  groups: groupsApi,
  documents: documentsApi,
  tags: tagsApi,
  roadmaps: roadmapsApi,
  modules: modulesApi,
  moduleDocuments: moduleDocumentsApi,
  assignments: assignmentsApi,
  learning: learningApi,
  dashboard: dashboardApi,
  comments: commentsApi,
  projects: projectsApi,
  tasks: tasksApi,
  dailyReports: dailyReportsApi,
};

export default api;
