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

// ---- Quản lý token --------------------------------------------------------

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken?: string): void {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  setAccess(accessToken: string): void {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  isAuthenticated(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

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
    tokenStore.clear();
    if (onUnauthorized) onUnauthorized();
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
export type ApiUserStatus = 'ACTIVE' | 'LOCKED';
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
  department?: ApiDepartment | null;
  mentor_id?: number | null;
  mentor_name?: string | null;
  mentor_email?: string | null;
  phone?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  university?: string | null;
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

export interface ApiModuleDocument {
  module_document_id: number;
  document_id: number;
  title: string;
  type?: ApiDocType;
  content_url?: string;
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
  type?: ApiDocType;
  content_url?: string;
  completed: boolean;
  completed_at?: string | null;
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
  /** POST /auth/register — Đăng ký (chỉ tạo INTERN). Công khai. */
  register(payload: { full_name: string; email: string; password: string }) {
    return request<ApiUser>('/auth/register', { method: 'POST', body: payload, auth: false });
  },

  /** POST /auth/login — Đăng nhập. Công khai. Tự lưu token khi thành công. */
  async login(payload: { email: string; password: string }): Promise<LoginResponse> {
    const data = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    tokenStore.set(data.access_token, data.refresh_token);
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

  /** POST /users — Tạo tài khoản MENTOR/ADMIN (không tạo được INTERN — dùng /auth/register). Quyền: ADMIN. */
  create(payload: { full_name: string; email: string; password: string; role: 'ADMIN' | 'MENTOR' }) {
    return request<ApiUser>('/users', { method: 'POST', body: payload });
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
      mentor_id: number;
      phone: string;
      start_date: string;
      end_date: string;
      university: string;
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

  /** DELETE /users/{id} — Xóa mềm. Quyền: ADMIN. */
  remove(id: number) {
    return request<void>(`/users/${id}`, { method: 'DELETE' });
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

  /** POST /groups/{id}/members — Thêm nhiều Intern vào nhóm. Quyền: MENTOR. */
  addMembers(id: number, user_ids: number[]) {
    return request<ApiGroupMember[]>(`/groups/${id}/members`, {
      method: 'POST',
      body: { user_ids },
    });
  },

  /** DELETE /groups/{id}/members/{user_id} — Kick 1 Intern. Quyền: MENTOR. */
  removeMember(id: number, userId: number) {
    return request<void>(`/groups/${id}/members/${userId}`, { method: 'DELETE' });
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
  /** PATCH /modules/{id} — Sửa chặng (kể cả đổi position). Quyền: MENTOR. */
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
    }>
  ) {
    return request<ApiModule>(`/modules/${id}`, { method: 'PATCH', body: payload });
  },

  /** DELETE /modules/{id} — Xóa chặng. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/modules/${id}`, { method: 'DELETE' });
  },

  /** POST /modules/{module_id}/documents — Gán tài liệu vào chặng. Quyền: MENTOR. */
  addDocuments(moduleId: number, items: Array<{ document_id: number; position: number }>) {
    return request<ApiModuleDocument[]>(`/modules/${moduleId}/documents`, {
      method: 'POST',
      body: { items },
    });
  },
};

export const moduleDocumentsApi = {
  /** DELETE /module-documents/{id} — Gỡ 1 tài liệu khỏi chặng. Quyền: MENTOR. */
  remove(id: number) {
    return request<void>(`/module-documents/${id}`, { method: 'DELETE' });
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
