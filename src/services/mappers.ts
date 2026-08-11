// ============================================================================
// Mappers — chuyển đổi giữa shape API (đặc tả) và shape Frontend (types.ts)
// API dùng id number, full_name, avatar_url, content_url...
// FE dùng id string, name, avatar, downloadUrl... nên cần lớp trung gian này.
// ============================================================================

import type {
  ApiUser,
  ApiDocument,
  ApiDocType,
  ApiGroup,
  ApiDepartment,
  ApiProject,
  ApiTask,
  ApiDailyReport,
} from './api';
import type {
  AuthUser,
  UserRole,
  DocumentResource,
  Group,
  GroupMember,
  Intern,
  Department,
  Project,
  TaskItem,
  DailyReport,
} from '../types';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

// Backend dùng "Salesforce/ERP" (không khoảng trắng), FE dùng "Salesforce / ERP" —
// nên vẫn cần bảng map. Giờ chỉ còn Dự án dùng (`projects.department`); người thì
// không còn khối kỹ thuật nữa (xem type `Department` trong types.ts).
const API_DEPARTMENT_TO_FE: Record<ApiDepartment, Department> = {
  'Java Back-End': 'Java Back-End',
  'React Front-End': 'React Front-End',
  'Cloud & DevOps': 'Cloud & DevOps',
  'Salesforce/ERP': 'Salesforce / ERP',
  'AI & Data Science': 'AI & Data Science',
};

// ---- User -----------------------------------------------------------------

/** ApiUser (server) -> AuthUser (frontend session). */
export function apiUserToAuthUser(u: ApiUser): AuthUser {
  return {
    id: String(u.id),
    name: u.full_name,
    email: u.email,
    role: u.role as UserRole,
    roleTitle:
      u.role === 'ADMIN'
        ? 'Quản trị viên / HR Manager'
        : u.role === 'MENTOR'
        ? 'Mentor Hướng dẫn Kỹ thuật'
        : 'Thực tập sinh Gimasys',
    avatar: u.avatar_url || DEFAULT_AVATAR,
    internId: u.role === 'INTERN' ? String(u.id) : undefined,
  };
}

/**
 * ApiUser (server, role INTERN) -> Intern (frontend danh sách thực tập sinh).
 * project/projectId/skills vẫn để trống — các trường này đến từ resource
 * Projects/Roadmap riêng (xem projectsApi/assignmentsApi), không thuộc User.
 */
export function apiUserToIntern(u: ApiUser): Intern {
  return {
    id: String(u.id),
    name: u.full_name,
    email: u.email,
    // SĐT / mentor phụ trách / thời gian thực tập đã bị bỏ khỏi backend. Vẫn để
    // chuỗi rỗng vì kiểu `Intern` ở FE còn dùng các trường này ở dữ liệu mẫu.
    phone: '',
    avatar: u.avatar_url || DEFAULT_AVATAR,
    mentor: '',
    mentorEmail: '',
    startDate: '',
    endDate: '',
    status: u.status === 'LOCKED' ? 'Paused' : 'Active',
    project: '',
    projectId: '',
    score: u.score ?? 0,
    attendanceRate: u.attendance_rate ?? 0,
    githubUrl: u.github_url || undefined,
    skills: [],
    bio: u.bio || undefined,
  };
}

// ---- Document -------------------------------------------------------------

const API_TYPE_TO_FE_FILETYPE: Record<ApiDocType, DocumentResource['fileType']> = {
  PDF: 'PDF',
  ARTICLE: 'MD',
  LINK: 'MD',
  VIDEO: 'SLIDE',
};

/** Đổi số byte sang chuỗi dễ đọc. Dùng chung với KnowledgeBaseView lúc tải lên. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FE_FILETYPES: DocumentResource['fileType'][] = ['PDF', 'DOCX', 'SLIDE', 'MD'];

/**
 * ApiDocument (server) -> DocumentResource (frontend).
 *
 * Backend giờ lưu thẳng `category` / `file_type` / `file_size_bytes` (migration
 * a92f4c17be60). Trước đây ba thứ này không được lưu ở đâu cả:
 *   * `category` lấy tạm từ tag đầu tiên, không có tag thì rơi về "API Docs" —
 *     nên tải lại trang là mọi tài liệu đều thành "API Docs";
 *   * `fileType` suy từ `type` (chỉ 4 giá trị) nên DOCX và MD lẫn vào nhau;
 *   * `fileSize` luôn hiện "—".
 * Vẫn suy ngược từ `type` khi cột mới là NULL, để tài liệu tạo trước migration
 * hiển thị được như cũ.
 */
export function apiDocumentToResource(d: ApiDocument): DocumentResource {
  const storedFileType = (d.file_type || '').toUpperCase() as DocumentResource['fileType'];
  return {
    id: String(d.id),
    title: d.title || '',
    category: d.category || 'Onboarding',
    author: 'Gimasys',
    updatedAt: d.created_at,
    fileType: FE_FILETYPES.includes(storedFileType)
      ? storedFileType
      : API_TYPE_TO_FE_FILETYPE[d.type] || 'MD',
    fileSize:
      d.file_size_bytes !== undefined && d.file_size_bytes !== null
        ? formatFileSize(d.file_size_bytes)
        : '—',
    downloadCount: 0,
    // Backend thực tế có thể trả null dù kiểu khai báo là string (VD document id 16 trả description: null)
    // -> phải fallback '' để tránh crash khi component gọi .toLowerCase() lúc tìm kiếm.
    description: d.description || '',
    tags: d.tags || [],
    contentUrl: d.content_url || undefined,
  };
}

/** FE fileType -> API type (khi tạo tài liệu mới). */
export function feFileTypeToApiType(ft: DocumentResource['fileType']): ApiDocType {
  switch (ft) {
    case 'PDF':
      return 'PDF';
    case 'SLIDE':
      return 'VIDEO';
    case 'DOCX':
    case 'MD':
    default:
      return 'ARTICLE';
  }
}

// ---- Group ----------------------------------------------------------------

/**
 * ApiGroup (server) -> Group (frontend).
 *
 * ⚠️ `GET /groups` (danh sách) chỉ trả `member_count`, KHÔNG trả mảng thành viên —
 * chỉ `GET /groups/{id}` mới có. Nên với nhóm tải từ danh sách, `members` luôn rỗng
 * và phải dùng `memberCount` để hiển thị số thành viên; đừng lọc nhóm theo `members`.
 */
export function apiGroupToGroup(g: ApiGroup, createdBy = ''): Group {
  const members: GroupMember[] = (g.members || []).map((m) => ({
    userId: String(m.id),
    userName: m.full_name,
    userEmail: m.email,
    avatar: DEFAULT_AVATAR,
    role: (m.role || 'INTERN') as UserRole,
    status: 'Approved',
    joinedAt: new Date().toISOString(),
  }));
  return {
    id: String(g.id),
    name: g.name,
    cohort: g.cohort || '',
    createdBy,
    createdAt: new Date().toISOString(),
    members,
    memberCount: g.member_count ?? members.length,
  };
}

// ---- Project ----------------------------------------------------------------

/**
 * ApiProject (server) -> Project (frontend). ProjectStatus dùng chung enum
 * ('In Planning'|'Active'|'Under Review'|'Completed') nên không cần map lại.
 */
export function apiProjectToProject(p: ApiProject): Project {
  return {
    id: String(p.id),
    code: p.code,
    title: p.title,
    department: p.department ? API_DEPARTMENT_TO_FE[p.department] : 'Java Back-End',
    status: p.status,
    lead: p.lead_name || '',
    membersCount: p.member_count,
    progress: p.progress_percent,
    deadline: p.deadline || '',
    description: p.description || '',
    tags: p.tags || [],
  };
}

// ---- Task ---------------------------------------------------------------------

/**
 * ApiTask (server) -> TaskItem (frontend). TaskStatus/TaskPriority dùng chung enum
 * nên không cần map lại.
 */
export function apiTaskToTaskItem(t: ApiTask): TaskItem {
  return {
    id: String(t.id),
    title: t.title,
    projectId: t.project_id != null ? String(t.project_id) : '',
    projectName: t.project_title || '',
    assignedInternId: t.assigned_intern_id != null ? String(t.assigned_intern_id) : '',
    assignedInternName: t.assigned_intern_name || '',
    mentorName: t.mentor_name || '',
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date || '',
    description: t.description || '',
    prUrl: t.pr_url || undefined,
    mentorFeedback: t.mentor_feedback || undefined,
    createdAt: t.created_at,
  };
}

// ---- Daily Report ---------------------------------------------------------------

/** ApiDailyReport (server) -> DailyReport (frontend). */
export function apiDailyReportToReport(r: ApiDailyReport): DailyReport {
  return {
    id: String(r.id),
    internId: String(r.intern_id),
    internName: r.intern_name || '',
    date: r.date,
    completedToday: r.completed_today,
    tomorrowPlan: r.tomorrow_plan || '',
    blockers: r.blockers || '',
    hoursLogged: r.hours_logged ?? 0,
    status: r.status,
    mentorComment: r.mentor_comment || undefined,
    rating: r.rating || undefined,
    createdAt: r.created_at,
  };
}
