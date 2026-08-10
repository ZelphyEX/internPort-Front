import React from 'react';
import {
  LayoutDashboard,
  Users,
  Kanban,
  FileSpreadsheet,
  Compass,
  FolderGit2,
  Sparkles,
  PlusCircle,
  HelpCircle,
  Settings,
  Building2,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { UserRole } from '../types';
import { canManageContent, canManageInterns } from '../services/permissions';

export type NavTab = 'dashboard' | 'interns' | 'mentors' | 'projects' | 'daily_reports' | 'roadmaps' | 'knowledge' | 'settings' | 'mock_exam';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentRole: UserRole;
  onOpenAddIntern: () => void;
  onOpenAddTask: () => void;
  onOpenAddReport: () => void;
  onOpenGroupScreen?: () => void;
  /** true khi màn "Quản Lý Nhóm" đang mở — để tô sáng mục này như các tab khác. */
  isGroupScreenActive?: boolean;
  pendingReviewsCount: number;
  /**
   * Số việc đang chờ Admin xử lý ở tab "Quản lý Mentor" = tài khoản Mentor chờ
   * duyệt + yêu cầu chuyển vai trò. Hiện thành badge.
   */
  pendingMentorCount?: number;
}

// Class dùng chung cho mọi mục điều hướng, để mục "Quản Lý Nhóm" (không phải NavTab)
// vẫn sáng lên y hệt các tab còn lại khi đang được chọn.
const navItemClass = (isActive: boolean) =>
  `w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
    isActive
      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
  }`;

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  onOpenAddIntern,
  onOpenAddTask,
  onOpenAddReport,
  onOpenGroupScreen,
  isGroupScreenActive = false,
  pendingReviewsCount,
  pendingMentorCount = 0
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan Portal',
      icon: LayoutDashboard,
      badge: null
    },
    ...(currentRole !== 'INTERN' ? [{
      id: 'interns' as NavTab,
      label: 'Quản lý Thực tập sinh',
      icon: Users,
      badge: null
    }] : []),
    // Duyệt tài khoản Mentor mới và duyệt yêu cầu chuyển vai trò là việc riêng
    // của Quản trị viên.
    ...(currentRole === 'ADMIN' ? [{
      id: 'mentors' as NavTab,
      label: 'Quản lý Mentor',
      icon: UserCheck,
      badge: pendingMentorCount > 0 ? `${pendingMentorCount} chờ duyệt` : null
    }] : []),
    {
      id: 'projects' as NavTab,
      label: 'Dự án & Kanban Worklog',
      icon: Kanban,
      badge: null
    },
    {
      id: 'daily_reports' as NavTab,
      label: 'Báo cáo hằng ngày',
      icon: FileSpreadsheet,
      badge: pendingReviewsCount > 0 && currentRole !== 'INTERN' ? `${pendingReviewsCount} cần duyệt` : null
    },
    {
      id: 'roadmaps' as NavTab,
      label: 'Lộ trình Đào tạo & Skills',
      icon: Compass,
      badge: null
    },
    {
      id: 'knowledge' as NavTab,
      label: 'Thư viện Tài liệu Gimasys',
      icon: FolderGit2,
      badge: null
    },
    {
      id: 'mock_exam' as NavTab,
      label: 'Anthropic Mock Exam',
      icon: GraduationCap,
      badge: null
    },
    {
      id: 'settings' as NavTab,
      label: 'Cài đặt hệ thống',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside id="sidebar-nav" className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      
      {/* Top Section: Navigation Links */}
      <div className="space-y-6">
        
        {/* Navigation Section Title */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
            Menu Quản lý
          </p>

          <nav className="space-y-1">
            {navItems.slice(0, 1).map((item) => {
              const Icon = item.icon;
              // Màn "Quản Lý Nhóm" phủ lên nội dung tab, nên khi nó mở thì không
              // tab nào được coi là đang chọn (tránh sáng 2 mục cùng lúc).
              const isActive = !isGroupScreenActive && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={navItemClass(isActive)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {onOpenGroupScreen && (
              <button
                id="nav-tab-groups"
                onClick={onOpenGroupScreen}
                aria-current={isGroupScreenActive ? 'page' : undefined}
                className={navItemClass(isGroupScreenActive)}
              >
                <div className="flex items-center gap-3">
                  <Building2 className={`w-4 h-4 ${isGroupScreenActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>Quản Lý Nhóm</span>
                </div>
              </button>
            )}

            {navItems.slice(1).map((item) => {
              const Icon = item.icon;
              // Màn "Quản Lý Nhóm" phủ lên nội dung tab, nên khi nó mở thì không
              // tab nào được coi là đang chọn (tránh sáng 2 mục cùng lúc).
              const isActive = !isGroupScreenActive && activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={navItemClass(isActive)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions Panel */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-3">
            Thao tác nhanh
          </p>
          <div className="space-y-2">
            {/* Thêm TTS: cả Mentor và Admin (quản lý tài khoản). */}
            {canManageInterns(currentRole) && (
              <button
                id="btn-quick-add-intern"
                onClick={onOpenAddIntern}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Thêm Thực tập sinh mới</span>
              </button>
            )}

            {/* Giao task là nghiệp vụ -> chỉ Mentor. */}
            {canManageContent(currentRole) && (
              <button
                id="btn-quick-add-task"
                onClick={onOpenAddTask}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Giao công việc (Task)</span>
              </button>
            )}

            <button
              id="btn-quick-add-report"
              onClick={onOpenAddReport}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Gửi báo cáo Standup ngày</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: Gimasys Info Card */}
      <div className="pt-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gimasys Training 2025</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Chương trình đào tạo thực tập sinh chuẩn hóa quy trình doanh nghiệp.
          </p>
          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-800/60">
            <span>Version 2.5 (AI-Enabled)</span>
            <span className="text-emerald-400 font-medium">Online</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
