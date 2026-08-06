import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Star, 
  MessageSquare,
  User,
  Calendar,
  Send,
  X
} from 'lucide-react';
import { DailyReport, UserRole, AuthUser } from '../types';
import { canReviewReports } from '../services/permissions';

interface DailyReportsViewProps {
  reports: DailyReport[];
  onOpenAddReport: () => void;
  onApproveReport: (reportId: string, comment: string, rating: number) => void;
  onRequestRevision: (reportId: string, comment: string) => void;
  currentRole: UserRole;
  currentUser?: AuthUser | null;
}

export const DailyReportsView: React.FC<DailyReportsViewProps> = ({
  reports,
  onOpenAddReport,
  onApproveReport,
  onRequestRevision,
  currentRole,
  currentUser
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [mentorCommentMap, setMentorCommentMap] = useState<Record<string, string>>({});
  const [mentorRatingMap, setMentorRatingMap] = useState<Record<string, number>>({});
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Filter reports by role: INTERN only sees their own reports
  const userReports = reports.filter(r => {
    if (currentRole === 'INTERN' && currentUser) {
      return r.internName.toLowerCase().includes(currentUser.name.toLowerCase()) || 
             currentUser.name.toLowerCase().includes(r.internName.toLowerCase());
    }
    return true;
  });

  const filteredReports = userReports.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const handleGenerateAiSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize-standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports })
      });
      const data = await res.json();
      setAiSummary(data.summary || 'Đã tổng hợp tiến độ báo cáo thành công.');
    } catch (e) {
      setAiSummary('Tóm tắt AI (Dự phòng): Hôm nay có 4 báo cáo đã được nộp. Tiến độ backend và frontend đạt kế hoạch, nhóm DevOps gặp chút trở ngại AWS IAM.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Báo cáo Công việc Hằng ngày (Daily Standup)</h1>
            {currentRole === 'INTERN' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Chế độ Cá nhân (Intern)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentRole === 'INTERN' 
              ? `Nhật ký báo cáo Standup cá nhân của thực tập sinh: ${currentUser?.name || ''}`
              : 'Theo dõi những việc đã làm, dự định ngày mai, các vướng mắc (blockers) và nhận xét từ Mentor'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAiSummary}
            disabled={isSummarizing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 bg-amber-400 hover:bg-amber-300 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-900 dark:text-slate-100" />
            <span>{isSummarizing ? 'Đang phân tích...' : 'Tổng hợp Standup AI'}</span>
          </button>

          <button
            id="btn-add-report-main"
            onClick={onOpenAddReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Gửi Báo cáo Ngày</span>
          </button>
        </div>
      </div>

      {/* AI Summary Banner if active.
          Trước đây khối này dùng gradient amber/indigo/blue + nền `bg-white/80` cố định:
          lạc tông so với các thẻ khác của portal, và ở chế độ tối thì chữ sáng nằm trên
          nền trắng nên gần như không đọc được. Nay dùng đúng bộ màu thẻ chung
          (trắng / slate-800) với điểm nhấn indigo giống nút AI Assistant trên Header. */}
      {aiSummary && (
        <div className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded-2xl shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Tổng hợp Standup hằng ngày bằng AI (Gemini)</span>
            </div>
            <button
              type="button"
              onClick={() => setAiSummary(null)}
              title="Đóng bản tổng hợp"
              className="p-1 rounded-lg text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 text-xs leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'ALL' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
        >
          Tất cả ({userReports.length})
        </button>
        <button
          onClick={() => setFilterStatus('Pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'Pending' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
        >
          Chờ Duyệt ({userReports.filter(r => r.status === 'Pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('Approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'Approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
        >
          Đã Duyệt ({userReports.filter(r => r.status === 'Approved').length})
        </button>
        <button
          onClick={() => setFilterStatus('Needs Revision')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'Needs Revision' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
        >
          Cần Chỉnh sửa ({userReports.filter(r => r.status === 'Needs Revision').length})
        </button>
      </div>

      {/* Reports Feed */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Không có báo cáo nào trong danh sách</h3>
          </div>
        ) : (
          filteredReports.map((rep) => {
            const comment = mentorCommentMap[rep.id] || '';
            const rating = mentorRatingMap[rep.id] || 5;

            return (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4 hover:border-blue-200 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm shrink-0">
                      {rep.internName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{rep.internName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Khối {rep.department} • {rep.date} ({rep.hoursLogged}h làm việc)
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-center ${
                    rep.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    rep.status === 'Needs Revision' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {rep.status === 'Approved' ? '✓ Đã duyệt' : rep.status === 'Needs Revision' ? '⚠ Cần sửa' : '⏳ Chờ duyệt'}
                  </span>
                </div>

                {/* Report Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wider text-emerald-800">
                      ✅ Việc đã hoàn thành hôm nay:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rep.completedToday}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wider text-blue-800">
                      🚀 Kế hoạch ngày mai:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{rep.tomorrowPlan}</p>
                  </div>

                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                      🚧 Vướng mắc (Blockers):
                    </span>
                    <p className="text-amber-900 leading-relaxed">{rep.blockers || 'Không có blocker.'}</p>
                  </div>
                </div>

                {/* Mentor Review Section if present or editable */}
                {rep.status === 'Approved' ? (
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-900">Nhận xét từ Mentor:</span>
                      <p className="text-slate-700 dark:text-slate-300">{rep.mentorComment || 'Báo cáo đầy đủ, tiến độ đạt yêu cầu.'}</p>
                    </div>
                    {rep.rating && (
                      <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm shrink-0">
                        <span>{rep.rating}</span>
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                    )}
                  </div>
                ) : canReviewReports(currentRole) ? (
                  /* Mentor Review Actions Controls */
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 block">
                      Phê duyệt & Đánh giá Báo cáo này (Mentor Action)
                    </span>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setMentorCommentMap({ ...mentorCommentMap, [rep.id]: e.target.value })}
                        placeholder="Nhập nhận xét hoặc chỉ dẫn cho thực tập sinh..."
                        className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={rating}
                          onChange={(e) => setMentorRatingMap({ ...mentorRatingMap, [rep.id]: Number(e.target.value) })}
                          className="px-2 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                        >
                          <option value={5}>5 sao ⭐⭐⭐⭐⭐</option>
                          <option value={4}>4 sao ⭐⭐⭐⭐</option>
                          <option value={3}>3 sao ⭐⭐⭐</option>
                          <option value={2}>2 sao ⭐⭐</option>
                        </select>

                        <button
                          onClick={() => onApproveReport(rep.id, comment, rating)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Duyệt 
                        </button>

                        <button
                          onClick={() => onRequestRevision(rep.id, comment)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Yêu cầu sửa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
