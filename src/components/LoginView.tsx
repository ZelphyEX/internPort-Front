import React, { useEffect, useState } from 'react';

import {
  Building2,
  ShieldCheck,
  Sparkles,
  Globe,
  Loader2,
  AlertCircle,
  AtSign,
  GraduationCap,
  Briefcase,
  KeyRound,
  Lock,
  Mail,
  ChevronDown,
  Clock,
  X,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthUser } from '../types';
// Đăng nhập/đăng ký chỉ qua Google (tự lưu token). Xem src/services/api.ts.
import {
  authApi,
  ApiError,
  ApiGoogleProfile,
  isPendingApprovalError,
  takeSessionEndedReason,
} from '../services/api';
import { apiUserToAuthUser } from '../services/mappers';
import { PendingApprovalView } from './PendingApprovalView';
import { GoogleSignupView } from './GoogleSignupView';

/**
 * Màn đăng nhập — CHỈ có một cách vào: "Đăng nhập bằng Google".
 *
 * Không còn form email/mật khẩu, không còn form đăng ký, không còn tài khoản mẫu:
 *   * email phải do Google xác thực nên không ai đăng ký hộ người khác được;
 *   * backend chỉ nhận tên miền @gimasys.com và @edu.gimasys.com (chốt chặn thật,
 *     vì OAuth Consent Screen đang là "External" nên Google không tự chặn);
 *   * chưa có tài khoản -> chuyển sang màn nhập hồ sơ (GoogleSignupView), tên
 *     hiển thị được lấy sẵn từ tài khoản Google.
 */

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

/**
 * Google Client ID phải có lúc BUILD (Vite thay thế tĩnh `import.meta.env.*`).
 * Thiếu nó thì nút Google không hoạt động, mà giờ đó là đường vào duy nhất — nên
 * báo rõ đây là lỗi cấu hình thay vì để người dùng thấy "đăng nhập thất bại".
 * Phải viết liền mạch `import.meta.env.VITE_GOOGLE_CLIENT_ID`, không optional-chain,
 * nếu không bundle production sẽ không được inline giá trị.
 */
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || '';
const IS_GOOGLE_CONFIGURED = GOOGLE_CLIENT_ID.trim().length > 0;

/**
 * Email tài khoản Quản trị viên hệ thống — điền sẵn ở ô đăng nhập admin cho khỏi
 * phải nhớ. Phải khớp `BOOTSTRAP_ADMIN_EMAIL` của backend; đổi được bằng
 * `VITE_ADMIN_LOGIN_EMAIL` lúc build, hoặc sửa tay ngay trên form.
 */
const DEFAULT_ADMIN_EMAIL =
  (import.meta.env.VITE_ADMIN_LOGIN_EMAIL as string | undefined) || 'admin@gimasys.com';

/** Đọc email trong Google ID token — CHỈ để hiển thị (server mới là nơi xác thực). */
const emailFromGoogleCredential = (credential: string): string => {
  try {
    const raw = credential.split('.')[1];
    if (!raw) return '';
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)));
    return typeof payload?.email === 'string' ? payload.email : '';
  } catch {
    return '';
  }
};

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Vì sao vừa bị đá ra đây (phiên hết hạn / token hỏng). Đọc trong effect chứ
  // không trong useState initializer: StrictMode gọi initializer hai lần, lần thứ
  // hai đã bị xoá mất nên lời nhắn sẽ biến mất ngay ở môi trường dev.
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  useEffect(() => {
    const reason = takeSessionEndedReason();
    if (reason) setSessionNotice(reason);
  }, []);

  // Khác null = đang hiển thị màn "tài khoản Mentor chờ Admin duyệt".
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  // Khác null = Google xác thực xong nhưng chưa có tài khoản -> hiện form hồ sơ.
  const [signup, setSignup] = useState<
    { profile: ApiGoogleProfile; ticket: string } | null
  >(null);

  // Ô đăng nhập Quản trị viên (thu gọn, mở ra khi bấm). Backend chỉ cho ADMIN dùng
  // đường mật khẩu này — Intern/Mentor gọi vào sẽ nhận 403.
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminBusy, setIsAdminBusy] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!adminEmail.trim() || !adminPassword) {
      setAdminError('Vui lòng nhập email và mật khẩu Quản trị viên.');
      return;
    }
    setIsAdminBusy(true);
    try {
      const res = await authApi.login({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      onLogin(apiUserToAuthUser(res.user));
    } catch (err) {
      setAdminError(
        err instanceof ApiError
          ? err.detail || 'Đăng nhập thất bại.'
          : 'Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.'
      );
    } finally {
      setIsAdminBusy(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError('');
    setIsBusy(true);
    try {
      const res = await authApi.loginWithGoogle({ credential });

      if (res.status === 'AUTHENTICATED' && res.tokens) {
        onLogin(apiUserToAuthUser(res.tokens.user));
        return;
      }
      if (res.status === 'NEEDS_REGISTRATION' && res.profile && res.signup_ticket) {
        setSignup({ profile: res.profile, ticket: res.signup_ticket });
        return;
      }
      setError('Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại.');
    } catch (err) {
      // Mentor chưa được Admin duyệt -> đưa sang màn chờ duyệt.
      if (isPendingApprovalError(err)) {
        setPendingEmail(emailFromGoogleCredential(credential) || 'tài khoản của bạn');
        return;
      }
      setError(
        err instanceof ApiError
          ? err.detail || 'Đăng nhập thất bại. Vui lòng thử lại.'
          : 'Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.'
      );
    } finally {
      setIsBusy(false);
    }
  };

  // Tài khoản Mentor chờ duyệt: không vào portal được, hiện màn giải thích.
  if (pendingEmail) {
    return (
      <PendingApprovalView
        email={pendingEmail}
        onBackToLogin={() => {
          setPendingEmail(null);
          setError('');
        }}
      />
    );
  }

  // Google xác thực xong nhưng chưa có tài khoản: bắt điền hồ sơ trước khi tạo.
  if (signup) {
    return (
      <GoogleSignupView
        profile={signup.profile}
        signupTicket={signup.ticket}
        onRegistered={onLogin}
        onPendingApproval={(email) => {
          setSignup(null);
          setPendingEmail(email);
        }}
        onCancel={() => {
          setSignup(null);
          setError('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-white text-lg tracking-wider">
              G
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">GIMASYS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Cổng thông tin Đào tạo & Quản lý Thực tập sinh</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Gimasys Joint Stock Company • gimasys.vn</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center z-10">

        <div className="text-center max-w-xl mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal Quản lý Thực tập sinh Gimasys v2.5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng nhập Portal Gimasys
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ thống dùng tài khoản Google nội bộ. Đăng nhập lần đầu sẽ tự tạo tài khoản
            cho bạn — không cần đặt mật khẩu riêng.
          </p>
        </div>

        {/* Khung đăng nhập */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full backdrop-blur-xl space-y-6">

          {/* Vì sao vừa bị đưa về đây (phiên hết hạn sau 1 ngày, hoặc token hỏng) */}
          {sessionNotice && (
            <p className="text-[11px] font-bold text-amber-300 bg-amber-950/30 border border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-px" />
              <span>{sessionNotice}</span>
            </p>
          )}

          {/* Nút Google — cách duy nhất để vào hệ thống */}
          <div className="space-y-3">
            <div className="flex justify-center min-h-[44px] items-center">
              {!IS_GOOGLE_CONFIGURED ? (
                <p className="text-[11px] font-bold text-amber-300 bg-amber-950/30 border border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>
                    Bản build này thiếu <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> nên
                    không hiện được nút đăng nhập Google. Vui lòng liên hệ bộ phận kỹ thuật để
                    build lại với biến môi trường này.
                  </span>
                </p>
              ) : isBusy ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Đang xác thực với Google...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      void handleGoogleCredential(credentialResponse.credential);
                    } else {
                      setError('Google không trả về thông tin xác thực. Vui lòng thử lại.');
                    }
                  }}
                  onError={() => {
                    setError('Đăng nhập bằng tài khoản Google thất bại. Vui lòng thử lại.');
                  }}
                  theme="filled_blue"
                  shape="pill"
                  size="large"
                  width="320"
                  text="continue_with"
                />
              )}
            </div>

            {error && (
              <p className="text-[11px] font-bold text-red-300 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* Tên miền được phép + vai trò tương ứng */}
          <div className="border-t border-slate-700/60 pt-5 space-y-3">
            <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-blue-400" />
              <span>Email được phép truy cập</span>
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl">
                <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200">@edu.gimasys.com</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sinh viên thực tập — điền hồ sơ (có Trường, Ngành) là vào được ngay.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl">
                <Briefcase className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-200">@gimasys.com</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Nhân viên Gimasys — cũng vào được ngay, không phải chờ duyệt.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Gmail cá nhân hoặc email ngoài hai tên miền trên sẽ bị từ chối. Mọi tài khoản
              mới đều bắt đầu với vai trò <strong className="text-slate-400">Thực tập
              sinh</strong>; nếu bạn là Mentor, vào portal rồi mở mục{' '}
              <strong className="text-slate-400">Cài đặt</strong> để gửi yêu cầu chuyển vai
              trò cho Quản trị viên duyệt.
            </p>
          </div>

          {/* Đăng nhập Quản trị viên — đường vào bằng mật khẩu, không qua Google.
              Cần thiết vì Mentor mới phải có Admin duyệt: nếu Admin cũng phải chờ
              duyệt thì hệ thống kẹt vòng tròn ngay từ đầu. */}
          <div className="border-t border-slate-700/60 pt-5">
            {!isAdminOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsAdminOpen(true);
                  setAdminError('');
                }}
                className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-700 hover:border-amber-500/60 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                  </span>
                  <span className="text-left min-w-0">
                    <span className="block text-xs font-extrabold text-slate-200">
                      Đăng nhập Quản trị viên
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">
                      {DEFAULT_ADMIN_EMAIL} • dùng mật khẩu
                    </span>
                  </span>
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
              </button>
            ) : (
              <form onSubmit={handleAdminSubmit} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đăng nhập Quản trị viên</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminOpen(false);
                      setAdminPassword('');
                      setAdminError('');
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Tài khoản Quản trị viên
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {adminError && (
                  <p className="text-[11px] font-bold text-red-300 bg-red-950/40 border border-red-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                    <span>{adminError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isAdminBusy}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {isAdminBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>{isAdminBusy ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                </button>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Chỉ tài khoản Quản trị viên dùng được ô này. Thực tập sinh và Mentor
                  phải đăng nhập bằng Google.
                </p>
              </form>
            )}
          </div>

          {/* Footnote */}
          <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Hệ thống Bảo mật Gimasys Enterprise</span>
            </div>
            <span>v2.5.0</span>
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 mt-5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Không đăng nhập được? Liên hệ bộ phận Đào tạo của Gimasys.</span>
        </p>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 text-center py-4 text-xs text-slate-500 dark:text-slate-400 z-10">
        © 2025 Công ty Cổ phần Công nghệ Gimasys. Mọi quyền được bảo lưu.
      </footer>

    </div>
  );
};
