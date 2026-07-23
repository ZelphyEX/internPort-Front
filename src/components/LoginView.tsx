import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  KeyRound,
  Globe,
  UserPlus,
  LogIn,
  School,
  Code
} from 'lucide-react';
import { AuthUser, UserRole, Department, Intern } from '../types';
import { DEMO_AUTH_USERS } from '../data/mockData';

interface LoginViewProps {
  onLogin: (user: AuthUser, newIntern?: Intern) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Sign In Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('INTERN');
  const [regDepartment] = useState<Department>('Java Back-End');
  const [regError, setRegError] = useState('');

  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail) return;

    // Nếu tài khoản này đã từng đổi mật khẩu trong phần Cài đặt, đối chiếu lại mật khẩu đã lưu
    const savedPassword = localStorage.getItem(`gimasys_pwd_${loginEmail.trim().toLowerCase()}`);
    if (savedPassword && savedPassword !== loginPassword) {
      setLoginError('Sai mật khẩu. Vui lòng thử lại.');
      return;
    }

    // Check if matches one of demo users or create custom session
    const matched = DEMO_AUTH_USERS.find(
      u => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matched) {
      onLogin(matched);
      return;
    }

    // Default custom login fallback
    const customUser: AuthUser = {
      id: `USR-${Date.now()}`,
      name: loginEmail.split('@')[0].toUpperCase(),
      email: loginEmail.includes('@') ? loginEmail : `${loginEmail}@gimasys.vn`,
      role: 'INTERN',
      roleTitle: 'Thực tập sinh Gimasys',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      internId: 'INT-001'
    };
    onLogin(customUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim()) {
      setRegError('Vui lòng nhập đầy đủ Họ tên và Email.');
      return;
    }

    if (regPassword && regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    const newId = `INT-${Math.floor(100 + Math.random() * 900)}`;

    const newUser: AuthUser = {
      id: `USR-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.includes('@') ? regEmail.trim() : `${regEmail.trim()}@gimasys.vn`,
      role: regRole,
      department: regDepartment,
      roleTitle: regRole === 'ADMIN' ? 'Quản trị viên / HR Manager' :
                 regRole === 'MENTOR' ? 'Mentor Hướng dẫn Kỹ thuật' :
                 `Thực tập sinh ${regDepartment}`,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300`,
      internId: regRole === 'INTERN' ? newId : undefined
    };

    let newInternRecord: Intern | undefined = undefined;

    if (regRole === 'INTERN') {
      newInternRecord = {
        id: newId,
        name: regName.trim(),
        email: newUser.email,
        phone: '0988 123 456',
        avatar: newUser.avatar,
        department: regDepartment,
        roleTitle: `Thực tập sinh ${regDepartment}`,
        mentor: 'Trần Tuấn Anh (Senior Architect)',
        mentorEmail: 'anh.tran@gimasys.vn',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2025-06-30',
        status: 'Active',
        project: 'Chương trình Đào tạo Thực tập sinh & Onboarding Gimasys',
        projectId: 'PRJ-00',
        score: 8.5,
        attendanceRate: 100,
        githubUrl: `https://github.com/${regName.toLowerCase().replace(/\s+/g, '')}`,
        roadmapProgress: 10,
        university: 'Đại học Công nghệ',
        major: 'Công nghệ Thông tin',
        bio: 'Thực tập sinh mới gia nhập Gimasys. Đang theo học lộ trình đào tạo Onboarding.',
        completedTasksCount: 1,
        totalTasksCount: 10,
        skills: [
          { name: regDepartment, level: 75, category: 'Main Track' },
          { name: 'Git Workflow & Code Review', level: 80, category: 'Tools' }
        ]
      };
    }

    onLogin(newUser, newInternRecord);
  };

  const handleQuickDemoClick = (demoUser: AuthUser) => {
    onLogin(demoUser);
  };

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

      {/* Main Form Center */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center z-10">
        
        <div className="text-center max-w-xl mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal Quản lý Thực tập sinh Gimasys v2.5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeMode === 'login' ? 'Đăng nhập Tài khoản Portal' : 'Đăng ký Tài khoản Mới'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {activeMode === 'login' 
              ? 'Nhập email và mật khẩu công ty để truy cập hệ thống công việc & báo cáo.' 
              : 'Tạo tài khoản mới dành cho Thực tập sinh, Mentor hoặc Quản trị viên.'}
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl w-full backdrop-blur-xl space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-900/80 rounded-2xl border border-slate-700/60">
            <button
              onClick={() => setActiveMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập (Sign In)</span>
            </button>

            <button
              onClick={() => setActiveMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeMode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký Tài khoản (Sign Up)</span>
            </button>
          </div>

          {/* TAB 1: SIGN IN FORM */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Email Công ty / Gimasys Account *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="vd: an.nguyen@gimasys.vn hoặc minhanh@edu.gimasys.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Mật khẩu *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const demo = DEMO_AUTH_USERS.find(u => u.role === 'INTERN') || DEMO_AUTH_USERS[3];
                    onLogin(demo);
                  }}
                  className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Google Workspace SSO</span>
                </button>
              </div>

              {/* Demo Accounts Quick Link bar */}
              <div className="pt-4 border-t border-slate-700/60 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">
                  Đăng nhập nhanh bằng tài khoản mẫu để dùng thử:
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEMO_AUTH_USERS.map((usr) => (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleQuickDemoClick(usr)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700 hover:border-blue-400 text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="font-bold">{usr.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                        {usr.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP / REGISTER FORM */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              
              {regError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 font-medium text-xs">
                  {regError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Họ và Tên *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Email Công ty / Sinh viên *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="vd: an.nguyen@gimasys.vn"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Vai trò đăng ký *</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="INTERN">🎓 Thực tập sinh (INTERN)</option>
                  <option value="MENTOR">👨‍🏫 Mentor Hướng dẫn (MENTOR)</option>
                  <option value="ADMIN">🛡️ Quản trị viên Nhân sự (ADMIN)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Mật khẩu *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Xác nhận mật khẩu *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng ký & Bắt đầu Trải nghiệm Portal</span>
                </button>
              </div>

            </form>
          )}

          {/* Footnote */}
          <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Hệ thống Bảo mật Gimasys Enterprise</span>
            </div>
            <span>v2.5.0</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 text-center py-4 text-xs text-slate-500 dark:text-slate-400 z-10">
        © 2025 Công ty Cổ phần Công nghệ Gimasys. Mọi quyền được bảo lưu.
      </footer>

    </div>
  );
};
