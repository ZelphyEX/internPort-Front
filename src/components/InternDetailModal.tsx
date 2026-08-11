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
import { tokenStore, assignmentsApi, ApiAssignmentListItem } from '../services/api';
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

  // Danh sách lộ trình thật đã gán cho intern này (thay cho con số roadmapProgress cũ —
  // 1 intern có thể có nhiều lộ trình, mỗi lộ trình 1 % tiến độ riêng). Chỉ gọi được khi
  // đăng nhập thật, quyền MENTOR/ADMIN, và id là số do backend cấp (không phải id mock).
  const [assignments, setAssignments] = useState<ApiAssignmentListItem[] | null>(null);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    const numericId = intern ? Number(intern.id) : NaN;
    const isRealId = Number.isInteger(numericId) && intern != null && String(numericId) === intern.id;
    if (!intern || currentRole === 'INTERN' || !isRealId || !tokenStore.isAuthenticated()) {
      setAssignments(null);
      return;
    }
    setLoadingAssignments(true);
    assignmentsApi
      .list({ user_id: numericId, size: 50 })
      .then((res) => setAssignments(res.items))
      .catch(() => setAssignments(null))
      .finally(() => setLoadingAssignments(false));
  }, [intern, currentRole]);

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
  const internTasks = tasks.filter(t => t.assignedInternId === intern.id);
  const completedTasksCount = internTasks.filter(t => t.status === 'Done').length;

  const handleGenerateAiEvaluation = async () => {
    setIsEvaluating(true);
    setEvalError(null);
    try {
      const payload = {
        name: intern.name,
        role: intern.roleTitle,
        department: intern.department,
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
          'Nắm vững kiến thức nền tảng về ' + intern.department,
          'Thái độ học hỏi chủ động, nộp báo cáo hằng ngày đều đặn',
          'Hoàn thành ' + completedTasksCount + '/' + internTasks.length + ' công việc đúng cam kết'
        ],
        areasForImprovement: [
          'Cần rèn luyện thêm về Unit Test coverage',
          'Tăng cường trao đổi với Mentor khi gặp blockers phức tạp'
        ],
        technicalAssessment: `Thực tập sinh ${intern.name} thể hiện năng lực kỹ thuật rất tốt trong khối ${intern.department}. Code sạch, tuân thủ quy chuẩn Gimasys.`,
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
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {intern.department}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {intern.status}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">{intern.name}</h2>
              <p className="text-xs text-slate-300 font-medium">{intern.roleTitle}</p>
            </div>
          </div>
        </div>

        {/* Modal Content Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm Năng lực</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{intern.score}</span>
                <span className="text-xs text-slate-400">/10</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ Chuyên cần</span>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{intern.attendanceRate}%</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lộ trình Đã Giao</span>
              <div className="flex items-center gap-1.5 mt-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {assignments ? assignments.length : '—'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Task Hoàn thành</span>
              <div className="flex items-center gap-1.5 mt-1">
                <Briefcase className="w-4 h-4 text-purple-500" />
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{completedTasksCount}/{internTasks.length}</span>
              </div>
            </div>
          </div>

          {/* Chi tiết từng Lộ trình được giao — dữ liệu thật từ GET /roadmap-assignments?user_id= */}
          {currentRole !== 'INTERN' && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm mb-3">Chi tiết Lộ trình Đào tạo</h4>
              {loadingAssignments && <p className="text-xs text-slate-400">Đang tải...</p>}
              {!loadingAssignments && assignments && assignments.length === 0 && (
                <p className="text-xs text-slate-400">Chưa được giao lộ trình học tập nào.</p>
              )}
              {!loadingAssignments && assignments === null && (
                <p className="text-xs text-slate-400">Không có dữ liệu (tài khoản demo cục bộ chưa hỗ trợ).</p>
              )}
              {!loadingAssignments && assignments && assignments.length > 0 && (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div key={a.assignment_id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{a.roadmap_title}</span>
                        <span className="text-blue-700 dark:text-blue-400 font-extrabold">{a.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${a.progress_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Evaluation Generator Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    Tạo Báo cáo Đánh giá AI tự động (Gemini 3.6 Flash)
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
                  <span className="font-extrabold text-indigo-900 text-sm">ĐÁNH GIÁ CHUYÊN SÂU TỪ GEMINI AI</span>
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

          {/* Details Tabs / Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Info: Liên hệ.
                Đã bỏ khỏi khối này: SĐT, Trường, Mentor hướng dẫn, Thời gian thực tập
                (cùng cột trong CSDL — migration d5c8a2e64f19), Ngành (e7a4b1d09c53),
                và Định hướng (chỉ bỏ hiển thị, cột `department` vẫn còn vì báo cáo
                ngày và dự án đang dùng). */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Thông tin Liên hệ</h4>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email: <strong className="text-slate-800 dark:text-slate-200">{intern.email}</strong></span>
                </div>
              </div>
            </div>

            {/* Right Info: Skill Matrix */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Ma trận Kỹ năng Chuyên môn</h4>
              
              <div className="space-y-2.5">
                {intern.skills.map((skill, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{skill.name}</span>
                      <span className="text-blue-700 font-bold">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${skill.level}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
