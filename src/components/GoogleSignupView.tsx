import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Mail,
  User,
  Phone,
  School,
  BookOpen,
  Github,
  Layers,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import { AuthUser, Department } from '../types';
import { authApi, ApiError, ApiGoogleProfile } from '../services/api';
import { apiUserToAuthUser, FE_DEPARTMENT_TO_API } from '../services/mappers';

/**
 * Bước 2 của đăng nhập bằng Google: Google đã xác thực email nhưng hệ thống chưa
 * có tài khoản, nên bắt người dùng điền hồ sơ trước khi tạo.
 *
 * Những thứ KHÔNG cho sửa ở đây:
 *   * Email — lấy từ `signup_ticket` mà server đã ký, body có gửi email cũng bị bỏ qua.
 *   * Vai trò — server suy ra từ tên miền email. Muốn đổi thì gửi yêu cầu chuyển
 *     vai trò sau khi vào portal (mục Cài đặt).
 */

const DEPARTMENTS: Department[] = [
  'Java Back-End',
  'React Front-End',
  'Cloud & DevOps',
  'Salesforce / ERP',
  'AI & Data Science',
];

interface GoogleSignupViewProps {
  profile: ApiGoogleProfile;
  signupTicket: string;
  /** Tạo xong và dùng được ngay (Thực tập sinh). */
  onRegistered: (user: AuthUser) => void;
  /** Tạo xong nhưng phải chờ Admin duyệt (Mentor). */
  onPendingApproval: (email: string) => void;
  onCancel: () => void;
}

export const GoogleSignupView: React.FC<GoogleSignupViewProps> = ({
  profile,
  signupTicket,
  onRegistered,
  onPendingApproval,
  onCancel,
}) => {
  const isIntern = profile.assigned_role === 'INTERN';

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Java Back-End');
  const [university, setUniversity] = useState('');
  const [major, setMajor] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError('Vui lòng nhập họ và tên đầy đủ.');
      return;
    }
    if (phone.trim().length < 8) {
      setError('Vui lòng nhập số điện thoại liên hệ (ít nhất 8 số).');
      return;
    }
    // Trường/ngành chỉ bắt buộc với Thực tập sinh — backend kiểm tra lại theo vai trò.
    if (isIntern && (!university.trim() || !major.trim())) {
      setError('Thực tập sinh cần điền cả Trường và Ngành học.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await authApi.completeGoogleSignup({
        signup_ticket: signupTicket,
        full_name: fullName.trim(),
        phone: phone.trim(),
        department: FE_DEPARTMENT_TO_API[department],
        university: university.trim() || undefined,
        major: major.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
      });

      if (res.status === 'AUTHENTICATED' && res.tokens) {
        onRegistered(apiUserToAuthUser(res.tokens.user));
        return;
      }
      // Mentor: tài khoản đã tạo nhưng đang chờ Admin duyệt nên không có token.
      onPendingApproval(res.profile?.email || profile.email);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail || 'Tạo tài khoản thất bại. Vui lòng thử lại.'
          : 'Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10 flex flex-col justify-center z-10">
        {/* Thương hiệu */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-white text-lg">
              G
            </div>
          </div>
          <div className="text-left">
            <p className="font-extrabold text-lg text-white tracking-tight">GIMASYS</p>
            <p className="text-[11px] text-slate-400">Hoàn tất tạo tài khoản</p>
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">

          {/* Tài khoản Google đã xác thực */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Google đã xác thực email của bạn</span>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-slate-900/70 border border-slate-700 rounded-2xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-600 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-black text-white shrink-0">
                  {profile.full_name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white truncate">{profile.full_name}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </p>
              </div>
              <span
                className={`text-[9px] font-black px-2 py-1 rounded-md border uppercase shrink-0 ${
                  isIntern
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                }`}
              >
                {isIntern ? 'Thực tập sinh' : 'Mentor'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vai trò được cấp theo tên miền email nên không sửa được ở đây. Sau khi vào
              portal, bạn có thể gửi yêu cầu chuyển vai trò trong mục{' '}
              <strong className="text-slate-300">Cài đặt</strong>.
            </p>

            {profile.needs_admin_approval && (
              <p className="text-[11px] font-bold text-amber-300 bg-amber-950/30 border border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 mt-px" />
                <span>
                  Tài khoản Mentor cần Quản trị viên duyệt. Sau khi gửi hồ sơ, bạn sẽ thấy
                  màn hình chờ duyệt và chỉ vào được portal khi đã được chấp nhận.
                </span>
              </p>
            )}
          </div>

          {/* Hồ sơ */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-700/60 pt-5">
            <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
              Thông tin bắt buộc
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Họ và tên *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Số điện thoại *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0988 123 456"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isIntern ? 'Định hướng thực tập *' : 'Lĩnh vực phụ trách *'}
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className={`${inputClass} cursor-pointer font-bold`}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {isIntern && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Trường *</label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      placeholder="VD: Đại học Công nghệ"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Ngành học *</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      placeholder="VD: Công nghệ Thông tin"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                GitHub <span className="font-medium text-slate-500">(không bắt buộc)</span>
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/tenban"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] font-bold text-red-300 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="sm:w-auto px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Vào Portal'}</span>
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-slate-700/80 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thông tin này chỉ dùng trong nội bộ chương trình thực tập Gimasys.</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 mt-5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Cần hỗ trợ? Liên hệ bộ phận Đào tạo của Gimasys.</span>
        </p>
      </main>
    </div>
  );
};
