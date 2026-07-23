import React, { useState, useEffect } from 'react';
import { UserRole, Intern, Project, TaskItem, DailyReport, TrainingModule, TaskStatus, AuthUser } from './types';
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

  // Modal States
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [isAddInternOpen, setIsAddInternOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

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

  const pendingReportsCount = reports.filter(r => r.status === 'Pending').length;

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
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
              currentRole={currentRole}
              searchTerm={globalSearch}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenAddTask={() => setIsAddTaskOpen(true)}
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
              documents={DOCUMENT_RESOURCES}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
              currentUser={currentUser}
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
      />

      <AddReportModal
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        interns={interns}
        onAddReport={handleAddReport}
      />

      <AIAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        currentRole={currentRole}
      />

    </div>
  );
}
