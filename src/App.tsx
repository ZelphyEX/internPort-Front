import React, { useState, useEffect } from 'react';
import { UserRole, Intern, Project, TaskItem, DailyReport, TrainingModule, TaskStatus, AuthUser, DocumentResource, Group, GroupMember } from './types';
import { 
  INITIAL_INTERNS, 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_DAILY_REPORTS, 
  TRAINING_MODULES, 
  DOCUMENT_RESOURCES,
  DEMO_AUTH_USERS
} from './data/mockData';

import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { GroupSelectionView } from './components/GroupSelectionView';
import { DashboardView } from './components/DashboardView';
import { InternsView } from './components/InternsView';
import { ProjectsView } from './components/ProjectsView';
import { DailyReportsView } from './components/DailyReportsView';
import { RoadmapView } from './components/RoadmapView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SkilljarCoursesView } from './components/SkilljarCoursesView';
import { SettingsView } from './components/SettingsView';

import { InternDetailModal } from './components/InternDetailModal';
import { AddInternModal } from './components/AddInternModal';
import { AddTaskModal } from './components/AddTaskModal';
import { AddReportModal } from './components/AddReportModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { InviteMemberModal } from './components/InviteMemberModal';
import { AddProjectMemberModal } from './components/AddProjectMemberModal';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
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

  const [currentGroupId, setCurrentGroupId] = useState<string | null>(() => {
    return localStorage.getItem('gimasys_current_group_id');
  });

  // Đọc mã mời từ URL (?joinCode=XXXX) nếu người dùng vào bằng link chia sẻ
  const [initialJoinCode, setInitialJoinCode] = useState<string>('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('joinCode');
    if (codeFromUrl) {
      setInitialJoinCode(codeFromUrl.toUpperCase());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gimasys_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    if (currentGroupId) {
      localStorage.setItem('gimasys_current_group_id', currentGroupId);
    } else {
      localStorage.removeItem('gimasys_current_group_id');
    }
  }, [currentGroupId]);

  // Tạo mã mời nhóm ngẫu nhiên, không trùng với nhóm đã có
  const generateGroupCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (groups.some(g => g.code === code));
    return code;
  };

  // Tạo nhóm mới - người tạo mặc định là Admin
  const handleCreateGroup = (name: string) => {
    if (!currentUser) return;
    const newGroup: Group = {
      id: `GRP-${Date.now().toString().slice(-8)}`,
      name,
      code: generateGroupCode(),
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          avatar: currentUser.avatar,
          role: 'ADMIN',
          status: 'Approved',
          joinedAt: new Date().toISOString()
        }
      ]
    };
    setGroups(prev => [...prev, newGroup]);
    setCurrentGroupId(newGroup.id);
    setCurrentRole('ADMIN');
  };

  // Gửi yêu cầu tham gia nhóm bằng mã mời - cần Admin của nhóm xác nhận
  const handleRequestJoinGroup = (code: string, role: UserRole): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Bạn cần đăng nhập trước.' };

    const targetGroup = groups.find(g => g.code === code);
    if (!targetGroup) {
      return { success: false, message: 'Mã nhóm không tồn tại. Vui lòng kiểm tra lại.' };
    }

    const existingMember = targetGroup.members.find(m => m.userId === currentUser.id);
    if (existingMember) {
      if (existingMember.status === 'Approved') {
        return { success: false, message: 'Bạn đã là thành viên của nhóm này rồi.' };
      }
      if (existingMember.status === 'Pending') {
        return { success: false, message: 'Yêu cầu tham gia của bạn đang chờ Admin xác nhận.' };
      }
    }

    const newMember: GroupMember = {
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      avatar: currentUser.avatar,
      role,
      status: 'Pending',
      joinedAt: new Date().toISOString()
    };

    setGroups(prev => prev.map(g => {
      if (g.id !== targetGroup.id) return g;
      const membersWithoutMe = g.members.filter(m => m.userId !== currentUser.id);
      return { ...g, members: [...membersWithoutMe, newMember] };
    }));

    return { success: true, message: `Đã gửi yêu cầu tham gia nhóm "${targetGroup.name}". Vui lòng chờ Admin xác nhận.` };
  };

  // Chọn 1 nhóm để vào (đồng bộ vai trò hiện tại theo vai trò của mình trong nhóm đó)
  const handleSelectGroup = (groupId: string) => {
    if (!currentUser) return;
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetGroup) return;
    const membership = targetGroup.members.find(m => m.userId === currentUser.id);
    if (!membership || membership.status !== 'Approved') return;

    setCurrentGroupId(groupId);
    setCurrentRole(membership.role);
    setActiveTab('dashboard');
  };

  // [Admin] Duyệt yêu cầu tham gia nhóm
  const handleApproveMember = (groupId: string, userId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map(m => m.userId === userId ? { ...m, status: 'Approved' as const } : m)
      };
    }));
  };

  // [Admin] Từ chối yêu cầu tham gia nhóm
  const handleRejectMember = (groupId: string, userId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        members: g.members.map(m => m.userId === userId ? { ...m, status: 'Rejected' as const } : m)
      };
    }));
  };

  // Quay lại màn hình chọn nhóm
  const handleBackToGroups = () => {
    setCurrentGroupId(null);
  };

  // Synchronize Role when User changes or Header switcher changes
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (currentUser) {
      const updatedUser = { ...currentUser, role: newRole };
      setCurrentUser(updatedUser);
      localStorage.setItem('gimasys_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('gimasys_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gimasys_current_user');
  };

  // Cập nhật Tên & Ảnh đại diện của tài khoản đang đăng nhập
  const handleUpdateProfile = (updates: { name?: string; avatar?: string }) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('gimasys_current_user', JSON.stringify(updatedUser));
  };

  // Đổi mật khẩu (lưu cục bộ theo email, dùng để đối chiếu khi đăng nhập lại)
  const handleChangePassword = (newPassword: string) => {
    if (!currentUser) return;
    localStorage.setItem(`gimasys_pwd_${currentUser.email.toLowerCase()}`, newPassword);
  };

  // Persistent States
  const [interns, setInterns] = useState<Intern[]>(() => {
    const saved = localStorage.getItem('gimasys_interns');
    return saved ? JSON.parse(saved) : INITIAL_INTERNS;
  });

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

  const [modules, setModules] = useState<TrainingModule[]>(() => {
    const saved = localStorage.getItem('gimasys_modules');
    return saved ? JSON.parse(saved) : TRAINING_MODULES;
  });

  const [documents, setDocuments] = useState<DocumentResource[]>(() => {
    const saved = localStorage.getItem('gimasys_documents');
    return saved ? JSON.parse(saved) : DOCUMENT_RESOURCES;
  });

  // Modal States
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [isAddInternOpen, setIsAddInternOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddProjectMemberOpen, setIsAddProjectMemberOpen] = useState(false);

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
    localStorage.setItem('gimasys_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('gimasys_documents', JSON.stringify(documents));
  }, [documents]);

  // Handler Functions
  const handleAddIntern = (newIntern: Intern) => {
    setInterns(prev => [newIntern, ...prev]);
  };

  const handleAddTask = (newTask: TaskItem) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleAddReport = (newReport: DailyReport) => {
    setReports(prev => [newReport, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleApproveReport = (reportId: string, comment: string, rating: number) => {
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'Approved',
      mentorComment: comment || 'Báo cáo đầy đủ, tiến độ tốt.',
      rating: rating || 5
    } : r));
  };

  const handleRequestRevisionReport = (reportId: string, comment: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      status: 'Needs Revision',
      mentorComment: comment || 'Vui lòng bổ sung thêm thông tin về blockers.'
    } : r));
  };

  const handleToggleModuleStatus = (moduleId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        const nextStatus = m.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  // Xoá 1 Task khỏi Kanban board
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Xoá 1 Dự án (kèm xoá luôn toàn bộ Task thuộc dự án đó trên Kanban)
  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };

  // Thêm 1 Thực tập sinh vào danh sách thành viên của Dự án
  const handleAddProjectMember = (projectId: string, internId: string) => {
    if (!internId) return;
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const currentMembers = p.memberIds || [];
      if (currentMembers.includes(internId)) return p;
      const nextMembers = [...currentMembers, internId];
      return { ...p, memberIds: nextMembers, membersCount: nextMembers.length };
    }));
  };

  // Gỡ 1 Thực tập sinh khỏi danh sách thành viên của Dự án
  const handleRemoveProjectMember = (projectId: string, internId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const nextMembers = (p.memberIds || []).filter(id => id !== internId);
      return { ...p, memberIds: nextMembers, membersCount: nextMembers.length };
    }));
  };

  // Xoá 1 Tài liệu khỏi Thư viện Tài liệu Gimasys
  const handleDeleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  // Thêm 1 Tài liệu mới vào Thư viện Tài liệu Gimasys
  const handleAddDocument = (newDoc: DocumentResource) => {
    setDocuments(prev => [newDoc, ...prev]);
  };

  // [CHỈ ADMIN] Xoá vĩnh viễn tài khoản Thực tập sinh khỏi hệ thống (kèm xoá luôn Task đang gán và Báo cáo ngày của người đó)
  const handleDeleteIntern = (internId: string) => {
    setInterns(prev => prev.filter(i => i.id !== internId));
    setTasks(prev => prev.filter(t => t.assignedInternId !== internId));
    setReports(prev => prev.filter(r => r.internId !== internId));
    setSelectedIntern(prev => (prev && prev.id === internId ? null : prev));
  };

  // [MENTOR] Xoá Thực tập sinh khỏi khoá học / chương trình đào tạo (chỉ đổi trạng thái, KHÔNG xoá tài khoản hay dữ liệu)
  const handleKickIntern = (internId: string) => {
    setInterns(prev => prev.map(i => (i.id === internId ? { ...i, status: 'Removed' } : i)));
    setSelectedIntern(prev => (prev && prev.id === internId ? { ...prev, status: 'Removed' } : prev));
  };

  const pendingReportsCount = reports.filter(r => r.status === 'Pending').length;

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Kiểm tra xem người dùng đã chọn 1 nhóm hợp lệ (đã được duyệt) hay chưa
  const activeGroup = groups.find(g => g.id === currentGroupId);
  const activeMembership = activeGroup?.members.find(m => m.userId === currentUser.id);
  const hasApprovedGroup = !!activeGroup && !!activeMembership && activeMembership.status === 'Approved';

  if (!hasApprovedGroup) {
    return (
      <GroupSelectionView
        currentUser={currentUser}
        groups={groups}
        onCreateGroup={handleCreateGroup}
        onRequestJoinGroup={handleRequestJoinGroup}
        onSelectGroup={handleSelectGroup}
        onApproveMember={handleApproveMember}
        onRejectMember={handleRejectMember}
        onLogout={handleLogout}
        initialJoinCode={initialJoinCode}
      />
    );
  }

  // Danh sách Mentor có thể được gán vào dự án (để phân quyền Mentor tham gia dự án nào)
  // Gộp từ tài khoản mẫu (DEMO_AUTH_USERS) + Mentor đã được duyệt trong nhóm hiện tại
  const groupMentors: AuthUser[] = (activeGroup?.members || [])
    .filter(m => m.role === 'MENTOR' && m.status === 'Approved')
    .map(m => ({
      id: m.userId,
      name: m.userName,
      email: m.userEmail,
      role: 'MENTOR' as const,
      roleTitle: 'Mentor',
      avatar: m.avatar
    }));
  const allMentors: AuthUser[] = [
    ...DEMO_AUTH_USERS.filter(u => u.role === 'MENTOR'),
    ...groupMentors.filter(gm => !DEMO_AUTH_USERS.some(u => u.id === gm.id))
  ];

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
        currentGroupName={activeGroup?.name}
        onBackToGroups={handleBackToGroups}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 gap-6">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentRole={currentRole}
          onOpenAddIntern={() => setIsAddInternOpen(true)}
          onOpenAddTask={() => setIsAddTaskOpen(true)}
          onOpenAddReport={() => setIsAddReportOpen(true)}
          onOpenInvite={() => setIsInviteOpen(true)}
          pendingReviewsCount={pendingReportsCount}
        />

        {/* Central View Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              interns={interns}
              projects={projects}
              tasks={tasks}
              reports={reports}
              currentRole={currentRole}
              onNavigateTab={setActiveTab}
              onSelectIntern={setSelectedIntern}
              onOpenAddIntern={() => setIsAddInternOpen(true)}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onOpenAddReport={() => setIsAddReportOpen(true)}
              onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
            />
          )}

          {activeTab === 'interns' && currentRole !== 'INTERN' && (
            <InternsView
              interns={interns}
              onSelectIntern={setSelectedIntern}
              onOpenAddIntern={() => setIsAddInternOpen(true)}
              onOpenInvite={() => setIsInviteOpen(true)}
              onDeleteIntern={handleDeleteIntern}
              onKickIntern={handleKickIntern}
              currentRole={currentRole}
              searchTerm={globalSearch}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              interns={interns}
              mentors={allMentors}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
              onOpenAddMember={() => setIsAddProjectMemberOpen(true)}
              onDeleteTask={handleDeleteTask}
              onDeleteProject={handleDeleteProject}
              onAddProjectMember={handleAddProjectMember}
              onRemoveProjectMember={handleRemoveProjectMember}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'daily_reports' && (
            <DailyReportsView
              reports={reports}
              onOpenAddReport={() => setIsAddReportOpen(true)}
              onApproveReport={handleApproveReport}
              onRequestRevision={handleRequestRevisionReport}
              currentRole={currentRole}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'skilljar' && (
            <SkilljarCoursesView
              modules={modules}
              onUpdateModules={setModules}
              onNavigateToTab={setActiveTab}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'roadmaps' && (
            <RoadmapView
              trainingModules={modules}
              onToggleModuleStatus={handleToggleModuleStatus}
              onNavigateToProjects={() => setActiveTab('projects')}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBaseView
              documents={documents}
              currentRole={currentRole}
              onDeleteDocument={handleDeleteDocument}
              onAddDocument={handleAddDocument}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePassword}
            />
          )}
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

      <AddInternModal
        isOpen={isAddInternOpen}
        onClose={() => setIsAddInternOpen(false)}
        onAddIntern={handleAddIntern}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        interns={interns}
        projects={projects}
        onAddTask={handleAddTask}
        onAddProjectMember={handleAddProjectMember}
      />

      <AddReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        interns={interns}
        onAddReport={handleAddReport}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        group={activeGroup || null}
      />

      <AddProjectMemberModal
        isOpen={isAddProjectMemberOpen}
        onClose={() => setIsAddProjectMemberOpen(false)}
        projects={projects}
        interns={interns}
        mentors={allMentors}
        onAddProjectMember={handleAddProjectMember}
      />

      <AIAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentRole={currentRole}
      />

    </div>
  );
}
