import React, { useRef, useState } from 'react';
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
  Globe,
  Camera,
  Lock,
  AlertCircle,
  ArrowLeftRight,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { useTheme } from '../context/ThemeContext';
import { RoleSwitchCard } from './RoleSwitchCard';

interface SettingsViewProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: AuthUser;
  onUpdateProfile?: (updates: { name?: string; avatar?: string }) => void;
  onChangePassword?: (oldPassword: string, newPassword: string) => void;
  onDeleteAccount?: () => void;
  /** Tải lại phiên từ `GET /auth/me` — dùng sau khi vai trò thật vừa đổi. */
  onSessionRefresh?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  onUpdateProfile,
  onChangePassword,
  onDeleteAccount,
  onSessionRefresh
}) => {
  const { theme, setTheme } = useTheme();

  // Vai trò THẬT của tài khoản (server trả về), khác với `currentRole` là vai trò
  // đang xem thử. Phải khoá ô đổi vai trò theo vai trò thật, nếu không Admin bấm
  // xem giao diện Intern là mất luôn ô đổi vai trò và không quay lại được.
  const realRole = currentUser.role;
  const isRealAdmin = realRole === 'ADMIN';
  const isPreviewingOtherRole = currentRole !== realRole;

  const handleDeleteAccountClick = () => {
    if (realRole === 'ADMIN') {
      alert('Tài khoản Quản trị viên không thể tự xóa để tránh mất quyền quản lý hệ thống.');
      return;
    }
    const confirmDelete = window.confirm(
      "CẢNH BÁO NGUY HIỂM: Tài khoản của bạn sẽ bị xóa vĩnh viễn và bạn sẽ bị đăng xuất lập tức. Toàn bộ dữ liệu của bạn sẽ bị xóa bỏ.\n\nHành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?"
    );
    if (confirmDelete) {
      onDeleteAccount?.();
    }
  };

  // --- Hồ Sơ Cá Nhân: Tên & Ảnh đại diện ---
  const [profileName, setProfileName] = useState<string>(currentUser.name);
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser.avatar);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const handlePickAvatarFile = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    onUpdateProfile?.({ name: profileName.trim(), avatar: avatarPreview });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // --- Đổi mật khẩu (thu gọn sau 1 nút bấm) ---
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleChangePasswordSubmit = () => {
    setPasswordError('');

    // Mật khẩu hiện tại do SERVER đối chiếu (POST /auth/change-password trả 400 nếu
    // sai). Không kiểm ở client nữa: bản cũ so với `gimasys_pwd_<email>` trong
    // localStorage — tức là lưu mật khẩu thô trên máy, và còn dính sang tài khoản
    // khác dùng lại cùng email.
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn đổi mật khẩu đăng nhập không?\nLần đăng nhập tiếp theo bạn sẽ cần dùng mật khẩu mới.');
    if (!confirmed) return;

    onChangePassword?.(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setIsChangePasswordOpen(false);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  // Local Settings States
  const [standupReminderTime, setStandupReminderTime] = useState<string>('08:30');
  const [notifyMentorOnSubmit, setNotifyMentorOnSubmit] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setToastMessage('Đã lưu cấu hình cài đặt hệ thống thành công!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleResetSettings = () => {
    setStandupReminderTime('08:30');
    setNotifyMentorOnSubmit(true);
    setToastMessage('Đã khôi phục cài đặt mặc định!');
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const rolesList: { role: UserRole; label: string; desc: string; badgeBg: string }[] = [
    {
      role: 'INTERN',
      label: 'Học viên (Thực tập sinh)',
      desc: 'Xem lộ trình đào tạo được giao, tự đánh dấu hoàn thành bài học, gửi báo cáo Standup hằng ngày.',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      role: 'MENTOR',
      label: 'Mentor Hướng dẫn',
      desc: 'Thêm/sửa lộ trình đào tạo, giao Task, phê duyệt báo cáo Standup, đánh giá kết quả thực tập.',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300'
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <SettingsIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>System Preferences</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            Cài Đặt Hệ Thống & Cấu Hình Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tùy chỉnh thông tin người dùng, lộ trình đào tạo, vai trò trải nghiệm và thông báo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetSettings}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-600 transition-colors"
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

      {/* SECTION 1: Hồ Sơ Cá Nhân — Đổi Tên, Ảnh đại diện, Mật khẩu */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">1. Hồ Sơ Cá Nhân</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Đổi ảnh đại diện, tên hiển thị và mật khẩu đăng nhập của tài khoản bạn.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar & Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={avatarPreview}
                alt={profileName}
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-xs shrink-0"
              />
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handlePickAvatarFile}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-600 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Đổi ảnh đại diện</span>
                </button>
                <p className="text-[10px] text-slate-400">JPG, PNG. Ảnh sẽ được lưu ngay khi bấm "Lưu Hồ Sơ" bên dưới.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Tên hiển thị:</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{currentUser.email}</span>
              <span>•</span>
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Gimasys Tech</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Hồ Sơ</span>
              </button>
              {profileSaved && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã lưu!</span>
                </span>
              )}
            </div>
          </div>

          {/* Change Password - thu gọn sau 1 nút bấm */}
          <div className="space-y-3 lg:border-l lg:border-slate-100 dark:lg:border-slate-800 lg:pl-6">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Mật khẩu đăng nhập</span>
            </label>

            {!isChangePasswordOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(true);
                  setPasswordError('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-600 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Đổi Mật Khẩu</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mật khẩu hiện tại"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {passwordError && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-lg px-2.5 py-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePasswordSubmit}
                    className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Xác Nhận Đổi</span>
                  </button>
                </div>
              </div>
            )}

            {passwordSaved && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Đã đổi mật khẩu!</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Dynamic Role Switcher */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">2. Vai Trò Hệ Thống</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentRole === 'ADMIN'
                ? 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi vai trò tài khoản trong hệ thống.'
                : 'Vai trò tài khoản của bạn trong hệ thống.'}
            </p>
          </div>
        </div>

        {/* Current User Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{currentUser.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {currentUser.roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{currentUser.email}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>Gimasys Tech</span>
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

        {/* Role Switcher Grid - CHỈ ADMIN mới có quyền chỉnh vai trò */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>{isRealAdmin ? 'Xem Thử Giao Diện Theo Vai Trò:' : 'Vai Trò Tài Khoản:'}</span>
            </span>
            {!isRealAdmin && (
              <span className="text-[11px] text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 font-bold">
                🔒 Chỉ Quản trị viên (Admin) mới có thể đổi vai trò hiển thị.
              </span>
            )}
          </label>

          {isRealAdmin && isPreviewingOtherRole && (
            <div className="text-[11px] font-bold text-blue-800 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
              Bạn đang xem thử giao diện <strong>{currentRole}</strong>. Vai trò thật của tài khoản
              vẫn là <strong>{realRole}</strong> — quyền trên máy chủ không thay đổi. Chọn lại
              &quot;{realRole}&quot; để quay về giao diện của mình.
            </div>
          )}

          {!isRealAdmin ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
              {(() => {
                const current = rolesList.find(r => r.role === currentRole);
                if (!current) return null;
                return (
                  <>
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{current.label}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${current.badgeBg}`}>
                          {current.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{current.desc}</p>
                    </div>
                  </>
                );
              })()}
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
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{item.label}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${item.badgeBg}`}>
                          {item.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Yêu cầu chuyển vai trò Thực tập sinh <-> Mentor.
            Dùng `realRole` (vai trò thật từ server), không dùng `currentRole` —
            Admin đang xem thử giao diện Intern không được biến thành xin lên Mentor. */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-5">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <span>Đổi Vai Trò Tài Khoản:</span>
          </label>
          <RoleSwitchCard realRole={realRole} onRoleApplied={() => onSessionRefresh?.()} />
        </div>

      </div>

      {/* SECTION 3: Daily Standup & Notification Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">3. Nhắc Nhở Báo Cáo Hằng Ngày & Standup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cài đặt giờ nhắc nộp báo cáo công việc cho Thực tập sinh.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block mb-1">Khung Giờ Nhắc Báo Cáo Standup Ngày:</label>
            <input
              type="time"
              value={standupReminderTime}
              onChange={(e) => setStandupReminderTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">Tự động báo Mentor khi Nộp Báo cáo</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Mentor nhận thông báo review báo cáo của Thực tập sinh.</span>
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">4. Giao Diện</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tùy chỉnh chế độ màu sắc hiển thị của toàn bộ Portal.</p>
          </div>
        </div>

        <div className="text-xs">
          {/* Theme Mode - gắn thẳng vào ThemeContext thật, đổi là áp dụng ngay toàn bộ app */}
          <div className="space-y-2 max-w-sm">
            <label className="font-extrabold text-slate-800 dark:text-slate-200 block">Chế Độ Giao Diện (Theme):</label>
            <div className="flex gap-2">
              {[
                { id: 'light' as const, label: '☀️ Sáng (Chuẩn)', icon: Sun },
                { id: 'dark' as const, label: '🌙 Tối (Eye Care)', icon: Moon }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Danger Zone */}
      {realRole !== 'ADMIN' && (
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl p-6 border border-red-200 dark:border-red-900/60 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-red-100 dark:border-red-950/40">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-xl">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-red-800 dark:text-red-300">5. Khu vực nguy hiểm (Danger Zone)</h3>
              <p className="text-xs text-red-600 dark:text-red-400">Thực hiện các thao tác phá hủy hoặc xóa vĩnh viễn thông tin cá nhân của bạn.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Xóa tài khoản của bạn</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tài khoản này sẽ bị xóa khỏi hệ thống. Bạn sẽ không thể đăng nhập hoặc xem lộ trình/báo cáo nữa.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAccountClick}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
            >
              Xóa tài khoản vĩnh viễn
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
