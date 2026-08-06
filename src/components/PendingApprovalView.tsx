import React from 'react';
import { Building2, Clock, Mail, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

/**
 * Màn hình chờ duyệt cho tài khoản Mentor.
 *
 * Hiển thị khi:
 *   - vừa đăng ký với vai trò MENTOR (backend tạo ở trạng thái PENDING), hoặc
 *   - Mentor chưa được duyệt thử đăng nhập (backend trả 403 `PENDING_APPROVAL`).
 *
 * Tài khoản PENDING bị chặn ở mọi endpoint nên không có gì để hiển thị trong
 * portal — người dùng chỉ có thể chờ Admin duyệt rồi đăng nhập lại.
 */

interface PendingApprovalViewProps {
  email: string;
  onBackToLogin: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({
  email,
  onBackToLogin,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Thương hiệu */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-900 flex items-center justify-center text-white shadow-md font-bold text-lg">
            G
          </div>
          <div className="text-left">
            <p className="font-extrabold text-xl text-white tracking-tight">GIMASYS</p>
            <p className="text-[11px] text-slate-400">Intern Portal</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white">Đang chờ Quản trị viên duyệt</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yêu cầu mở tài khoản <strong className="text-slate-200">Mentor</strong> của bạn đã được
              gửi đi. Quản trị viên sẽ xem xét và phê duyệt trong thời gian sớm nhất.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-200 truncate">{email}</span>
          </div>

          <div className="text-left bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 space-y-2.5">
            <p className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Điều gì xảy ra tiếp theo?</span>
            </p>
            <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Quản trị viên thấy yêu cầu của bạn ở tab <strong className="text-slate-300">Mentor</strong>.</li>
              <li>Sau khi được duyệt, bạn đăng nhập lại bằng chính email và mật khẩu vừa tạo.</li>
              <li>Khi đó bạn có đầy đủ quyền của Mentor: quản lý thực tập sinh, lộ trình, dự án.</li>
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử đăng nhập lại</span>
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về trang đăng nhập</span>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Cần hỗ trợ? Liên hệ bộ phận Đào tạo của Gimasys.</span>
        </p>
      </div>
    </div>
  );
};
