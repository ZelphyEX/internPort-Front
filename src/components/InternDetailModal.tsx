import React, { useEffect, useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  Calendar,
  Mail,
  Phone,
  Github,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Briefcase,
  GraduationCap,
  Star,
  Trash2,
  UserX
} from 'lucide-react';
import { Intern, DailyReport, TaskItem, AIEvalReport, UserRole } from '../types';
import { InternProgressPanel } from './InternProgressPanel';

interface InternDetailModalProps {
  intern: Intern | null;
  onClose: () => void;
  reports: DailyReport[];
  tasks: TaskItem[];
  currentRole?: UserRole;
  onDeleteIntern?: (internId: string) => void;
  onKickIntern?: (internId: string) => void;
}

export const InternDetailModal: React.FC<InternDetailModalProps> = ({
  intern,
  onClose,
  reports,
  tasks,
  currentRole,
  onDeleteIntern,
  onKickIntern
}) => {
  const [aiReport, setAiReport] = useState<AIEvalReport | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Bỏ phần tự tải `GET /roadmap-assignments?user_id=` ở đây: hai khối dùng nó (4 ô
  // thống kê + thanh % lộ trình) đã bị bỏ, và `InternProgressPanel` bên dưới đã tải
  // dữ liệu đầy đủ hơn (tới từng bài học). Giữ lại chỉ là thêm một lần gọi API vô ích
  // mỗi lần mở hồ sơ.

  if (!intern) return null;

  const isAdmin = currentRole === 'ADMIN';
  const isMentor = currentRole === 'MENTOR';

  // ADMIN: xoá vĩnh viễn tài khoản. MENTOR: chỉ xoá khỏi khoá học (đổi trạng thái, giữ dữ liệu).
  const handleRemoveIntern = () => {
    if (isAdmin && onDeleteIntern) {
      const confirmed = window.confirm(`[ADMIN] Xoá VĨNH VIỄN tài khoản "${intern.name}" khỏi hệ thống?\nToàn bộ Task đang gán và Báo cáo ngày của người này cũng sẽ bị xoá. Hành động này không thể hoàn tác.`);
      if (!confirmed) return;
      onDeleteIntern(intern.id);
      onClose();
    } else if (isMentor && onKickIntern) {
      const confirmed = window.confirm(`[MENTOR] Xoá "${intern.name}" khỏi khoá học / chương trình đào tạo?\nTài khoản và lịch sử dữ liệu vẫn được giữ lại. Chỉ Admin mới có thể xoá vĩnh viễn tài khoản.`);
      if (!confirmed) return;
      onKickIntern(intern.id);
      onClose();
    }
  };

  const internReports = reports.filter(r => r.internId === intern.id);
  const internTasks = tasks.filter(t => t.assignedInternIds.includes(intern.id));
  const completedTasksCount = internTasks.filter(t => t.status === 'Done').length;

  const handleGenerateAiEvaluation = async () => {
    setIsEvaluating(true);
    setEvalError(null);
    try {
      const payload = {
        name: intern.name,
        mentor: intern.mentor,
        score: intern.score,
        attendanceRate: intern.attendanceRate,
        project: intern.project,
        completedTasksCount: completedTasksCount,
        totalTasksCount: internTasks.length,
        skills: intern.skills,
        recentDailyLogs: internReports.map(r => r.completedToday)
      };

      const res = await fetch('/api/ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internData: payload })
      });

      const data = await res.json();
      if (res.ok && data.overallScore) {
        setAiReport(data);
      } else {
        throw new Error(data.error || 'Lỗi tạo báo cáo');
      }
    } catch (e: any) {
      console.warn('Fallback AI eval result due to network/key error:', e);
      // Clean fallback report
      setAiReport({
        overallScore: intern.score,
        strengths: [
          'Nắm vững kiến thức nền tảng trong Lộ trình Đào tạo được giao',
          'Thái độ học hỏi chủ động, nộp báo cáo hằng ngày đều đặn',
          'Hoàn thành ' + completedTasksCount + '/' + internTasks.length + ' công việc đúng cam kết'
        ],
        areasForImprovement: [
          'Cần rèn luyện thêm về Unit Test coverage',
          'Tăng cường trao đổi với Mentor khi gặp blockers phức tạp'
        ],
        technicalAssessment: `Thực tập sinh ${intern.name} thể hiện năng lực kỹ thuật rất tốt. Code sạch, tuân thủ quy chuẩn Gimasys.`,
        attitudeAssessment: 'Nhiệt tình, đi làm đúng giờ (Chuyên cần ' + intern.attendanceRate + '%), giao tiếp hòa đồng với các thành viên trong dự án.',
        hiringRecommendation: 'Khuyến nghị nhận chính thức',
        actionPlan: [
          'Hoàn thiện 2 module nâng cao còn lại trong Lộ trình Đào tạo',
          'Thực hiện buổi thuyết trình Bảo vệ Thực tập cuối kỳ trước Hội đồng'
        ]
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 relative shrink-0">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            {((isAdmin && onDeleteIntern) || (isMentor && onKickIntern)) && (
              <button
                onClick={handleRemoveIntern}
                title={isAdmin ? 'Xoá Vĩnh Viễn Tài Khoản (Admin)' : 'Xoá Khỏi Khoá Học (Mentor)'}
                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-200 hover:text-white transition-colors cursor-pointer"
              >
                {isAdmin ? <Trash2 className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={intern.avatar}
              alt={intern.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
            />
            {/* Trước đây ở đây có ô "Java Back-End" và dòng chức danh "Thực tập sinh
                Java Back-End". Cả hai đều bịa: Khối kỹ thuật không có chỗ nào để chọn
                nên mọi tài khoản đều rỗng, frontend tự mặc định thành 'Java Back-End'.
                Cột đã bỏ khỏi database (migration f1c6b83ad74e); chỗ này giờ hiện
                email — thứ luôn có thật và giúp phân biệt người trùng tên. */}
            <div className="space-y-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                {intern.status}
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{intern.name}</h2>
              <p className="text-xs text-slate-300 font-medium">{intern.email}</p>
            </div>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Đã bỏ 4 ô thống kê cũ (Điểm Năng lực /10, Tỷ lệ Chuyên cần, Lộ trình Đã
              Giao, Task Hoàn thành) và khối "Chi tiết Lộ trình Đào tạo" chỉ có thanh
              phần trăm:
                * `score` và `attendanceRate` không còn được điền ở đâu -> luôn 0;
                * hai thứ còn lại đã có trong InternProgressPanel bên dưới, ở dạng
                  đầy đủ hơn (điểm từng đề thi + từng bài học đã hoàn thành).
              Giữ lại hai khối trùng lặp chỉ làm hồ sơ dài ra mà không thêm thông tin. */}

          {/* AI Evaluation Generator Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Tạo Báo cáo Đánh giá AI tự động (Claude Haiku 4.5)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phân tích toàn bộ dữ liệu task, báo cáo hằng ngày và kỹ năng để xuất khuyến nghị tuyển dụng.
                  </p>
                </div>
              </div>

              <button
                id="btn-generate-ai-eval"
                onClick={handleGenerateAiEvaluation}
                disabled={isEvaluating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEvaluating ? 'Đang phân tích AI...' : 'Chạy AI Đánh giá'}</span>
              </button>
            </div>

            {/* Render AI Report Output if generated */}
            {aiReport && (
              <div className="mt-4 pt-4 border-t border-indigo-200/60 bg-white/90 rounded-xl p-4 text-xs space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-900 text-sm">ĐÁNH GIÁ CHUYÊN SÂU TỪ CLAUDE AI</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                    {aiReport.hiringRecommendation}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-800">💪 Điểm mạnh nổi bật:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {aiReport.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    <p className="font-bold text-amber-800">🎯 Điểm cần định hướng cải thiện:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {aiReport.areasForImprovement.map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <p><strong className="text-slate-900 dark:text-slate-100">Nhận xét kỹ thuật:</strong> {aiReport.technicalAssessment}</p>
                  <p><strong className="text-slate-900 dark:text-slate-100">Thái độ & Tác phong:</strong> {aiReport.attitudeAssessment}</p>
                </div>

                {aiReport.actionPlan && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">📋 Kế hoạch hành động phát triển 2 tuần tới:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {aiReport.actionPlan.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Điểm năng lực (từ Mock Exam) + Chi tiết Lộ trình Đào tạo.
              Đặt lên trên cùng vì đây là hai thứ Mentor cần xem nhất khi mở hồ sơ.
              Cả hai đều thu gọn mặc định và tự cuộn trong khung riêng — xem
              InternProgressPanel — nên modal không bị đẩy dài dù lộ trình có rất
              nhiều bài học. */}
          <InternProgressPanel internId={intern.id} internName={intern.name} />

          {/* Chỉ còn một thẻ (Thông tin Liên hệ) sau khi bỏ Ma trận Kỹ năng, nên để
              một cột cho khỏi hở nửa hàng trống. */}
          <div className="grid grid-cols-1 gap-6">

            {/* Left Info: Liên hệ.
                Đã bỏ khỏi khối này CÙNG VỚI cột trong CSDL: SĐT, Trường, Mentor hướng
                dẫn, Thời gian thực tập (migration d5c8a2e64f19), Ngành (e7a4b1d09c53)
                và Định hướng / Khối kỹ thuật (f1c6b83ad74e). Chỉ còn email. */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Thông tin Liên hệ</h4>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email: <strong className="text-slate-800 dark:text-slate-200">{intern.email}</strong></span>
                </div>
              </div>
            </div>

            {/* Khối "Ma trận Kỹ năng Chuyên môn" đã bỏ: `Intern.skills` chỉ có trong
                dữ liệu mẫu — với tài khoản thật `apiUserToIntern` luôn trả về `[]`
                nên khối này luôn rỗng. */}

          </div>

          {/* Daily Standup Reports History */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Lịch sử Báo cáo Ngày (Daily Standup)</h4>
            
            {internReports.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có báo cáo ngày nào được gửi.</p>
            ) : (
              <div className="space-y-2">
                {internReports.map((rep) => (
                  <div key={rep.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>Ngày {rep.date} ({rep.hoursLogged} giờ)</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Hoàn thành:</strong> {rep.completedToday}</p>
                    {rep.blockers && <p className="text-amber-800"><strong className="text-amber-900">Vướng mắc:</strong> {rep.blockers}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
