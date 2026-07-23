import React, { useState } from 'react';
import { UserRole, AuthUser, DailyReport } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Building2,
  Sparkles,
  Bell,
  Search,
  UserCheck,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  ChevronDown,
  LogOut,
  User,
  Sun,
  Moon,
  ClipboardList,
  AlertTriangle,
  X,
  Users
} from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  onOpenAiAssistant: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  pendingReviewsCount: number;
  reports?: DailyReport[];
  onNavigateToTab?: (tab: any) => void;
  currentGroupName?: string;
  onBackToGroups?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  onLogout,
  onOpenAiAssistant,
  searchTerm,
  onSearchChange,
  pendingReviewsCount,
  reports = [],
  onNavigateToTab,
  currentGroupName,
  onBackToGroups
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Danh sách thông báo tùy theo vai trò hiện tại
  const notifications = currentRole === 'INTERN'
    ? reports.filter(r => currentUser && r.internId === currentUser.internId && r.status === 'Needs Revision')
    : reports.filter(r => r.status === 'Pending');
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên (Admin/HR)', icon: ShieldCheck, bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'MENTOR':
        return { label: 'Mentor / Chuyên gia', icon: UserCheck, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'INTERN':
        return { label: 'Thực tập sinh', icon: GraduationCap, bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
  };

  const roleInfo = getRoleBadge(currentRole);
  const RoleIcon = roleInfo.icon;
  const { theme, toggleTheme } = useTheme();

  return (
    <header id="header-nav" className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 flex items-center justify-center text-white shadow-md font-bold text-lg tracking-wider">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-slate-900 dark:text-slate-100 tracking-tight">GIMASYS</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  Intern Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
                Hệ thống Quản lý & Theo dõi Thực tập sinh
              </p>
            </div>
          </div>

          {/* Current Group Indicator + Switch Group */}
          {currentGroupName && (
            <button
              type="button"
              onClick={onBackToGroups}
              title="Đổi sang nhóm khác"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-bold max-w-[140px] truncate">{currentGroupName}</span>
              <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">Đổi nhóm</span>
            </button>
          )}

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm thực tập sinh, dự án, công việc, tài liệu..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Actions, User Info & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Dark/Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Gemini AI Assistant Quick Button */}
            <button
              id="ai-assistant-btn"
              onClick={onOpenAiAssistant}
              className="relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-2xs group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notification-bell"
                type="button"
                onClick={() => setIsNotifOpen(prev => !prev)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
                title="Báo cáo cần duyệt"
              >
                <Bell className="w-5 h-5" />
                {pendingReviewsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  {/* Backdrop để đóng dropdown khi click ra ngoài */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />

                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">Thông báo</h4>
                      <button onClick={() => setIsNotifOpen(false)} className="p-0.5 text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Không có thông báo mới.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setIsNotifOpen(false);
                              onNavigateToTab?.('daily_reports');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-start gap-2.5"
                          >
                            {currentRole === 'INTERN' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            ) : (
                              <ClipboardList className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0">
                              {currentRole === 'INTERN' ? (
                                <>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Báo cáo ngày {r.date} cần bổ sung</p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{r.mentorComment || 'Mentor yêu cầu chỉnh sửa lại báo cáo.'}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.internName} vừa gửi báo cáo</p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ngày {r.date} · Đang chờ bạn duyệt</p>
                                </>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Role Switcher Select */}
            <div className="relative hidden xl:block">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                  currentRole === 'INTERN'
                    ? 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-90 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 cursor-pointer border-slate-200 dark:border-slate-700'
                }`}
                title={currentRole === 'INTERN' ? 'Tài khoản Học viên cố định (Chỉ Mentor/Admin mới có quyền sửa Role)' : 'Chuyển vai trò thử nghiệm UI'}
              >
                <RoleIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <select
                  id="role-switcher-select"
                  disabled={currentRole === 'INTERN'}
                  value={currentRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className={`bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none pr-1 ${
                    currentRole === 'INTERN' ? 'cursor-not-allowed text-slate-600 dark:text-slate-400' : 'cursor-pointer'
                  }`}
                >
                  <option value="ADMIN">HR / Admin Portal</option>
                  <option value="MENTOR">Mentor / Technical Lead</option>
                  <option value="INTERN">🔒 Thực tập sinh (Locked)</option>
                </select>
                {currentRole !== 'INTERN' && <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />}
              </div>
            </div>

            {/* Current Logged-in User Profile Card & Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight line-clamp-1">{currentUser.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer ml-1 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};

