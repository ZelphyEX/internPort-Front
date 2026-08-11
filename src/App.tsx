import React, { useState, useEffect } from 'react';
import { UserRole, Intern, Project, TaskItem, DailyReport, TaskStatus, AuthUser, DocumentResource, Group } from './types';
import { GraduationCap } from 'lucide-react';
import {
  INITIAL_INTERNS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_DAILY_REPORTS,
  DOCUMENT_RESOURCES,
  DEMO_AUTH_USERS
} from './data/mockData';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginView } from './components/LoginView';
import { GroupSelectionView } from './components/GroupSelectionView';
import { DashboardView } from './components/DashboardView';
import { InternsView } from './components/InternsView';
import { MentorsView } from './components/MentorsView';
import { ProjectsView } from './components/ProjectsView';
import { DailyReportsView } from './components/DailyReportsView';
import { RoadmapView } from './components/RoadmapView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SettingsView } from './components/SettingsView';
import { MockExamView } from './components/MockExamView';

import { InternDetailModal } from './components/InternDetailModal';
import { AddReportModal } from './components/AddReportModal';
import { AIAssistantModal } from './components/AIAssistantModal';

// Lớp gọi REST API theo đặc tả (JWT, tự refresh khi 401). Xem src/services/api.ts.
// Toàn bộ handler dưới đây theo mẫu "online-first, fallback localStorage":
// nếu đã đăng nhập thật (có access_token) thì gọi API; lỗi/ngoại tuyến thì vẫn
// chạy tại chỗ để bản demo không gãy.
import {
  tokenStore,
  authApi,
  usersApi,
  roleRequestsApi,
  groupsApi,
  documentsApi,
  projectsApi,
  tasksApi,
  dailyReportsApi,
  ApiError,
  setUnauthorizedHandler,
  isSessionExpired,
  endSession,
} from './services/api';
import {
  feFileTypeToApiType,
  apiUserToAuthUser,
  apiUserToIntern,
  apiGroupToGroup,
  apiDocumentToResource,
  apiProjectToProject,
  apiTaskToTaskItem,
  apiDailyReportToReport,
} from './services/mappers';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    // Phiên chỉ sống 1 ngày. Dọn ngay lúc khởi tạo state, nếu không giao diện
    // portal sẽ loé lên một nhịp rồi mới bị đá về màn đăng nhập.
    if (isSessionExpired()) {
      endSession();
      localStorage.removeItem('gimasys_current_user');
      return null;
    }
    const savedUser = localStorage.getItem('gimasys_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser ? currentUser.role : 'ADMIN';
  });

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');

  // Group State (màn hình chọn/tạo/tham gia nhóm sau khi đăng nhập)
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('gimasys_groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Khi phiên hết hạn (refresh token cũng hỏng), API sẽ gọi callback này để
  // đưa người dùng về màn đăng nhập.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
      localStorage.removeItem('gimasys_current_user');
    });
  }, []);

  // Phiên hết hạn theo ĐỒNG HỒ, không theo hoạt động: một tab để mở qua đêm phải
  // tự về màn đăng nhập, chứ không hiện giao diện như thể vẫn còn đăng nhập rồi
  // đợi thao tác đầu tiên mới báo lỗi. Kiểm tra mỗi phút + mỗi lần quay lại cửa sổ.
  useEffect(() => {
    const checkSession = () => {
      if (tokenStore.isAuthenticated() && isSessionExpired()) endSession();
    };
    checkSession();
    const timer = window.setInterval(checkSession, 60_000);
    window.addEventListener('focus', checkSession);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', checkSession);
    };
  }, []);

  // Vai trò dùng để dựng giao diện phải lấy từ SERVER, không tin localStorage.
  // `gimasys_current_user` nằm trong localStorage nên ai cũng sửa được bằng DevTools
  // (đổi role thành ADMIN để mở các màn quản trị). Backend vẫn chặn bằng 403 nên
  // không lộ dữ liệu thật, nhưng UI sẽ hiển thị nhầm dữ liệu demo như thể là thật.
  // Mỗi lần mở app, nếu còn phiên đăng nhập thật thì đồng bộ lại từ GET /auth/me.
  // Đồng bộ lại phiên từ server. Gọi khi mở app, và gọi lại sau khi vai trò thật
  // vừa đổi (Mentor tự hạ xuống Thực tập sinh trong Cài đặt) để giao diện khớp ngay.
  const refreshSession = React.useCallback(() => {
    if (!tokenStore.isAuthenticated()) return;
    authApi
      .me()
      .then((apiUser) => {
        const fresh = apiUserToAuthUser(apiUser);
        setCurrentUser(fresh);
        setCurrentRole(fresh.role);
        localStorage.setItem('gimasys_current_user', JSON.stringify(fresh));
      })
      .catch(() => {/* lỗi mạng: giữ phiên cục bộ; token hỏng đã có handler 401 ở trên */});
  }, []);

  useEffect(refreshSession, [refreshSession]);

  useEffect(() => {
    localStorage.setItem('gimasys_groups', JSON.stringify(groups));
  }, [groups]);


  // Tải lại danh sách nhóm từ server (dùng sau khi tạo nhóm / thêm / gỡ thành viên,
  // để số thành viên hiển thị luôn khớp với dữ liệu thật).
  const reloadGroups = () => {
    if (!tokenStore.isAuthenticated() || currentRole === 'INTERN') return;
    groupsApi
      .list({ size: 100 })
      .then(res => setGroups(res.items.map(g => apiGroupToGroup(g))))
      .catch(() => {/* lỗi mạng: giữ nguyên danh sách đang có */});
  };

  // Tạo nhóm mới (quyền MENTOR trở lên).
  // Online: POST /groups rồi tải lại danh sách từ server — server là nguồn sự thật,
  // nhờ vậy nhóm mới hiển thị ngay và vẫn còn sau khi F5.
  // Offline/demo: tạo bản ghi cục bộ để bản demo không gãy.
  const handleCreateGroup = async (name: string, cohort: string) => {
    if (!currentUser) return;

    if (tokenStore.isAuthenticated()) {
      try {
        await groupsApi.create({ name, cohort: cohort || String(new Date().getFullYear()) });
        reloadGroups();
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Tạo nhóm thất bại.');
          return;
        }
        // Lỗi mạng: rơi xuống tạo nhóm cục bộ bên dưới.
      }
    }

    const newGroup: Group = {
      id: `GRP-${Date.now().toString().slice(-8)}`,
      name,
      cohort,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [],
      memberCount: 0
    };
    setGroups(prev => [...prev, newGroup]);
  };

  // Đổi vai trò ĐANG XEM (chỉ Admin dùng, để kiểm tra giao diện của Mentor/Intern).
  //
  // Trước đây hàm này ghi đè luôn `currentUser.role` và lưu xuống localStorage. Hai hậu quả:
  //   1. Admin bấm xem giao diện "Intern" là bị kẹt — ô đổi vai trò chỉ hiện với Admin,
  //      mà vai trò đã bị ghi thành INTERN nên không còn đường quay lại (phải đăng xuất).
  //   2. Vai trò thật của phiên đăng nhập bị sửa ở phía client và còn được lưu lại,
  //      lệch hẳn với vai trò trong JWT mà backend dùng để phân quyền.
  // Nay chỉ đổi `currentRole` (lớp hiển thị); `currentUser.role` luôn là vai trò thật
  // do server trả về.
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('gimasys_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    // Thu hồi refresh token phía server (nếu đang đăng nhập bằng backend thật).
    // Không chặn UI: dù API lỗi vẫn xóa phiên cục bộ và về màn đăng nhập.
    if (tokenStore.isAuthenticated()) {
      authApi.logout().catch(() => {/* offline: bỏ qua, vẫn xóa cục bộ */});
    }
    setCurrentUser(null);
    localStorage.removeItem('gimasys_current_user');
  };

  // Cập nhật Tên & Ảnh đại diện của tài khoản đang đăng nhập.
  // Online: PUT /users/me (đặc tả). Offline/demo: chỉ lưu cục bộ.
  const handleUpdateProfile = async (updates: { name?: string; avatar?: string }) => {
    if (!currentUser) return;
    if (tokenStore.isAuthenticated()) {
      try {
        const apiUser = await authApi.updateProfile({
          full_name: updates.name,
          avatar_url: updates.avatar,
        });
        const merged = apiUserToAuthUser(apiUser);
        setCurrentUser(merged);
        setCurrentRole(merged.role);
        localStorage.setItem('gimasys_current_user', JSON.stringify(merged));
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Cập nhật hồ sơ thất bại.');
          return;
        }
        // Lỗi mạng: rơi xuống nhánh cục bộ bên dưới.
      }
    }
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('gimasys_current_user', JSON.stringify(updatedUser));
  };

  // Đổi mật khẩu. Online: POST /auth/change-password (đặc tả cần cả mật khẩu cũ).
  // Offline/demo: lưu cục bộ theo email để đối chiếu khi đăng nhập lại.
  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser) return;
    if (tokenStore.isAuthenticated()) {
      try {
        await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Đổi mật khẩu thất bại.');
          return;
        }
      }
    }
    localStorage.setItem(`gimasys_pwd_${currentUser.email.toLowerCase()}`, newPassword);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (tokenStore.isAuthenticated()) {
      try {
        await authApi.deleteAccount();
        alert('Tài khoản của bạn đã được xóa thành công.');
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Xóa tài khoản thất bại.');
          return;
        }
      }
    } else {
      localStorage.removeItem(`gimasys_pwd_${currentUser.email.toLowerCase()}`);
      alert('Tài khoản của bạn đã được xóa cục bộ.');
    }
    setCurrentUser(null);
    localStorage.removeItem('gimasys_current_user');
  };

  // Persistent States
  const [interns, setInterns] = useState<Intern[]>(() => {
    const saved = localStorage.getItem('gimasys_interns');
    return saved ? JSON.parse(saved) : INITIAL_INTERNS;
  });

  // Mentor thật lấy từ `GET /users?role=MENTOR` (quyền MENTOR trở lên). Không lưu
  // localStorage vì đây chỉ là dữ liệu tra cứu cho các dropdown chọn mentor.
  const [mentors, setMentors] = useState<AuthUser[]>([]);
  // Hai loại việc chờ Admin xử lý ở tab "Mentor": tài khoản Mentor mới chờ duyệt,
  // và yêu cầu chuyển vai trò của Thực tập sinh. Badge ở thanh bên hiện tổng hai số.
  const [pendingMentorCount, setPendingMentorCount] = useState(0);
  const [pendingRoleRequestCount, setPendingRoleRequestCount] = useState(0);

  // Chỉ cần con số nên gọi size=1 và đọc `total` — không tải cả danh sách.
  const reloadRoleRequestCount = React.useCallback(() => {
    if (!tokenStore.isAuthenticated()) return;
    roleRequestsApi
      .list({ size: 1, status: 'PENDING' })
      .then((res) => setPendingRoleRequestCount(res.total))
      .catch(() => {/* không phải Admin (403) hoặc offline: bỏ qua badge */});
  }, []);

  const reloadPendingMentorCount = React.useCallback(() => {
    if (!tokenStore.isAuthenticated()) return;
    usersApi
      .list({ size: 100, role: 'MENTOR' })
      .then((res) =>
        setPendingMentorCount(res.items.filter((u) => u.status === 'PENDING').length)
      )
      .catch(() => {/* offline: giữ số đang hiển thị */});
  }, []);

  // Gọi sau khi Admin duyệt/từ chối ở tab Mentor để badge khớp lại ngay.
  const reloadAdminQueues = React.useCallback(() => {
    reloadPendingMentorCount();
    reloadRoleRequestCount();
  }, [reloadPendingMentorCount, reloadRoleRequestCount]);

  // Tham chiếu tới interns mới nhất để tra cứu department khi map Daily Report,
  // không đưa vào dependency của useEffect tải dữ liệu (tránh gọi lại API liên tục).
  const internsRef = React.useRef<Intern[]>(interns);
  useEffect(() => {
    internsRef.current = interns;
  }, [interns]);

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('gimasys_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('gimasys_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [reports, setReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('gimasys_reports');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_REPORTS;
  });

  const [documents, setDocuments] = useState<DocumentResource[]>(() => {
    const saved = localStorage.getItem('gimasys_documents');
    return saved ? JSON.parse(saved) : DOCUMENT_RESOURCES;
  });

  // Modal States
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isGroupScreenOpen, setIsGroupScreenOpen] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('gimasys_interns', JSON.stringify(interns));
  }, [interns]);

  useEffect(() => {
    localStorage.setItem('gimasys_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('gimasys_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('gimasys_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('gimasys_documents', JSON.stringify(documents));
  }, [documents]);

  // Tải danh sách thật từ backend mỗi khi đã đăng nhập thật (có access_token).
  // Online-first: thành công -> thay hẳn state cục bộ bằng dữ liệu server (server là
  // nguồn sự thật khi online). Lỗi mạng/API -> im lặng giữ nguyên mock/local, không
  // chặn UI hay hiện alert (khác các handler mutation vốn báo lỗi cho người dùng).
  // usersApi/groupsApi yêu cầu quyền MENTOR trở lên (đặc tả), documentsApi thì mở cho INTERN.
  // size tối đa backend cho phép là 100 (vượt quá -> 422); trang đầu là đủ cho quy mô hiện tại,
  // nếu dữ liệu vượt 100 bản ghi cần làm phân trang thật (chưa có trong UI hiện tại).
  useEffect(() => {
    if (!currentUser || !tokenStore.isAuthenticated()) return;

    documentsApi
      .list({ size: 100 })
      .then((res) => setDocuments(res.items.map(apiDocumentToResource)))
      .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});

    if (currentRole !== 'INTERN') {
      usersApi
        .list({ size: 100, role: 'INTERN' })
        .then((res) => setInterns(res.items.map(apiUserToIntern)))
        .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});

      groupsApi
        .list({ size: 100 })
        .then((res) => setGroups(res.items.map((g) => apiGroupToGroup(g))))
        .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});

      // Mentor thật — dùng cho dropdown chọn mentor khi giao việc/dự án, đồng thời
      // đếm số Mentor đang chờ Admin duyệt để hiện badge ở thanh bên.
      usersApi
        .list({ size: 100, role: 'MENTOR' })
        .then((res) => {
          setMentors(
            res.items.filter((u) => u.status === 'ACTIVE').map(apiUserToAuthUser)
          );
          setPendingMentorCount(res.items.filter((u) => u.status === 'PENDING').length);
        })
        .catch(() => {/* offline: allMentors sẽ rơi về danh sách demo */});
    }

    // Hàng đợi yêu cầu chuyển vai trò — chỉ ADMIN được xem (`GET /role-requests`),
    // và phải dùng vai trò THẬT: Admin đang xem thử giao diện Intern vẫn cần badge.
    if (currentUser.role === 'ADMIN') {
      reloadRoleRequestCount();
    }

    // Projects/Tasks/Daily Reports: mở cho mọi role đã đăng nhập — INTERN tự động
    // chỉ thấy dữ liệu của chính mình phía server (theo mô tả GET /projects), không
    // cần FE tự lọc thêm.
    projectsApi
      .list({ size: 100 })
      .then((res) => setProjects(res.items.map(apiProjectToProject)))
      .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});

    tasksApi
      .list({ size: 100 })
      .then((res) => setTasks(res.items.map(apiTaskToTaskItem)))
      .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});

    dailyReportsApi
      .list({ size: 100 })
      .then((res) =>
        setReports(
          res.items.map((r) => {
            const dept = internsRef.current.find((i) => i.id === String(r.intern_id))?.department;
            return apiDailyReportToReport(r, dept);
          })
        )
      )
      .catch(() => {/* offline hoặc lỗi API: giữ nguyên dữ liệu mock/local */});
  }, [currentUser, currentRole]);

  // Handler Functions
  // Đã bỏ `handleAddIntern`: tài khoản Thực tập sinh chỉ sinh ra từ luồng Đăng nhập
  // bằng Google, không tạo tay từ portal nữa.

  // true nếu id là số nguyên do backend cấp (mock data dùng id dạng "TSK-001", "PRJ-00"...).
  const isBackendId = (id: string) => {
    const n = Number(id);
    return Number.isInteger(n) && String(n) === id;
  };

  // Giao Task mới. Online: POST /tasks (đặc tả), rồi đồng bộ id thật từ server về
  // client để các thao tác sau (sửa/xoá) gọi đúng endpoint. Lỗi mạng: thêm cục bộ.
  const handleAddTask = async (newTask: TaskItem) => {
    if (tokenStore.isAuthenticated()) {
      try {
        const created = await tasksApi.create({
          title: newTask.title,
          project_id: isBackendId(newTask.projectId) ? Number(newTask.projectId) : undefined,
          assigned_intern_id: isBackendId(newTask.assignedInternId) ? Number(newTask.assignedInternId) : undefined,
          status: newTask.status,
          priority: newTask.priority,
          due_date: newTask.dueDate || undefined,
          description: newTask.description || undefined,
        });
        setTasks(prev => [{ ...newTask, id: String(created.id) }, ...prev]);
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Giao task thất bại.');
          return;
        }
        // Lỗi mạng: rơi xuống nhánh cục bộ.
      }
    }
    setTasks(prev => [newTask, ...prev]);
  };

  // Tải lại danh sách dự án (dùng sau khi tạo dự án / đổi thành viên để `membersCount`
  // và tiến độ hiển thị khớp dữ liệu thật trên server).
  const reloadProjects = () => {
    if (!tokenStore.isAuthenticated()) return;
    projectsApi
      .list({ size: 100 })
      .then((res) => setProjects(res.items.map(apiProjectToProject)))
      .catch(() => {/* lỗi mạng: giữ nguyên danh sách đang có */});
  };

  // Tạo dự án mới (quyền MENTOR). `code` là duy nhất -> backend trả 409 nếu trùng.
  const handleCreateProject = async (data: {
    code: string;
    title: string;
    description: string;
    deadline: string;
  }) => {
    if (!tokenStore.isAuthenticated()) {
      alert('Cần đăng nhập bằng tài khoản thật để tạo dự án.');
      return;
    }
    try {
      await projectsApi.create({
        code: data.code,
        title: data.title,
        description: data.description || undefined,
        deadline: data.deadline || undefined,
      });
      reloadProjects();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail || 'Tạo dự án thất bại.' : 'Tạo dự án thất bại.');
    }
  };

  // Nộp báo cáo ngày mới. Online: POST /daily-reports (đặc tả, 409 nếu đã báo cáo ngày đó).
  const handleAddReport = async (newReport: DailyReport) => {
    if (tokenStore.isAuthenticated()) {
      try {
        const created = await dailyReportsApi.create({
          date: newReport.date,
          completed_today: newReport.completedToday,
          tomorrow_plan: newReport.tomorrowPlan || undefined,
          blockers: newReport.blockers || undefined,
          hours_logged: newReport.hoursLogged,
        });
        setReports(prev => [{ ...newReport, id: String(created.id) }, ...prev]);
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Gửi báo cáo thất bại.');
          return;
        }
        // Lỗi mạng: rơi xuống nhánh cục bộ.
      }
    }
    setReports(prev => [newReport, ...prev]);
  };

  // Đổi trạng thái Task trên Kanban. Online: PATCH /tasks/{id}.
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (tokenStore.isAuthenticated() && isBackendId(taskId)) {
      try {
        await tasksApi.update(Number(taskId), { status: newStatus });
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Cập nhật trạng thái task thất bại.');
          return;
        }
        // Lỗi mạng: vẫn cập nhật cục bộ bên dưới.
      }
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  // Duyệt báo cáo ngày. Online: PATCH /daily-reports/{id}/review.
  const handleApproveReport = async (reportId: string, comment: string, rating: number) => {
    const finalComment = comment || 'Báo cáo đầy đủ, tiến độ tốt.';
    const finalRating = rating || 5;
    if (tokenStore.isAuthenticated() && isBackendId(reportId)) {
      try {
        await dailyReportsApi.review(Number(reportId), {
          status: 'Approved',
          mentor_comment: finalComment,
          rating: finalRating,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Duyệt báo cáo thất bại.');
          return;
        }
      }
    }
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'Approved',
      mentorComment: finalComment,
      rating: finalRating
    } : r));
  };

  // Yêu cầu chỉnh sửa báo cáo ngày. Online: PATCH /daily-reports/{id}/review.
  const handleRequestRevisionReport = async (reportId: string, comment: string) => {
    const finalComment = comment || 'Vui lòng bổ sung thêm thông tin về blockers.';
    if (tokenStore.isAuthenticated() && isBackendId(reportId)) {
      try {
        await dailyReportsApi.review(Number(reportId), {
          status: 'Needs Revision',
          mentor_comment: finalComment,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Yêu cầu chỉnh sửa thất bại.');
          return;
        }
      }
    }
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'Needs Revision',
      mentorComment: finalComment
    } : r));
  };

  // Xoá 1 Task khỏi Kanban board. Online: DELETE /tasks/{id}.
  const handleDeleteTask = async (taskId: string) => {
    if (tokenStore.isAuthenticated() && isBackendId(taskId)) {
      try {
        await tasksApi.remove(Number(taskId));
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Xoá task thất bại.');
          return;
        }
      }
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Xoá 1 Dự án (kèm xoá luôn toàn bộ Task thuộc dự án đó trên Kanban). Online: DELETE /projects/{id}.
  const handleDeleteProject = async (projectId: string) => {
    if (tokenStore.isAuthenticated() && isBackendId(projectId)) {
      try {
        await projectsApi.remove(Number(projectId));
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Xoá dự án thất bại.');
          return;
        }
      }
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };

  // Thêm 1 Thực tập sinh vào danh sách thành viên của Dự án. Online: POST /projects/{id}/members.
  const handleAddProjectMember = async (projectId: string, internId: string) => {
    if (!internId) return;
    if (tokenStore.isAuthenticated() && isBackendId(projectId) && isBackendId(internId)) {
      try {
        await projectsApi.addMembers(Number(projectId), [Number(internId)]);
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Thêm thành viên dự án thất bại.');
          return;
        }
      }
    }
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const currentMembers = p.memberIds || [];
      if (currentMembers.includes(internId)) return p;
      const nextMembers = [...currentMembers, internId];
      return { ...p, memberIds: nextMembers, membersCount: nextMembers.length };
    }));
  };

  // Gỡ 1 Thực tập sinh khỏi danh sách thành viên của Dự án. Online: DELETE /projects/{id}/members/{user_id}.
  const handleRemoveProjectMember = async (projectId: string, internId: string) => {
    if (tokenStore.isAuthenticated() && isBackendId(projectId) && isBackendId(internId)) {
      try {
        await projectsApi.removeMember(Number(projectId), Number(internId));
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Gỡ thành viên dự án thất bại.');
          return;
        }
      }
    }
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const nextMembers = (p.memberIds || []).filter(id => id !== internId);
      return { ...p, memberIds: nextMembers, membersCount: nextMembers.length };
    }));
  };

  // Xoá 1 Tài liệu khỏi Thư viện Tài liệu Gimasys.
  // Online: DELETE /documents/{id} (đặc tả, id dạng số do backend cấp).
  // Tài liệu mẫu (id "DOC-...") không có bên server nên chỉ xoá cục bộ.
  const handleDeleteDocument = async (documentId: string) => {
    const numericId = Number(documentId);
    if (tokenStore.isAuthenticated() && Number.isFinite(numericId) && String(numericId) === documentId) {
      try {
        await documentsApi.remove(numericId);
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Xoá tài liệu thất bại.');
          return;
        }
        // Lỗi mạng: vẫn xoá cục bộ bên dưới.
      }
    }
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  // Thêm 1 Tài liệu mới vào Thư viện Tài liệu Gimasys.
  // Online: POST /documents (đặc tả). Offline/demo: chỉ thêm cục bộ.
  const handleAddDocument = async (newDoc: DocumentResource) => {
    if (tokenStore.isAuthenticated()) {
      try {
        const created = await documentsApi.create({
          title: newDoc.title,
          description: newDoc.description,
          // URL file đã tải lên bucket (KnowledgeBaseView gọi POST /documents/upload
          // trước, rồi truyền content_url vào đây). Trước đây luôn gửi chuỗi rỗng nên
          // tài liệu tạo ra không có file để tải về.
          content_url: newDoc.contentUrl || '',
          type: feFileTypeToApiType(newDoc.fileType),
        });
        // Đồng bộ id server (dạng số) về client để lần xoá sau gọi đúng endpoint.
        setDocuments(prev => [{ ...newDoc, id: String(created.id) }, ...prev]);
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Thêm tài liệu thất bại.');
          return;
        }
        // Lỗi mạng: rơi xuống nhánh cục bộ.
      }
    }
    setDocuments(prev => [newDoc, ...prev]);
  };

  // Bỏ trạng thái intern khỏi state cục bộ (kèm dọn Task/Báo cáo liên quan)
  const removeInternLocal = (internId: string) => {
    setInterns(prev => prev.filter(i => i.id !== internId));
    setTasks(prev => prev.filter(t => t.assignedInternId !== internId));
    setReports(prev => prev.filter(r => r.internId !== internId));
    setSelectedIntern(prev => (prev && prev.id === internId ? null : prev));
  };

  // [CHỈ ADMIN] Xoá vĩnh viễn tài khoản Thực tập sinh khỏi hệ thống.
  // Online: DELETE /users/{id} (đặc tả) - chỉ áp dụng khi id là số do backend cấp.
  // Demo/id cục bộ (vd "T-001"): chỉ xoá cục bộ để không phá luồng demo.
  const handleDeleteIntern = async (internId: string) => {
    const numericId = Number(internId);
    if (tokenStore.isAuthenticated() && Number.isInteger(numericId) && String(numericId) === internId) {
      try {
        await usersApi.remove(numericId);
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Xoá tài khoản thất bại.');
          return;
        }
        // Lỗi mạng: vẫn xoá cục bộ bên dưới.
      }
    }
    removeInternLocal(internId);
  };

  // [MENTOR] Gỡ Thực tập sinh khỏi chương trình (đổi trạng thái, KHÔNG xoá tài khoản).
  // Online: POST /users/{id}/lock (đặc tả) - khoá tài khoản khi id là số do backend cấp.
  // Demo/id cục bộ: chỉ đổi trạng thái 'Removed'.
  const handleKickIntern = async (internId: string) => {
    const numericId = Number(internId);
    if (tokenStore.isAuthenticated() && Number.isInteger(numericId) && String(numericId) === internId) {
      try {
        await usersApi.lock(numericId);
      } catch (err) {
        if (err instanceof ApiError) {
          alert(err.detail || 'Khoá tài khoản thất bại.');
          return;
        }
        // Lỗi mạng: vẫn đổi trạng thái cục bộ bên dưới.
      }
    }
    setInterns(prev => prev.map(i => (i.id === internId ? { ...i, status: 'Removed' } : i)));
    setSelectedIntern(prev => (prev && prev.id === internId ? { ...prev, status: 'Removed' } : prev));
  };

  const pendingReportsCount = reports.filter(r => r.status === 'Pending').length;

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Danh sách Mentor để chọn khi giao việc / gán vào dự án.
  // Trước đây lấy từ "thành viên có vai trò MENTOR trong nhóm đang chọn" — nhưng
  // `GET /groups/{id}` không trả vai trò của thành viên, nên thực tế danh sách này
  // luôn rỗng và dropdown chỉ hiện tài khoản demo. Nay lấy thẳng Mentor thật từ
  // `GET /users?role=MENTOR`; chỉ khi chưa tải được (offline/demo) mới dùng dữ liệu mẫu.
  const allMentors: AuthUser[] = mentors.length > 0
    ? mentors
    : DEMO_AUTH_USERS.filter(u => u.role === 'MENTOR');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        searchTerm={globalSearch}
        onSearchChange={setGlobalSearch}
        pendingReviewsCount={pendingReportsCount}
        reports={reports}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 gap-6">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => { setActiveTab(tab); setIsGroupScreenOpen(false); }}
          currentRole={currentRole}
          // Quản lý nhóm là chức năng của MENTOR trở lên: backend chặn `GET /groups`
          // với Intern, nên với Intern mục này bị ẩn hẳn khỏi thanh bên.
          onOpenGroupScreen={currentRole !== 'INTERN' ? () => setIsGroupScreenOpen(true) : undefined}
          isGroupScreenActive={isGroupScreenOpen}
          pendingReviewsCount={pendingReportsCount}
          // Tổng việc chờ Admin xử lý ở tab Mentor: tài khoản chờ duyệt + yêu cầu
          // chuyển vai trò.
          pendingMentorCount={pendingMentorCount + pendingRoleRequestCount}
        />

        {/* Central View Content.
            Bọc ErrorBoundary: lỗi render của một màn hình chỉ hỏng vùng nội dung,
            Header/Sidebar vẫn còn để chuyển sang mục khác — thay vì trắng cả trang.
            resetKey đổi theo tab nên chuyển tab là tự thử render lại. */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary resetKey={isGroupScreenOpen ? 'groups' : activeTab}>
          {isGroupScreenOpen && (
            <GroupSelectionView
              currentUser={currentUser}
              currentRole={currentRole}
              groups={groups}
              interns={interns}
              onCreateGroup={handleCreateGroup}
              onReloadGroups={reloadGroups}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'dashboard' && (
            <DashboardView
              interns={interns}
              projects={projects}
              tasks={tasks}
              reports={reports}
              currentRole={currentRole}
              currentUser={currentUser}
              onNavigateTab={setActiveTab}
              onSelectIntern={setSelectedIntern}
              onOpenAddReport={() => setIsAddReportOpen(true)}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'interns' && currentRole !== 'INTERN' && (
            <InternsView
              interns={interns}
              onSelectIntern={setSelectedIntern}
              onDeleteIntern={handleDeleteIntern}
              onKickIntern={handleKickIntern}
              currentRole={currentRole}
              searchTerm={globalSearch}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'mentors' && currentRole === 'ADMIN' && (
            <MentorsView currentRole={currentRole} onQueueChanged={reloadAdminQueues} />
          )}

          {!isGroupScreenOpen && activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              interns={interns}
              groups={groups}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onCreateProject={handleCreateProject}
              onDeleteProject={handleDeleteProject}
              onReloadProjects={reloadProjects}
              currentRole={currentRole}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'daily_reports' && (
            <DailyReportsView
              reports={reports}
              onOpenAddReport={() => setIsAddReportOpen(true)}
              onApproveReport={handleApproveReport}
              onRequestRevision={handleRequestRevisionReport}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'roadmaps' && (
            <RoadmapView
              currentRole={currentRole}
              currentUser={currentUser}
              interns={interns}
              groups={groups}
              documents={documents}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'knowledge' && (
            <KnowledgeBaseView
              documents={documents}
              currentRole={currentRole}
              onDeleteDocument={handleDeleteDocument}
              onAddDocument={handleAddDocument}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'settings' && (
            <SettingsView
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePassword}
              onDeleteAccount={handleDeleteAccount}
              onSessionRefresh={refreshSession}
            />
          )}

          {!isGroupScreenOpen && activeTab === 'mock_exam' && (
            <MockExamView currentUser={currentUser} />
          )}
          </ErrorBoundary>
        </main>

      </div>

      {/* Interactive Modals */}
      <InternDetailModal
        intern={selectedIntern}
        onClose={() => setSelectedIntern(null)}
        reports={reports}
        tasks={tasks}
        currentRole={currentRole}
        onDeleteIntern={handleDeleteIntern}
        onKickIntern={handleKickIntern}
      />

      <AddReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        interns={interns}
        onAddReport={handleAddReport}
        currentUser={currentUser}
      />

      <AIAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentRole={currentRole}
      />

    </div>
  );
}
