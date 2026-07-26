export type UserRole = 'ADMIN' | 'MENTOR' | 'INTERN';

export type InternStatus = 'Onboarding' | 'Active' | 'Reviewing' | 'Graduated' | 'Paused' | 'Removed';

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

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
  department: Department;
  roleTitle: string; // e.g. "Thực tập sinh Java Spring"
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
  university?: string;
  major?: string;
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
  department: Department;
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

export interface DocumentResource {
  id: string;
  title: string;
  category: 'Coding Standard' | 'Onboarding' | 'Architecture' | 'Template' | 'API Docs' | 'CCA-F Certificate' | string;
  author: string;
  updatedAt: string;
  fileType: 'PDF' | 'DOCX' | 'SLIDE' | 'MD';
  fileSize: string;
  downloadCount: number;
  description: string;
  tags: string[];
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
  department?: Department;
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
  code: string; // Mã mời để join nhóm
  createdBy: string; // userId của người tạo (mặc định là Admin)
  createdAt: string;
  members: GroupMember[];
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
