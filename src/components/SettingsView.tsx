import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  ShieldCheck, 
  GraduationCap, 
  Bell, 
  Monitor, 
  Check, 
  Save, 
  RotateCcw, 
  ExternalLink,
  Sparkles,
  Sliders,
  Mail,
  Building,
  Key,
  Globe
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';

interface SettingsViewProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: AuthUser;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onRoleChange,
  currentUser
}) => {
  // Local Settings States
  const [skilljarDomain, setSkilljarDomain] = useState<string>('https://anthropic.skilljar.com/');
  const [autoSyncSkilljar, setAutoSyncSkilljar] = useState<boolean>(true);
  const [notifyCompletion, setNotifyCompletion] = useState<boolean>(true);

  const [standupReminderTime, setStandupReminderTime] = useState<string>('08:30');
  const [notifyMentorOnSubmit, setNotifyMentorOnSubmit] = useState<boolean>(true);

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [uiDensity, setUiDensity] = useState<'standard' | 'compact'>('standard');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setToastMessage('Đã lưu cấu hình cài đặt hệ thống thành công!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleResetSettings = () => {
    setSkilljarDomain('https://anthropic.skilljar.com/');
    setAutoSyncSkilljar(true);
    setNotifyCompletion(true);
    setStandupReminderTime('08:30');
    setNotifyMentorOnSubmit(true);
    setThemeMode('light');
    setUiDensity('standard');
    setToastMessage('Đã khôi phục cài đặt mặc định!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const rolesList: { role: UserRole; label: string; desc: string; badgeBg: string }[] = [
    {
      role: 'INTERN',
      label: 'Học viên (Thực tập sinh)',
      desc: 'Chỉ xem bài học Skilljar, tự tick hoàn thành Section, gửi báo cáo Standup hằng ngày.',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      role: 'MENTOR',
      label: 'Mentor Hướng dẫn',
      desc: 'Thêm/sửa khóa học Skilljar, giao Task, phê duyệt báo cáo Standup, đánh giá kết quả thực tập.',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      role: 'PROJECT_LEAD',
      label: 'Trưởng Dự Án (Lead)',
      desc: 'Quản lý dự án, phân công công việc trên Kanban, theo dõi tiến độ kỹ thuật.',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    {
      role: 'ADMIN',
      label: 'Quản Trị Viên (Admin)',
      desc: 'Toàn quyền cấu hình portal, quản lý người dùng, thiết lập quy trình đào tạo Gimasys.',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  ];

  return (
    <div className="p-6 space-y-6 pb-20 max-w-6xl mx-auto">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>System Preferences</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Cài Đặt Hệ Thống & Cấu Hình Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tùy chỉnh thông tin người dùng, cổng học tập Anthropic Skilljar, vai trò trải nghiệm và thông báo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetSettings}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: User Profile & Dynamic Role Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">1. Thông Tin Tài Khoản & Vai Trò Trải Nghiệm</h3>
            <p className="text-xs text-slate-500">Chuyển đổi vai trò để kiểm thử phân quyền dành cho Học viên (Intern) và Mentor.</p>
          </div>
        </div>

        {/* Current User Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3.5">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm">{currentUser.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {currentUser.roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{currentUser.email}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{currentUser.department || 'Gimasys Tech'}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Vai trò hiện tại:</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full border inline-block mt-0.5 ${
              currentRole === 'INTERN' 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-blue-100 text-blue-800 border-blue-300'
            }`}>
              {currentRole === 'INTERN' ? 'HỌC VIÊN (INTERN)' : `${currentRole} (MENTOR/LEAD)`}
            </span>
          </div>
        </div>

        {/* Role Switcher Grid */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-800 block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Chuyển Vai Trò Thử Nghiệm UI System:</span>
            </span>
            {currentRole === 'INTERN' && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold">
                🔒 Học viên không thể tự thay đổi vai trò của mình.
              </span>
            )}
          </label>

          {currentRole === 'INTERN' ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <span className="font-extrabold block">Lưu ý phân quyền tài khoản:</span>
              <p>
                Tài khoản của bạn hiện đang ở vai trò <strong>Học viên (INTERN)</strong>. Nếu bạn cần cấp quyền Mentor hoặc Admin, vui lòng nhờ Mentor hướng dẫn hoặc Ban HR cập nhật vai trò cho bạn trong danh sách Quản lý Thực tập sinh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rolesList.map((item) => {
                const isSelected = currentRole === item.role;
                return (
                  <div
                    key={item.role}
                    onClick={() => onRoleChange(item.role)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">{item.label}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${item.badgeBg}`}>
                          {item.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* SECTION 2: Anthropic Skilljar LMS Portal Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">2. Cấu Hình Cổng Học Tập Anthropic Skilljar LMS</h3>
            <p className="text-xs text-slate-500">Thiết lập URL hệ thống đào tạo chính thức và đồng bộ tiến độ bài học.</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-extrabold text-slate-800 block mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <span>Skilljar Base Domain URL:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={skilljarDomain}
                onChange={(e) => setSkilljarDomain(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-blue-700 font-medium focus:ring-2 focus:ring-orange-500"
              />
              <a
                href={skilljarDomain}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1 shrink-0 border border-slate-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Link</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">Tự động tính % Tiến độ LMS</span>
                <span className="text-[11px] text-slate-500">Cập nhật thanh tiến độ ngay khi học viên tick chọn Section.</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoSyncSkilljar} 
                onChange={(e) => setAutoSyncSkilljar(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">Thông báo khi Hoàn thành Khóa học</span>
                <span className="text-[11px] text-slate-500">Gửi thông báo cho Mentor khi Học viên hoàn thành 100% khoá Skilljar.</span>
              </div>
              <input 
                type="checkbox" 
                checked={notifyCompletion} 
                onChange={(e) => setNotifyCompletion(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 3: Daily Standup & Notification Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">3. Nhắc Nhở Báo Cáo Hằng Ngày & Standup</h3>
            <p className="text-xs text-slate-500">Cài đặt giờ nhắc nộp báo cáo công việc cho Thực tập sinh.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-extrabold text-slate-800 block mb-1">Khung Giờ Nhắc Báo Cáo Standup Ngày:</label>
            <input
              type="time"
              value={standupReminderTime}
              onChange={(e) => setStandupReminderTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 block">Tự động báo Mentor khi Nộp Báo cáo</span>
              <span className="text-[11px] text-slate-500">Mentor nhận thông báo review báo cáo của Thực tập sinh.</span>
            </div>
            <input 
              type="checkbox" 
              checked={notifyMentorOnSubmit} 
              onChange={(e) => setNotifyMentorOnSubmit(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* SECTION 4: Theme & Appearance */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">4. Giao Diện & Mật Độ Hiển Thị</h3>
            <p className="text-xs text-slate-500">Tùy chỉnh chế độ màu sắc và mật độ khoảng cách dòng.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Theme Mode */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 block">Chế Độ Giao Diện (Theme):</label>
            <div className="flex gap-2">
              {[
                { id: 'light', label: '☀️ Sáng (Chuẩn)' },
                { id: 'dark', label: '🌙 Tối (Eye Care)' },
                { id: 'system', label: '💻 HĐH System' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeMode(t.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeMode === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* UI Density */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 block">Mật Độ Hiển Thị Layout:</label>
            <div className="flex gap-2">
              {[
                { id: 'standard', label: '📐 Tiêu chuẩn (Thoải mái)' },
                { id: 'compact', label: '⚡ Nén gọn (Compact)' }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setUiDensity(d.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    uiDensity === d.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
