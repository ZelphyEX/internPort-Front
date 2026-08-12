export type UserRole = 'ADMIN' | 'MENTOR' | 'INTERN';

export type InternStatus = 'Onboarding' | 'Active' | 'Reviewing' | 'Graduated' | 'Paused' | 'Removed';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

/**
 * Khối kỹ thuật của một DỰ ÁN / một chặng lộ trình (`modules.track`).
 *
 * KHÔNG còn là thuộc tính của con người: cột `users.department` đã bị bỏ khỏi
 * database (migration `f1c6b83ad74e`) vì portal không có chỗ nào để chọn nó, nên
 * mọi tài khoản thật đều rỗng và frontend phải mặc định thành 'Java Back-End' —
 * hiện ra một chuyên ngành bịa cho tất cả mọi người.
 */
export type Department = 'Java Back-End' | 'React Front-End' | 'Cloud & DevOps' | 'Salesforce / ERP' | 'AI & Data Science';

export interface InternSkill {
  name: string;
  level: number; // 1 - 100
  category: string;
}

export interface Intern {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  mentor: string;
  mentorEmail: string;
  startDate: string;
  endDate: string;
  status: InternStatus;
  project: string;
  projectId: string;
  score: number; // e.g. 8.8
  attendanceRate: number; // e.g. 96 (%)
  githubUrl?: string;
  skills: InternSkill[];
  bio?: string;
  // Trường / Ngành / Khối kỹ thuật đã bỏ khỏi cả database và giao diện
  // (migration d5c8a2e64f19, e7a4b1d09c53, f1c6b83ad74e).
  completedTasksCount?: number;
  totalTasksCount?: number;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  department: Department;
  status: 'In Planning' | 'Active' | 'Under Review' | 'Completed';
  lead: string;
  membersCount: number;
  memberIds?: string[];
  progress: number;
  deadline: string;
  description: string;
  tags: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignedInternId: string;
  assignedInternName: string;
  mentorName: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  description: string;
  prUrl?: string;
  mentorFeedback?: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  internId: string;
  internName: string;
  date: string;
  completedToday: string;
  tomorrowPlan: string;
  blockers: string;
  hoursLogged: number;
  status: 'Pending' | 'Approved' | 'Needs Revision';
  mentorComment?: string;
  rating?: number; // 1 - 5 stars
  createdAt: string;
}

/** Tên một danh mục Thư viện Tài liệu — danh sách đầy đủ ở `DOC_CATEGORIES`
 * trong `KnowledgeBaseView.tsx`. `| string` để không chặn dữ liệu cũ/lạ từ
 * server (danh mục là chuỗi tự do, không phải enum). */
export type DocumentCategory =
  | 'Coding Standard'
  | 'Onboarding'
  | 'Architecture'
  | 'Template'
  | 'AI'
  | 'API Docs'
  | 'CCA-F Certificate'
  | 'CCDV-F Certificate'
  | string;

export interface DocumentResource {
  id: string;
  title: string;
  /** Một tài liệu thuộc được NHIỀU danh mục cùng lúc — mảng rỗng = chưa gán. */
  categories: DocumentCategory[];
  author: string;
  updatedAt: string;
  /** Suy ra từ đuôi file lúc tải lên, không cho người dùng tự chọn. */
  fileType: 'PDF' | 'DOCX' | 'SLIDE' | 'MD';
  /** Chuỗi để hiển thị ("845 KB"). Suy ra từ `File.size`, không nhập tay. */
  fileSize: string;
  /** Số byte thật — gửi lên server để lần đọc lại vẫn có dung lượng đúng. */
  fileSizeBytes?: number;
  downloadCount: number;
  description: string;
  tags: string[];
  /** URL công khai của file trên Cloud Storage (server: `documents.content_url`). */
  contentUrl?: string;
}

export interface SystemStats {
  totalInterns: number;
  activeInterns: number;
  totalMentors: number;
  activeProjects: number;
  reportSubmissionRate: number;
  avgPerformanceScore: number;
  completedTasksThisWeek: number;
  pendingReviewsCount: number;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Chức danh theo VAI TRÒ (Quản trị viên / Mentor / Thực tập sinh), không phải khối kỹ thuật. */
  roleTitle: string;
  avatar: string;
  internId?: string; // If role is INTERN, links to Intern record
}

export interface GroupMember {
  userId: string;
  userName: string;
  userEmail: string;
  avatar: string;
  role: UserRole; // Vai trò của thành viên này trong nhóm
  status: 'Pending' | 'Approved' | 'Rejected';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  /**
   * Niên khoá của nhóm (server: `groups.cohort`), vd "2026".
   * Trước đây trường này bị dùng làm "mã mời" sinh ngẫu nhiên ở client — đã bỏ,
   * vì backend không có cơ chế tham gia bằng mã. Nay Mentor/Admin thêm thẳng
   * thành viên qua `POST /groups/{id}/members`.
   */
  cohort: string;
  createdBy: string; // userId của người tạo
  createdAt: string;
  /** Chỉ có dữ liệu khi gọi `GET /groups/{id}`; danh sách nhóm không trả kèm. */
  members: GroupMember[];
  /**
   * Số thành viên do server báo (`GET /groups` trả `member_count`).
   * Cần trường riêng vì endpoint danh sách KHÔNG trả kèm mảng thành viên —
   * `members` sẽ rỗng với dữ liệu tải từ server, chỉ `GET /groups/{id}` mới có.
   */
  memberCount?: number;
}

export interface AIEvalReport {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  technicalAssessment: string;
  attitudeAssessment: string;
  hiringRecommendation: string;
  actionPlan: string[];
}
