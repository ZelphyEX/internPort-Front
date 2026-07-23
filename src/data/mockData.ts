import {
  Intern,
  Project,
  TaskItem,
  DailyReport,
  TrainingModule,
  DocumentResource,
  SystemStats,
  AuthUser
} from '../types';

export const INITIAL_INTERNS: Intern[] = [
  {
    id: 'INT-001',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@gimasys.vn',
    phone: '0988 123 456',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    department: 'Java Back-End',
    roleTitle: 'Thực tập sinh Java Spring Microservices',
    mentor: 'Trần Tuấn Anh (Senior Architect)',
    mentorEmail: 'anh.tran@gimasys.vn',
    startDate: '2025-01-05',
    endDate: '2025-04-05',
    status: 'Active',
    project: 'Hệ thống Quản lý Khách hàng Enterprise (CRM Core)',
    projectId: 'PRJ-01',
    score: 9.2,
    attendanceRate: 98,
    githubUrl: 'https://github.com/an-nguyen-dev',
    roadmapProgress: 80,
    university: 'Đại học Bách Khoa Hà Nội',
    major: 'Công nghệ Thông tin',
    bio: 'Đam mê phát triển backend quy mô lớn, RESTful APIs và Kafka message queue. Đang làm quen với Spring Cloud.',
    completedTasksCount: 14,
    totalTasksCount: 16,
    skills: [
      { name: 'Java Spring Boot', level: 88, category: 'Backend' },
      { name: 'PostgreSQL & SQL Tuning', level: 82, category: 'Database' },
      { name: 'Docker & Microservices', level: 75, category: 'DevOps' },
      { name: 'Git Workflow & Code Review', level: 90, category: 'Tools' }
    ]
  },
  {
    id: 'INT-002',
    name: 'Lê Thị Bích',
    email: 'bich.le@gimasys.vn',
    phone: '0977 234 567',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    department: 'React Front-End',
    roleTitle: 'Thực tập sinh React & TypeScript UI/UX',
    mentor: 'Phạm Minh Đức (Lead FE Engineer)',
    mentorEmail: 'duc.pham@gimasys.vn',
    startDate: '2025-01-10',
    endDate: '2025-04-10',
    status: 'Active',
    project: 'Gimasys Portal Dashboard & Design System',
    projectId: 'PRJ-02',
    score: 8.8,
    attendanceRate: 96,
    githubUrl: 'https://github.com/bichle-frontend',
    roadmapProgress: 75,
    university: 'Đại học Quốc Gia Hà Nội (UET)',
    major: 'Khoa học Máy tính',
    bio: 'Đặc biệt yêu thích xây dựng giao diện chuẩn Accessibility, TailwindCSS và State Management với Redux/Zustand.',
    completedTasksCount: 11,
    totalTasksCount: 14,
    skills: [
      { name: 'React.js & Next.js', level: 85, category: 'Frontend' },
      { name: 'TypeScript', level: 80, category: 'Frontend' },
      { name: 'TailwindCSS & Framer Motion', level: 92, category: 'Styling' },
      { name: 'REST & GraphQL Integration', level: 78, category: 'API' }
    ]
  },
  {
    id: 'INT-003',
    name: 'Trần Minh Đức',
    email: 'duc.tran@gimasys.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    department: 'Cloud & DevOps',
    roleTitle: 'Thực tập sinh Cloud AWS / GCP & CI-CD',
    mentor: 'Hoàng Quốc Việt (DevOps Lead)',
    mentorEmail: 'viet.hoang@gimasys.vn',
    startDate: '2025-02-01',
    endDate: '2025-05-01',
    status: 'Active',
    project: 'Hạ tầng CI/CD Pipeline & Kubernetes Cluster',
    projectId: 'PRJ-03',
    score: 8.5,
    attendanceRate: 94,
    githubUrl: 'https://github.com/duc-cloud-dev',
    roadmapProgress: 60,
    university: 'Học viện Công nghệ Bưu chính Viễn thông (PTIT)',
    major: 'An toàn Thông tin & Mạng máy tính',
    bio: 'Quan tâm tới Infrastructure as Code (Terraform), Kubernetes, Helm Charts và giám sát với Prometheus + Grafana.',
    completedTasksCount: 8,
    totalTasksCount: 12,
    skills: [
      { name: 'Docker & Containerization', level: 88, category: 'DevOps' },
      { name: 'Kubernetes & Helm', level: 70, category: 'Cloud' },
      { name: 'GitLab CI / GitHub Actions', level: 82, category: 'CI/CD' },
      { name: 'Terraform & Shell Scripting', level: 68, category: 'Automation' }
    ]
  },
  {
    id: 'INT-004',
    name: 'Phạm Hoàng Long',
    email: 'long.pham@gimasys.vn',
    phone: '0933 888 999',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    department: 'Salesforce / ERP',
    roleTitle: 'Thực tập sinh Salesforce CRM Consultant',
    mentor: 'Nguyễn Thị Hương (Salesforce Solution Architect)',
    mentorEmail: 'huong.nguyen@gimasys.vn',
    startDate: '2025-01-15',
    endDate: '2025-04-15',
    status: 'Active',
    project: 'Triển khai Salesforce Sales Cloud cho Ngân hàng VP',
    projectId: 'PRJ-04',
    score: 9.0,
    attendanceRate: 100,
    githubUrl: 'https://github.com/long-salesforce',
    roadmapProgress: 85,
    university: 'Đại học Kinh tế Quốc dân (NEU)',
    major: 'Hệ thống Thông tin Quản lý (MIS)',
    bio: 'Kỹ năng phân tích nghiệp vụ tốt, hiểu rõ Apex Code, Lightning Web Components (LWC) và quy trình CRM doanh nghiệp.',
    completedTasksCount: 13,
    totalTasksCount: 15,
    skills: [
      { name: 'Salesforce Sales & Service Cloud', level: 86, category: 'CRM' },
      { name: 'Apex & LWC Development', level: 80, category: 'Code' },
      { name: 'Process Builder & Flow', level: 90, category: 'Automation' },
      { name: 'Business Requirements Analysis', level: 88, category: 'BA' }
    ]
  },
  {
    id: 'INT-005',
    name: 'Vũ Thảo Nguyên',
    email: 'nguyen.vu@gimasys.vn',
    phone: '0966 555 444',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    department: 'AI & Data Science',
    roleTitle: 'Thực tập sinh AI & Analytics Engine',
    mentor: 'Đỗ Hữu Nam (Head of AI Lab)',
    mentorEmail: 'nam.do@gimasys.vn',
    startDate: '2025-02-15',
    endDate: '2025-05-15',
    status: 'Onboarding',
    project: 'Chatbot AI Báo cáo Thông minh Gimasys (Gemini API)',
    projectId: 'PRJ-05',
    score: 9.4,
    attendanceRate: 98,
    githubUrl: 'https://github.com/thaonguyen-ai',
    roadmapProgress: 45,
    university: 'Đại học Bách Khoa Hà Nội',
    major: 'Trí tuệ Nhân tạo & Khoa học Dữ liệu',
    bio: 'Tập trung nghiên cứu LLM, RAG (Retrieval-Augmented Generation), LangChain, Python FastAPI và tối ưu hóa Prompting.',
    completedTasksCount: 5,
    totalTasksCount: 10,
    skills: [
      { name: 'Python & PyTorch', level: 90, category: 'AI' },
      { name: 'LLM & Gemini API Integration', level: 88, category: 'AI' },
      { name: 'Vector DB (Chroma/Qdrant)', level: 75, category: 'Data' },
      { name: 'FastAPI & REST Service', level: 82, category: 'Backend' }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-00',
    code: 'GIM-TRAIN-2025',
    title: 'Chương trình Đào tạo Thực tập sinh & Onboarding Gimasys',
    department: 'Java Back-End',
    status: 'Active',
    lead: 'Trần Tuấn Anh (Lead Mentor)',
    membersCount: 12,
    progress: 65,
    deadline: '2025-06-30',
    description: 'Dự án đào tạo mẫu chứa toàn bộ Milestone & Task kỹ thuật theo Lộ trình 12 tuần của Thực tập sinh Gimasys.',
    tags: ['Training Roadmap', 'Git Flow', 'Spring Boot', 'React', 'DevOps', 'Salesforce']
  },
  {
    id: 'PRJ-01',
    code: 'GIM-CRM-2025',
    title: 'Hệ thống Quản lý Khách hàng Enterprise (CRM Core)',
    department: 'Java Back-End',
    status: 'Active',
    lead: 'Trần Tuấn Anh',
    membersCount: 6,
    progress: 72,
    deadline: '2025-04-30',
    description: 'Xây dựng hệ thống backend xử lý hàng triệu giao dịch khách hàng, tích hợp thanh toán và đồng bộ dữ liệu thời gian thực.',
    tags: ['Spring Boot', 'Kafka', 'PostgreSQL', 'Microservices']
  },
  {
    id: 'PRJ-02',
    code: 'GIM-UI-KIT',
    title: 'Gimasys Portal Dashboard & Design System',
    department: 'React Front-End',
    status: 'Active',
    lead: 'Phạm Minh Đức',
    membersCount: 4,
    progress: 85,
    deadline: '2025-04-15',
    description: 'Thiết kế thư viện component chuẩn Gimasys, xây dựng màn hình Portal cho quản lý nhân sự và theo dõi đào tạo.',
    tags: ['React', 'TypeScript', 'TailwindCSS', 'Framer Motion']
  },
  {
    id: 'PRJ-03',
    code: 'GIM-OPS-K8S',
    title: 'Hạ tầng CI/CD Pipeline & Kubernetes Cluster',
    department: 'Cloud & DevOps',
    status: 'Active',
    lead: 'Hoàng Quốc Việt',
    membersCount: 3,
    progress: 60,
    deadline: '2025-05-15',
    description: 'Tự động hóa triển khai ứng dụng microservices lên môi trường staging & production bằng Helm Chart và ArgoCD.',
    tags: ['AWS EKS', 'Docker', 'GitLab CI', 'ArgoCD']
  },
  {
    id: 'PRJ-04',
    code: 'GIM-SF-VPB',
    title: 'Triển khai Salesforce Sales Cloud cho Ngân hàng VP',
    department: 'Salesforce / ERP',
    status: 'Active',
    lead: 'Nguyễn Thị Hương',
    membersCount: 5,
    progress: 90,
    deadline: '2025-04-01',
    description: 'Tối ưu hóa quy trình tư vấn tín dụng, phê duyệt hồ sơ tự động cho khách hàng doanh nghiệp trên nền tảng Salesforce.',
    tags: ['Salesforce', 'LWC', 'Apex', 'Flow Manager']
  },
  {
    id: 'PRJ-05',
    code: 'GIM-AI-BOT',
    title: 'Chatbot AI Báo cáo Thông minh Gimasys (Gemini API)',
    department: 'AI & Data Science',
    status: 'Under Review',
    lead: 'Đỗ Hữu Nam',
    membersCount: 3,
    progress: 45,
    deadline: '2025-05-30',
    description: 'Tích hợp mô hình ngôn ngữ lớn Gemini 3.6 Flash để hỗ trợ giải đáp thắc mắc nội bộ và phân tích báo cáo tự động.',
    tags: ['Gemini API', 'Python', 'FastAPI', 'Vector Search']
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'TSK-001',
    title: '[Roadmap Module 1] Thực hành Git Flow, Clean Code & Java Core Deep Dive',
    projectId: 'PRJ-00',
    projectName: 'Chương trình Đào tạo Thực tập sinh',
    assignedInternId: 'INT-001',
    assignedInternName: 'Nguyễn Văn An',
    mentorName: 'Trần Tuấn Anh',
    status: 'Done',
    priority: 'High',
    dueDate: '2025-03-10',
    description: 'Quy chuẩn Git branching tại Gimasys, Naming convention, OOP Principles và viết Unit Test cho Collection Framework.',
    prUrl: 'https://github.com/gimasys/onboarding-lab/pull/01',
    mentorFeedback: 'Thực hành Git rebase tốt, Clean code đạt chuẩn Gimasys.',
    createdAt: '2025-03-01'
  },
  {
    id: 'TSK-002',
    title: '[Roadmap Module 2] Xây dựng RESTful API với Spring Boot 3 & PostgreSQL',
    projectId: 'PRJ-00',
    projectName: 'Chương trình Đào tạo Thực tập sinh',
    assignedInternId: 'INT-001',
    assignedInternName: 'Nguyễn Văn An',
    mentorName: 'Trần Tuấn Anh',
    status: 'In Progress',
    priority: 'Urgent',
    dueDate: '2025-03-25',
    description: 'Tạo REST Service phân trang, Spring Data JPA mapping, validate DTOs và tích hợp Liquibase DB migration.',
    prUrl: 'https://github.com/gimasys/onboarding-lab/pull/05',
    mentorFeedback: 'Đang triển khai đúng hướng, chú ý thêm Transactional annotation.',
    createdAt: '2025-03-15'
  },
  {
    id: 'TSK-003',
    title: '[Roadmap Module 3] Tích hợp Microservices, Kafka & Redis Cache',
    projectId: 'PRJ-00',
    projectName: 'Chương trình Đào tạo Thực tập sinh',
    assignedInternId: 'INT-001',
    assignedInternName: 'Nguyễn Văn An',
    mentorName: 'Trần Tuấn Anh',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '2025-04-10',
    description: 'Thiết kế giao tiếp async giữa các service thông qua Kafka broker và cache danh sách sản phẩm bằng Redis.',
    createdAt: '2025-03-20'
  },
  {
    id: 'TSK-101',
    title: 'Xây dựng API Refresh Token & JWT Authentication',
    projectId: 'PRJ-01',
    projectName: 'CRM Core Engine',
    assignedInternId: 'INT-001',
    assignedInternName: 'Nguyễn Văn An',
    mentorName: 'Trần Tuấn Anh',
    status: 'In Review',
    priority: 'High',
    dueDate: '2025-03-20',
    description: 'Viết Spring Security Filter xử lý JWT auth, lưu Refresh Token trong Redis với TTL 7 ngày.',
    prUrl: 'https://github.com/gimasys/crm-core/pull/42',
    mentorFeedback: 'Code sạch, đã cover các case expired token. Cần bổ sung thêm unit test cho Redis exception.',
    createdAt: '2025-03-15'
  },
  {
    id: 'TSK-102',
    title: 'Thiết kế Component DataTable phân trang & bộ lọc nâng cao',
    projectId: 'PRJ-02',
    projectName: 'Gimasys Portal Dashboard',
    assignedInternId: 'INT-002',
    assignedInternName: 'Lê Thị Bích',
    mentorName: 'Phạm Minh Đức',
    status: 'Done',
    priority: 'Medium',
    dueDate: '2025-03-18',
    description: 'Tạo Reusable DataTable hỗ trợ sort, filter theo cột, search và export Excel trong React UI.',
    prUrl: 'https://github.com/gimasys/portal-ui/pull/19',
    mentorFeedback: 'Giao diện cực mượt, responsive rất chuẩn!',
    createdAt: '2025-03-12'
  },
  {
    id: 'TSK-103',
    title: 'Tự động hóa Docker build & push image lên AWS ECR',
    projectId: 'PRJ-03',
    projectName: 'CI/CD Pipeline K8s',
    assignedInternId: 'INT-003',
    assignedInternName: 'Trần Minh Đức',
    mentorName: 'Hoàng Quốc Việt',
    status: 'In Progress',
    priority: 'Urgent',
    dueDate: '2025-03-22',
    description: 'Cấu hình GitHub Actions workflow để tự động hóa quá trình test, build Multi-arch Docker Image.',
    createdAt: '2025-03-16'
  },
  {
    id: 'TSK-104',
    title: 'Tạo Lightning Web Component (LWC) quản lý Leads',
    projectId: 'PRJ-04',
    projectName: 'Salesforce VPBank',
    assignedInternId: 'INT-004',
    assignedInternName: 'Phạm Hoàng Long',
    mentorName: 'Nguyễn Thị Hương',
    status: 'Done',
    priority: 'High',
    dueDate: '2025-03-17',
    description: 'Xây dựng màn hình xem danh sách Leads với khả năng gán chuyên viên tự động theo khu vực.',
    prUrl: 'https://github.com/gimasys/salesforce-vp/pull/8',
    mentorFeedback: 'Hoàn thành trước thời hạn 2 ngày, nghiệp vụ nắm rất chắc.',
    createdAt: '2025-03-10'
  },
  {
    id: 'TSK-105',
    title: 'Kết nối Gemini API SDK để tạo tính năng tóm tắt tài liệu',
    projectId: 'PRJ-05',
    projectName: 'Chatbot AI Báo cáo',
    assignedInternId: 'INT-005',
    assignedInternName: 'Vũ Thảo Nguyên',
    mentorName: 'Đỗ Hữu Nam',
    status: 'To Do',
    priority: 'High',
    dueDate: '2025-03-25',
    description: 'Sử dụng @google/genai với gemini-3.6-flash để đọc chuỗi văn bản báo cáo và xuất dạng tóm tắt JSON.',
    createdAt: '2025-03-18'
  },
  {
    id: 'TSK-106',
    title: 'Tối ưu hóa Query PostgreSQL bằng Indexing & Partitioning',
    projectId: 'PRJ-01',
    projectName: 'CRM Core Engine',
    assignedInternId: 'INT-001',
    assignedInternName: 'Nguyễn Văn An',
    mentorName: 'Trần Tuấn Anh',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '2025-03-24',
    description: 'Phân tích EXPLAIN ANALYZE các câu query tìm kiếm lịch sử giao dịch và thêm B-Tree Index thích hợp.',
    createdAt: '2025-03-18'
  }
];

export const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'REP-501',
    internId: 'INT-001',
    internName: 'Nguyễn Văn An',
    department: 'Java Back-End',
    date: '2025-03-19',
    completedToday: 'Hoàn thành việc tích hợp Redis Cache cho thông tin user profile và cập nhật Swagger API docs.',
    tomorrowPlan: 'Nghiên cứu EXPLAIN ANALYZE trên Postgres để tối ưu query bảng log giao dịch.',
    blockers: 'Không có blocker lớn. Cần mentor kiểm tra giúp quyền truy cập vào staging DB.',
    hoursLogged: 8,
    status: 'Approved',
    mentorComment: 'Báo cáo rất chi tiết, đã cấp quyền staging DB cho em rồi nhé.',
    rating: 5,
    createdAt: '2025-03-19T17:30:00Z'
  },
  {
    id: 'REP-502',
    internId: 'INT-002',
    internName: 'Lê Thị Bích',
    department: 'React Front-End',
    date: '2025-03-19',
    completedToday: 'Đã fix lỗi re-render ở bảng danh sách thực tập sinh và thêm animation chuyển trang bằng motion.',
    tomorrowPlan: 'Làm việc với API AI Assistant modal và tạo giao diện chat responsive.',
    blockers: 'Đang chờ API endpoint /api/ai/chat hoạt động ổn định.',
    hoursLogged: 8,
    status: 'Approved',
    mentorComment: 'Giao diện mượt mà, cố gắng phát huy!',
    rating: 5,
    createdAt: '2025-03-19T17:45:00Z'
  },
  {
    id: 'REP-503',
    internId: 'INT-003',
    internName: 'Trần Minh Đức',
    department: 'Cloud & DevOps',
    date: '2025-03-19',
    completedToday: 'Viết script Dockerfile multi-stage build giảm dung lượng image từ 1.2GB xuống 180MB.',
    tomorrowPlan: 'Đẩy image lên ECR và cấu hình Helm value file cho môi trường Staging.',
    blockers: 'Gặp vướng mắc về AWS IAM Policy khi push image từ GitHub runner.',
    hoursLogged: 7.5,
    status: 'Needs Revision',
    mentorComment: 'Hãy thêm IAM Role OIDC thay vì lưu Access Key trực tiếp trong GitHub Secret.',
    rating: 3,
    createdAt: '2025-03-19T18:00:00Z'
  },
  {
    id: 'REP-504',
    internId: 'INT-004',
    internName: 'Phạm Hoàng Long',
    department: 'Salesforce / ERP',
    date: '2025-03-19',
    completedToday: 'Sửa lỗi Apex Trigger khi cập nhật trạng thái Lead hàng loạt (Bulkification).',
    tomorrowPlan: 'Tạo bộ Test Class đảm bảo Code Coverage đạt >85%.',
    blockers: 'Không có.',
    hoursLogged: 8,
    status: 'Approved',
    mentorComment: 'Tốt lắm, luôn chú ý tới Bulkification trong Salesforce.',
    rating: 5,
    createdAt: '2025-03-19T17:15:00Z'
  }
];

export const TRAINING_MODULES: TrainingModule[] = [
  // Khóa học & Chứng chỉ CCA-F (Cloud Certified Associate - Foundation)
  {
    id: 'TRN-CCAF-01',
    track: 'Cloud & DevOps',
    weekNumber: 1,
    title: 'Khóa học CCA-F (Phần 1): Cloud Computing Fundamentals & Google Cloud Infrastructure',
    duration: '1 Tuần',
    description: 'Tổng quan điện toán đám mây, kiến trúc hạ tầng toàn cầu GCP (Regions/Zones), Resource Manager & Google Cloud Console.',
    keySkills: ['Cloud Architecture', 'GCP Core Services', 'Resource Hierarchy'],
    resourcesCount: 12,
    status: 'Completed',
    skilljarUrl: 'https://anthropic.skilljar.com/claude-for-cloud-architects',
    majorTasks: [
      {
        id: 'MJT-01',
        title: 'Task 1: Giới thiệu Điện toán đám mây & Tổng quan Hạ tầng Google Cloud',
        skilljarUrl: 'https://anthropic.skilljar.com/intro-to-cloud-computing',
        description: 'Nắm vững các khái niệm IaaS, PaaS, SaaS và cách GCP tổ chức Resource Hierarchy (Organization -> Folder -> Project).',
        completed: true,
        sections: [
          { id: 'SEC-101', title: 'Section 1.1: Khái niệm IaaS, PaaS, SaaS & Mô hình Đám mây', completed: true, estimatedMinutes: 20 },
          { id: 'SEC-102', title: 'Section 1.2: Kiến trúc Địa lý GCP: Regions, Zones & Edge Locations', completed: true, estimatedMinutes: 25 },
          { id: 'SEC-103', title: 'Section 1.3: Hướng dẫn Tạo Project & Cấu hình Resource Manager', completed: true, estimatedMinutes: 30 }
        ]
      },
      {
        id: 'MJT-02',
        title: 'Task 2: Quản trị Tài nguyên & Google Cloud Console Essentials',
        skilljarUrl: 'https://anthropic.skilljar.com/gcp-console-essentials',
        description: 'Thực hành thao tác trên Cloud Console, Cloud Shell và Google Cloud SDK (gcloud CLI).',
        completed: true,
        sections: [
          { id: 'SEC-201', title: 'Section 2.1: Bắt đầu với Google Cloud Console & Billing Account', completed: true, estimatedMinutes: 20 },
          { id: 'SEC-202', title: 'Section 2.2: Cài đặt và sử dụng gcloud CLI trong Terminal', completed: true, estimatedMinutes: 35 },
          { id: 'SEC-203', title: 'Section 2.3: Thực hành gcloud commands cho Project & Quản lý Nhãn (Labels)', completed: true, estimatedMinutes: 30 }
        ]
      }
    ]
  },
  {
    id: 'TRN-CCAF-02',
    track: 'Cloud & DevOps',
    weekNumber: 2,
    title: 'Khóa học CCA-F (Phần 2): Identity and Access Management (IAM), Cloud Security & VPC',
    duration: '1 Tuần',
    description: 'Cấu hình Service Accounts, Roles, VPC Firewall rules, Subnets, Cloud Audit Logs và nguyên tắc Least Privilege.',
    keySkills: ['IAM Roles', 'VPC Networking', 'Cloud Security'],
    resourcesCount: 10,
    status: 'In Progress',
    skilljarUrl: 'https://anthropic.skilljar.com/gcp-iam-and-security',
    majorTasks: [
      {
        id: 'MJT-03',
        title: 'Task 1: Phân quyền An toàn với Identity & Access Management (IAM)',
        skilljarUrl: 'https://anthropic.skilljar.com/claude-iam-security-deepdive',
        description: 'Tìm hiểu Primitive Roles, Predefined Roles, Custom Roles & Service Account Key Management.',
        completed: true,
        sections: [
          { id: 'SEC-301', title: 'Section 1.1: Phân biệt Primitive, Predefined và Custom Roles', completed: true, estimatedMinutes: 25 },
          { id: 'SEC-302', title: 'Section 1.2: Cấu hình Service Accounts cho Ứng dụng Backend', completed: true, estimatedMinutes: 30 },
          { id: 'SEC-303', title: 'Section 1.3: Thực hành gcloud iam policy binding', completed: true, estimatedMinutes: 20 }
        ]
      },
      {
        id: 'MJT-04',
        title: 'Task 2: Thiết kế Mạng Ảo Virtual Private Cloud (VPC) & Firewall Rules',
        skilljarUrl: 'https://anthropic.skilljar.com/vpc-network-architecture',
        description: 'Tạo Custom Subnets, cấu hình Ingress/Egress Firewall Rules, Routes & Cloud NAT.',
        completed: false,
        sections: [
          { id: 'SEC-401', title: 'Section 2.1: Tổng quan VPC Network, Subnets & CIDR Notation', completed: true, estimatedMinutes: 30 },
          { id: 'SEC-402', title: 'Section 2.2: Cấu hình VPC Firewall Rules ngăn chặn truy cập công cộng', completed: false, estimatedMinutes: 40 },
          { id: 'SEC-403', title: 'Section 2.3: Thiết lập Private Google Access & Cloud NAT', completed: false, estimatedMinutes: 35 }
        ]
      }
    ]
  },
  {
    id: 'TRN-CCAF-03',
    track: 'Cloud & DevOps',
    weekNumber: 3,
    title: 'Khóa học CCA-F (Phần 3): Compute Engine, Kubernetes (GKE) & Cloud Storage',
    duration: '1 Tuần',
    description: 'Tạo & quản lý VM instances, Autoscaling, Kubernetes Engine cluster, Cloud Storage Buckets và Cloud SQL.',
    keySkills: ['Compute Engine', 'GKE Containers', 'Cloud Storage & SQL'],
    resourcesCount: 15,
    status: 'Not Started',
    skilljarUrl: 'https://anthropic.skilljar.com/gcp-compute-and-containers',
    majorTasks: [
      {
        id: 'MJT-05',
        title: 'Task 1: Triển khai Máy chủ Compute Engine & Managed Instance Groups',
        skilljarUrl: 'https://anthropic.skilljar.com/compute-engine-mastery',
        description: 'Khởi tạo VM, cấu hình Disks, Startup scripts, Instance Templates & Autoscaling Policy.',
        completed: false,
        sections: [
          { id: 'SEC-501', title: 'Section 1.1: Khởi tạo VM Instance với Custom Machine Type', completed: false, estimatedMinutes: 25 },
          { id: 'SEC-502', title: 'Section 1.2: Cấu hình Disk Snapshot & Persistent Disk Storage', completed: false, estimatedMinutes: 30 },
          { id: 'SEC-503', title: 'Section 1.3: Cấu hình Autoscaling MIG & HTTP Load Balancer', completed: false, estimatedMinutes: 45 }
        ]
      },
      {
        id: 'MJT-06',
        title: 'Task 2: Quản lý Container với Google Kubernetes Engine (GKE)',
        skilljarUrl: 'https://anthropic.skilljar.com/gke-kubernetes-fundamentals',
        description: 'Tạo GKE Cluster, Deployments, Pods, Services & ConfigMaps.',
        completed: false,
        sections: [
          { id: 'SEC-601', title: 'Section 2.1: Kiến trúc Cluster Kubernetes & GKE Autopilot', completed: false, estimatedMinutes: 30 },
          { id: 'SEC-602', title: 'Section 2.2: Viết YAML Manifest cho Deployment & ClusterIP Service', completed: false, estimatedMinutes: 40 }
        ]
      }
    ]
  },
  {
    id: 'TRN-CCAF-04',
    track: 'Cloud & DevOps',
    weekNumber: 4,
    title: 'Khóa học CCA-F (Phần 4): Luyện Đề Thi Mẫu & Thực Hành Lab Mô Phỏng (Mock Exam CCA-F)',
    duration: '1 Tuần',
    description: 'Thực hành 100% Qwiklabs scenarios, ôn luyện 150 câu hỏi trắc nghiệm chuẩn quốc tế CCA-F có giải thích chi tiết.',
    keySkills: ['Qwiklabs Hands-on', 'Mock Exam CCA-F', 'Exam Prep Strategy'],
    resourcesCount: 20,
    status: 'Not Started',
    skilljarUrl: 'https://anthropic.skilljar.com/cca-f-mock-exam-prep',
    majorTasks: [
      {
        id: 'MJT-07',
        title: 'Task 1: Chuỗi Thực hành Hands-on Qwiklabs Mô phỏng Đề Thi CCA-F',
        skilljarUrl: 'https://anthropic.skilljar.com/qwiklabs-exam-challenge',
        description: 'Hoàn thành 5 bài Lab Challenge giới hạn thời gian trên hệ thống Qwiklabs.',
        completed: false,
        sections: [
          { id: 'SEC-701', title: 'Section 1.1: Lab Challenge 1: Deploy Secure Web App on GCP', completed: false, estimatedMinutes: 60 },
          { id: 'SEC-702', title: 'Section 1.2: Lab Challenge 2: Configure IAM & Cloud Storage Access', completed: false, estimatedMinutes: 60 }
        ]
      },
      {
        id: 'MJT-08',
        title: 'Task 2: Luyện 150 Câu Trắc Nghiệm Thi Thử CCA-F Official',
        skilljarUrl: 'https://anthropic.skilljar.com/cca-f-150-questions-practice',
        description: 'Giải các bộ câu hỏi tình huống thực tế, giải thích chi tiết lý do chọn đáp án.',
        completed: false,
        sections: [
          { id: 'SEC-801', title: 'Section 2.1: Bộ đề Mock Exam #1 (50 câu trắc nghiệm)', completed: false, estimatedMinutes: 45 },
          { id: 'SEC-802', title: 'Section 2.2: Bộ đề Mock Exam #2 (50 câu trắc nghiệm)', completed: false, estimatedMinutes: 45 },
          { id: 'SEC-803', title: 'Section 2.3: Bộ đề Final Challenge (50 câu trắc nghiệm tổng hợp)', completed: false, estimatedMinutes: 60 }
        ]
      }
    ]
  },
  {
    id: 'TRN-101',
    track: 'Java Back-End',
    weekNumber: 1,
    title: 'Module 1: Git Flow, Clean Code & Anthropic Claude 101 for Java Developers',
    duration: '1 Tuần',
    description: 'Quy chuẩn Git tại Gimasys, Naming convention, OOP Principles, Collection Framework & Anthropic Claude Integration.',
    keySkills: ['Git branching strategy', 'Design Patterns', 'Claude SDK for Java'],
    resourcesCount: 5,
    status: 'Completed',
    skilljarUrl: 'https://anthropic.skilljar.com/claude-101',
    majorTasks: [
      {
        id: 'MJT-J01',
        title: 'Task 1: Claude 101: Introduction to Claude & Anthropic Ecosystem',
        skilljarUrl: 'https://anthropic.skilljar.com/claude-101',
        description: 'Tổng quan hệ sinh thái Anthropic Claude, Claude Workbench và kiến trúc LLM.',
        completed: true,
        sections: [
          { id: 'SEC-J101', title: 'Section 1.1: Tổng quan Model Claude 3.5 Sonnet & Haiku', completed: true, estimatedMinutes: 20 },
          { id: 'SEC-J102', title: 'Section 1.2: Sử dụng Anthropic Console & Claude Workbench', completed: true, estimatedMinutes: 25 },
          { id: 'SEC-J103', title: 'Section 1.3: Tích hợp Java Spring Boot với Anthropic REST Client', completed: true, estimatedMinutes: 35 }
        ]
      },
      {
        id: 'MJT-J02',
        title: 'Task 2: Building Java Microservices with Anthropic API',
        skilljarUrl: 'https://anthropic.skilljar.com/building-with-the-claude-api',
        description: 'Thực hành gọi Messages API, Streaming response và xử lý JSON schema trong Java.',
        completed: true,
        sections: [
          { id: 'SEC-J201', title: 'Section 2.1: Cấu hình Anthropic API Key & Spring WebClient', completed: true, estimatedMinutes: 25 },
          { id: 'SEC-J202', title: 'Section 2.2: Xử lý Server-Sent Events (SSE) Streaming trong Spring Boot', completed: true, estimatedMinutes: 40 }
        ]
      }
    ]
  },
  {
    id: 'TRN-102',
    track: 'Java Back-End',
    weekNumber: 2,
    title: 'Module 2: Spring Boot Architecture & Spring Data JPA',
    duration: '2 Tuần',
    description: 'Xây dựng RESTful Services, JPA/Hibernate mapping, Liquibase migration & Transaction Management.',
    keySkills: ['Spring Boot 3', 'Spring Security', 'PostgreSQL'],
    resourcesCount: 8,
    status: 'In Progress',
    skilljarUrl: 'https://anthropic.skilljar.com/claude-prompt-engineering',
    majorTasks: [
      {
        id: 'MJT-J03',
        title: 'Task 1: Prompt Engineering Interactive Tutorial for Backend Architects',
        skilljarUrl: 'https://anthropic.skilljar.com/prompt-engineering-interactive-tutorial',
        description: 'Tối ưu hóa Prompt System, XML Tags & Few-shot learning cho hệ thống xử lý tự động.',
        completed: true,
        sections: [
          { id: 'SEC-J301', title: 'Section 1.1: Cấu trúc System Prompt chuẩn Enterprise', completed: true, estimatedMinutes: 30 },
          { id: 'SEC-J302', title: 'Section 1.2: Kỹ thuật Chain-of-Thought trong sinh dữ liệu JSON', completed: false, estimatedMinutes: 35 }
        ]
      }
    ]
  },
  {
    id: 'TRN-103',
    track: 'Java Back-End',
    weekNumber: 3,
    title: 'Module 3: Microservices, Message Broker & Redis Caching',
    duration: '2 Tuần',
    description: 'Thiết kế hệ thống phân tán, giao tiếp async bằng Apache Kafka & Caching tầng dịch vụ với Redis.',
    keySkills: ['Kafka', 'Redis', 'Spring Cloud Gateway'],
    resourcesCount: 6,
    status: 'Not Started',
    skilljarUrl: 'https://anthropic.skilljar.com/claude-tool-use',
    majorTasks: [
      {
        id: 'MJT-J04',
        title: 'Task 1: Advanced Tool Use & Function Calling Masterclass',
        skilljarUrl: 'https://anthropic.skilljar.com/claude-tool-use',
        description: 'Định nghĩa Function Schema, cho phép Claude tự động gọi Database queries & REST APIs.',
        completed: false,
        sections: [
          { id: 'SEC-J401', title: 'Section 1.1: Định nghĩa Tool Definition với JSON Schema', completed: false, estimatedMinutes: 30 },
          { id: 'SEC-J402', title: 'Section 1.2: Vòng lặp Orchestration Loop trong Java Spring', completed: false, estimatedMinutes: 45 }
        ]
      }
    ]
  },
  {
    id: 'TRN-201',
    track: 'React Front-End',
    weekNumber: 1,
    title: 'Module 1: Modern React 19, TypeScript & Anthropic Web Integration',
    duration: '1 Tuần',
    description: 'Nắm vững React Hooks, Custom Hooks, Strict TypeScript Type Safety và Utility-first CSS với Tailwind.',
    keySkills: ['React 19', 'TypeScript', 'TailwindCSS'],
    resourcesCount: 7,
    status: 'Completed',
    skilljarUrl: 'https://anthropic.skilljar.com/building-with-the-claude-api',
    majorTasks: [
      {
        id: 'MJT-R01',
        title: 'Task 1: Building Interactive AI Web Apps with Claude API & React',
        skilljarUrl: 'https://anthropic.skilljar.com/building-with-the-claude-api',
        description: 'Xây dựng UI Chatbot & Streaming Response trong React 19.',
        completed: true,
        sections: [
          { id: 'SEC-R101', title: 'Section 1.1: Quản lý State cho Streaming Response trong React', completed: true, estimatedMinutes: 25 },
          { id: 'SEC-R102', title: 'Section 1.2: Xây dựng UI Markdown Viewer & Code Highlighting', completed: true, estimatedMinutes: 30 }
        ]
      }
    ]
  },
  {
    id: 'TRN-202',
    track: 'React Front-End',
    weekNumber: 2,
    title: 'Module 2: Advanced State Management & Design Systems',
    duration: '2 Tuần',
    description: 'Quản lý state phức tạp, tối ưu hóa Re-render, Framer Motion animations và UI Accessibility.',
    keySkills: ['Zustand/Redux', 'Performance Tuning', 'Framer Motion'],
    resourcesCount: 9,
    status: 'In Progress'
  }
];

export const DOCUMENT_RESOURCES: DocumentResource[] = [
  {
    id: 'DOC-CCAF-01',
    title: 'Bộ Giáo Trình Đào Tạo Chứng Chỉ CCA-F (Cloud Certified Associate - Foundation) 2025',
    category: 'CCA-F Certificate',
    author: 'Gimasys Cloud Academy & Google Cloud Mentors',
    updatedAt: '2025-02-20',
    fileType: 'PDF',
    fileSize: '12.8 MB',
    downloadCount: 380,
    description: 'Giáo trình đào tạo chính thức chương trình CCA-F gồm 4 module lý thuyết, sơ đồ kiến trúc GCP và hướng dẫn đăng ký thi.',
    tags: ['CCA-F', 'Google Cloud', 'Certification', 'GCP Core']
  },
  {
    id: 'DOC-CCAF-02',
    title: 'Bộ 150 Câu Hỏi Ôn Luyện & Đề Thi Mẫu Mock Exam CCA-F (Kèm Đáp Án Chi Tiết)',
    category: 'CCA-F Certificate',
    author: 'Chuyên gia Đào tạo Gimasys',
    updatedAt: '2025-03-01',
    fileType: 'PDF',
    fileSize: '4.5 MB',
    downloadCount: 520,
    description: 'Đề thi trắc nghiệm mô phỏng kỳ thi chứng chỉ CCA-F thực tế. Giải thích chi tiết từng đáp án đúng/sai.',
    tags: ['CCA-F', 'Mock Exam', 'Quiz', 'GCP Exam']
  },
  {
    id: 'DOC-CCAF-03',
    title: 'Sổ Tay Hướng Dẫn Thực Hành Qwiklabs Hands-on Labs Cho Học Viên CCA-F',
    category: 'CCA-F Certificate',
    author: 'Trần Tuấn Anh - Technical Lead',
    updatedAt: '2025-03-05',
    fileType: 'DOCX',
    fileSize: '6.2 MB',
    downloadCount: 290,
    description: 'Tài liệu từng bước (step-by-step) thực hành lab trên Google Cloud Console: IAM, VPC, Compute Engine & GKE.',
    tags: ['Qwiklabs', 'Hands-on', 'CCA-F', 'Lab Guide']
  },
  {
    id: 'DOC-01',
    title: 'Quy chuẩn Viết Code & Git Workflow Gimasys 2025',
    category: 'Coding Standard',
    author: 'Trần Tuấn Anh - Technical Board',
    updatedAt: '2025-01-10',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    downloadCount: 142,
    description: 'Tài liệu hướng dẫn quy chuẩn đặt tên, commit message, pull request review và branching strategy.',
    tags: ['Git', 'Clean Code', 'Workflow']
  },
  {
    id: 'DOC-02',
    title: 'Sổ tay Thực tập sinh Gimasys & Quy trình Onboarding',
    category: 'Onboarding',
    author: 'Phạm Thu Trang - HR Department',
    updatedAt: '2025-01-02',
    fileType: 'SLIDE',
    fileSize: '5.1 MB',
    downloadCount: 210,
    description: 'Giới thiệu về Gimasys, các phòng ban, chính sách đãi ngộ, văn hóa làm việc và lịch báo cáo công việc.',
    tags: ['Onboarding', 'Văn hóa', 'HR']
  },
  {
    id: 'DOC-03',
    title: 'Tài liệu Thiết kế Kiến trúc Enterprise Spring Boot Microservices',
    category: 'Architecture',
    author: 'Nguyễn Minh Tuấn - Chief Architect',
    updatedAt: '2025-02-14',
    fileType: 'DOCX',
    fileSize: '3.8 MB',
    downloadCount: 98,
    description: 'Mẫu thiết kế kiến trúc hệ thống chuẩn cho các dự án ngân hàng và bảo hiểm tại Gimasys.',
    tags: ['Spring Boot', 'Microservices', 'Architecture']
  },
  {
    id: 'DOC-04',
    title: 'Template Slide Báo cáo Bảo vệ Thực tập Gimasys',
    category: 'Template',
    author: 'Training Committee',
    updatedAt: '2025-02-28',
    fileType: 'SLIDE',
    fileSize: '8.5 MB',
    downloadCount: 175,
    description: 'Mẫu slide thuyết trình chính thức cho buổi bảo vệ kết quả thực tập cuối kỳ trước Hội đồng.',
    tags: ['Presentation', 'Graduation', 'Template']
  }
];

export const SYSTEM_STATS: SystemStats = {
  totalInterns: 18,
  activeInterns: 15,
  totalMentors: 8,
  activeProjects: 5,
  reportSubmissionRate: 95.8,
  avgPerformanceScore: 8.9,
  completedTasksThisWeek: 28,
  pendingReviewsCount: 4
};

export const DEMO_AUTH_USERS: AuthUser[] = [
  {
    id: 'USR-ADMIN',
    name: 'Phạm Thu Trang',
    email: 'trang.pham@gimasys.vn',
    role: 'ADMIN',
    roleTitle: 'Trưởng phòng Nhân sự & Đào tạo (HR Manager)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'USR-MENTOR',
    name: 'Trần Tuấn Anh',
    email: 'anh.tran@gimasys.vn',
    role: 'MENTOR',
    department: 'Java Back-End',
    roleTitle: 'Senior Software Architect / Lead Mentor',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'USR-LEAD',
    name: 'Phạm Minh Đức',
    email: 'duc.pham@gimasys.vn',
    role: 'PROJECT_LEAD',
    department: 'React Front-End',
    roleTitle: 'Project Tech Lead (ERP Modernization)',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'USR-INTERN-1',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@gimasys.vn',
    role: 'INTERN',
    department: 'Java Back-End',
    roleTitle: 'Thực tập sinh Java Spring Microservices',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    internId: 'INT-001'
  },
  {
    id: 'USR-INTERN-2',
    name: 'Lê Thị Bích',
    email: 'bich.le@gimasys.vn',
    role: 'INTERN',
    department: 'React Front-End',
    roleTitle: 'Thực tập sinh Frontend React & Next.js',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    internId: 'INT-002'
  }
];

