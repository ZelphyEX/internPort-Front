import React, { useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import { DailyReport, Intern, Department, AuthUser } from '../types';

interface AddReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  interns: Intern[];
  onAddReport: (report: DailyReport) => void;
  /** Người đang đăng nhập — LUÔN là tác giả của báo cáo (xem ghi chú bên dưới). */
  currentUser: AuthUser | null;
}

export const AddReportModal: React.FC<AddReportModalProps> = ({
  isOpen,
  onClose,
  interns,
  onAddReport,
  currentUser
}) => {
  if (!isOpen) return null;

  // Trước đây form có ô chọn "Thực tập sinh nộp". Đó là sai:
  //   - Backend BỎ QUA `intern_id` trong body POST /daily-reports — tác giả luôn là
  //     người trong token. Chọn tên người khác chỉ làm dữ liệu hiển thị ở máy lệch
  //     với dữ liệu đã lưu trên server (reload là mất).
  //   - Với tài khoản INTERN, danh sách `interns` không được tải (GET /users cần
  //     quyền MENTOR) nên ô chọn hiện toàn dữ liệu demo, thậm chí không có tên mình.
  // Nay tác giả cố định là tài khoản đang đăng nhập.
  const authorId = currentUser?.internId || currentUser?.id || '';
  const authorName = currentUser?.name || 'Tôi';
  const authorDepartment: Department =
    interns.find(i => i.id === authorId)?.department || ('Java Back-End' as Department);

  const [completedToday, setCompletedToday] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [blockers, setBlockers] = useState('');
  const [hoursLogged, setHoursLogged] = useState(8);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedToday) return;

    const newReport: DailyReport = {
      id: `REP-${String(Math.floor(Math.random() * 900) + 100)}`,
      internId: authorId,
      internName: authorName,
      department: authorDepartment,
      date: new Date().toISOString().split('T')[0],
      completedToday,
      tomorrowPlan: tomorrowPlan || 'Tiếp tục hoàn thiện các công việc trong Sprint.',
      blockers: blockers || 'Không có vướng mắc.',
      hoursLogged,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    onAddReport(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" />
            <span>Nộp Báo cáo Ngày (Daily Standup)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Người nộp</label>
              <div
                title="Báo cáo luôn được ghi nhận cho tài khoản đang đăng nhập"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 truncate"
              >
                {authorName}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Số giờ làm việc hôm nay</label>
              <input
                type="number"
                min={1}
                max={12}
                value={hoursLogged}
                onChange={(e) => setHoursLogged(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">✅ Công việc đã hoàn thành hôm nay *</label>
            <textarea
              rows={3}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="VD: Đã hoàn thành API JWT auth, viết unit test cho Redis service..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">🚀 Kế hoạch công việc ngày mai</label>
            <textarea
              rows={2}
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="VD: Nghiên cứu tối ưu hóa PostgreSQL query và review PR..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">🚧 Vướng mắc (Blockers) nếu có</label>
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="VD: Cần cấp thêm quyền truy cập Staging Database AWS..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 dark:text-slate-100 font-bold shadow-xs"
            >
              Gửi Báo cáo ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
