import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileText,
  UserCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { Intern, Project, TaskItem, DailyReport, UserRole, AuthUser } from '../types';
import {
  tokenStore,
  dashboardApi,
  examAttemptsApi,
  ApiDashboardMe,
  ApiDashboardOverview,
  ApiExamSummary,
  ApiExamOverview,
  EXAM_SCORE_MAX,
} from '../services/api';
import { ExamScoresModal } from './ExamScoresModal';

interface DashboardViewProps {
  interns: Intern[];
  projects: Project[];
  tasks: TaskItem[];
  reports: DailyReport[];
  currentRole: UserRole;
  currentUser?: AuthUser | null;
  onNavigateTab: (tab: any) => void;
  onSelectIntern: (intern: Intern) => void;
  onOpenAddReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  interns,
  projects,
  tasks,
  reports,
  currentRole,
  currentUser,
  onNavigateTab,
  onSelectIntern,
  onOpenAddReport
}) => {
  const [aiStandupSummary, setAiStandupSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Số liệu tính sẵn từ server (GET /dashboard/me hoặc /dashboard/overview). Online-first:
  // gọi được thì dùng số của server (chính xác hơn vì tính trên toàn bộ dữ liệu, không chỉ
  // những gì client đã tải); lỗi mạng/API thì vẫn dùng số tính tại chỗ bên dưới như cũ.
  const [meDashboard, setMeDashboard] = useState<ApiDashboardMe | null>(null);
  const [overviewDashboard, setOverviewDashboard] = useState<ApiDashboardOverview | null>(null);

  useEffect(() => {
    if (!tokenStore.isAuthenticated()) return;
    if (currentRole === 'INTERN') {
      dashboardApi.me().then(setMeDashboard).catch(() => {/* giữ số tính tại chỗ */});
    } else {
      dashboardApi.overview().then(setOverviewDashboard).catch(() => {/* giữ số tính tại chỗ */});
    }
  }, [currentRole]);

  // "Điểm Năng lực TB" = điểm bài thi Anthropic Mock Exam (thang 100–1000).
  //   * INTERN         -> trung bình điểm tốt nhất mỗi đề của CHÍNH MÌNH.
  //   * MENTOR / ADMIN -> trung bình của toàn bộ Thực tập sinh.
  // Chỉ tính bài làm ở chế độ thi; luyện tập không được ghi nhận.
  const [examSummary, setExamSummary] = useState<ApiExamSummary | null>(null);
  const [examOverview, setExamOverview] = useState<ApiExamOverview | null>(null);
  const [isExamScoresOpen, setIsExamScoresOpen] = useState(false);

  useEffect(() => {
    if (!tokenStore.isAuthenticated()) return;
    if (currentRole === 'INTERN') {
      examAttemptsApi.mySummary().then(setExamSummary).catch(() => {/* ngoại tuyến */});
    } else {
      examAttemptsApi.overview().then(setExamOverview).catch(() => {/* ngoại tuyến */});
    }
  }, [currentRole]);

  const examAvgScore =
    currentRole === 'INTERN'
      ? examSummary?.avg_score ?? null
      : examOverview?.avg_score ?? null;

  const examScoreCaption =
    currentRole === 'INTERN'
      ? examSummary && examSummary.exams_taken > 0
        ? `${examSummary.exams_passed}/${examSummary.exams_taken} đề đã đạt — xem chi tiết`
        : 'Chưa thi bài nào ở chế độ thi — xem chi tiết'
      : examOverview && examOverview.interns_with_attempts > 0
      ? `${examOverview.interns_with_attempts}/${examOverview.interns_total} ${currentRole === 'ADMIN' ? 'thành viên' : 'thực tập sinh'} đã thi — xem bảng điểm`
      : `Chưa có ${currentRole === 'ADMIN' ? 'thành viên' : 'thực tập sinh'} nào thi — xem bảng điểm`;

  // Statistics Calculations
  const totalInterns = interns.length;
  const activeInterns = interns.filter(i => i.status === 'Active' || i.status === 'Onboarding').length;
  const pendingReports = reports.filter(r => r.status === 'Pending');
  const completedTasks = tasks.filter(t => t.status === 'Done');
  
  const avgScore = totalInterns > 0 
    ? (interns.reduce((acc, i) => acc + i.score, 0) / totalInterns).toFixed(1)
    : '0.0';

  // Department Breakdown
  const deptMap: Record<string, number> = {};
  interns.forEach(i => {
    deptMap[i.department] = (deptMap[i.department] || 0) + 1;
  });

  const departmentList = [
    { name: 'Java Back-End', count: deptMap['Java Back-End'] || 0, color: 'bg-amber-500' },
    { name: 'React Front-End', count: deptMap['React Front-End'] || 0, color: 'bg-blue-500' },
    { name: 'Cloud & DevOps', count: deptMap['Cloud & DevOps'] || 0, color: 'bg-emerald-500' },
    { name: 'Salesforce / ERP', count: deptMap['Salesforce / ERP'] || 0, color: 'bg-sky-500' },
    { name: 'AI & Data Science', count: deptMap['AI & Data Science'] || 0, color: 'bg-purple-500' }
  ];

  // Thông tin tiến độ cá nhân của Intern đang đăng nhập (dùng cho thanh progress bar riêng)
  // Nếu tài khoản đang đăng nhập không map được internId cụ thể (VD: đổi vai trò thử nghiệm từ tài khoản Admin/Mentor),
  // vẫn hiển thị tạm hồ sơ intern đầu tiên trong danh sách để demo cho đầy đủ
  const myIntern = (currentUser?.internId ? interns.find(i => i.id === currentUser.internId) : undefined) || interns[0];
  const myTasks = myIntern ? tasks.filter(t => t.assignedInternId === myIntern.id) : [];
  const myCompletedTasks = myTasks.filter(t => t.status === 'Done');
  const myTaskCompletionRate = myTasks.length > 0 ? Math.round((myCompletedTasks.length / myTasks.length) * 100) : 0;

  // AI Standup Summarizer Handler
  const handleGenerateAiSummary = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize-standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports })
      });
      const data = await res.json();
      if (data.summary) {
        setAiStandupSummary(data.summary);
      } else {
        setAiStandupSummary('Đã tổng hợp: Các thực tập sinh hoàn thành tốt tiến độ hôm nay. 1 nhân sự nhóm DevOps gặp vướng mắc về AWS IAM Policy.');
      }
    } catch (e) {
      setAiStandupSummary('Đã tổng hợp (Chế độ dự phòng): Tất cả 4 báo cáo hôm nay đã được ghi nhận. Nhóm Java và React hoạt động tốt, nhóm DevOps cần hỗ trợ cấu hình IAM.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4" />
              <span>Gimasys Intern Management Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentRole === 'ADMIN' ? 'Quản trị viên HR' : currentRole === 'MENTOR' ? 'Mentor Chuyên gia' : 'Thực tập sinh'} 👋
            </h1>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Theo dõi tiến độ học tập, giao task dự án, duyệt báo cáo hằng ngày và đánh giá năng lực thực tập sinh chuẩn hóa quy trình Gimasys.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleGenerateAiSummary}
              disabled={isSummarizing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 bg-amber-400 hover:bg-amber-300 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSummarizing ? 'Đang tóm tắt...' : 'Tóm tắt Standup AI'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('roadmaps')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-md transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-slate-950" />
              <span>Lộ trình Đào tạo & Skills</span>
            </button>

            <button
              onClick={onOpenAddReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Nộp Báo cáo Ngày</span>
            </button>
          </div>
        </div>

        {/* AI Standup Summary Output Box */}
        {aiStandupSummary && (
          <div className="mt-6 pt-4 border-t border-slate-700/80 bg-slate-800/60 rounded-xl p-4 text-xs text-slate-200">
            <div className="flex items-center gap-2 text-amber-300 font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>TỔNG HỢP STANDUP AI TRONG NGÀY (Gemini 3.6 Flash)</span>
            </div>
            <div className="prose prose-invert prose-xs max-w-none whitespace-pre-line leading-relaxed text-slate-300">
              {aiStandupSummary}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Interns */}
        <div 
          onClick={() => currentRole !== 'INTERN' && onNavigateTab('interns')}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all group ${currentRole !== 'INTERN' ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tổng Thực tập sinh</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalInterns}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {activeInterns} đang làm việc
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Chương trình Thực tập K1-2025</p>
        </div>

        {/* Card 2: Standup Submission Rate - Chỉ Admin/Mentor cần theo dõi tổng quan báo cáo cả nhóm */}
        {currentRole !== 'INTERN' && (
        <div
          onClick={() => onNavigateTab('daily_reports')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Báo cáo Standup</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">95.8%</span>
            {(overviewDashboard?.pending_reviews_count ?? pendingReports.length) > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                {overviewDashboard?.pending_reviews_count ?? pendingReports.length} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Tỷ lệ hoàn thành báo cáo ngày</p>
        </div>
        )}

        {/* Card 3: Điểm Năng lực TB = điểm Anthropic Mock Exam (thang 100–1000).
            INTERN: điểm TB các bài thi của chính mình.
            MENTOR/ADMIN: điểm TB của toàn bộ Thực tập sinh.
            Bấm vào để xem điểm từng bài thi (ExamScoresModal). */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExamScoresOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExamScoresOpen(true);
            }
          }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all group cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điểm Năng lực TB</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {examAvgScore !== null ? examAvgScore.toFixed(1) : '—'}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              / {EXAM_SCORE_MAX} điểm
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2 flex items-center gap-1">
            <span>{examScoreCaption}</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </p>
        </div>

        {/* Card 4: Tasks Completed */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {overviewDashboard ? 'Task Hoàn thành (tuần này)' : 'Task Hoàn thành'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {overviewDashboard ? overviewDashboard.completed_tasks_this_week : completedTasks.length}
            </span>
            {!overviewDashboard && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ {tasks.length} task tổng</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">Tiến độ Sprint hiện tại</p>
        </div>

      </div>

      {/* Personal Progress Panel - Chỉ dành riêng cho Intern, hiện % tiến độ dễ nhìn bằng thanh progress bar */}
      {currentRole === 'INTERN' && myIntern && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Tiến Độ Của Bạn</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Theo dõi % hoàn thành lộ trình đào tạo và công việc được giao</p>
          </div>

          <div className="space-y-5">
            {/* Roadmap Progress Bar — số thật từ GET /dashboard/me (tổng hợp mọi lộ trình được giao).
                Không còn số cục bộ dự phòng vì Intern không còn field roadmapProgress đơn lẻ —
                xem chi tiết từng lộ trình tại tab "Lộ trình Đào tạo & Skills". */}
            {meDashboard && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    Lộ trình Đào tạo & Skills ({meDashboard.completed_roadmaps}/{meDashboard.total_roadmaps} hoàn thành)
                  </span>
                  <span className="text-blue-700 dark:text-blue-400 font-extrabold">{meDashboard.overall_progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${meDashboard.overall_progress_percent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Task Completion Progress Bar — ưu tiên số từ GET /dashboard/me, dự phòng số tính tại chỗ */}
            {(() => {
              const taskPct = meDashboard?.task_completion_percent ?? myTaskCompletionRate;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">Task Đã Hoàn Thành</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                      {meDashboard ? `${taskPct}%` : `${taskPct}% (${myCompletedTasks.length}/${myTasks.length})`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${taskPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Grid: Department Distribution & Pending Reports Queue - Chỉ Admin/Mentor cần xem tổng quan cả nhóm, Intern không cần */}
      {currentRole !== 'INTERN' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Department Distribution & Top Interns */}
        <div className="space-y-6 lg:col-span-2">

          {/* Department Breakdown Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Phân bổ Theo Khối Kỹ thuật</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Số lượng nhân sự thực tập sinh theo mảng chuyên môn</p>
              </div>
              <button
                onClick={() => onNavigateTab('interns')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {departmentList.map((dept, idx) => {
                const percentage = totalInterns > 0 ? Math.round((dept.count / totalInterns) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">{dept.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{dept.count} thực tập sinh ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${dept.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Featured Active Interns List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Thực tập sinh Tiêu biểu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Thực tập sinh có điểm đánh giá và tiến độ tốt nhất</p>
              </div>
              <button
                onClick={() => onNavigateTab('interns')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Tất cả thực tập sinh <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {interns.slice(0, 4).map((intern) => (
                <div
                  key={intern.id}
                  onClick={() => onSelectIntern(intern)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group"
                >
                  <img
                    src={intern.avatar}
                    alt={intern.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-700">
                        {intern.name}
                      </p>
                      <span className="text-xs font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        {intern.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{intern.department}</p>
                    <p className="text-[11px] text-slate-400 truncate">{intern.department}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 col): Pending Reviews & Quick Actions - CHỈ Mentor/Admin, Intern không được duyệt báo cáo hay giao task */}
        <div className="space-y-6">

          {/* Standup Review Queue Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Báo cáo Chờ Duyệt</h3>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                {overviewDashboard?.pending_reviews_count ?? pendingReports.length} báo cáo
              </span>
            </div>

            {pendingReports.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p>Tất cả báo cáo ngày đã được duyệt thành công!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReports.map((report) => (
                  <div key={report.id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                      <span>{report.internName}</span>
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {report.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {report.completedToday}
                    </p>
                    <button
                      onClick={() => onNavigateTab('daily_reports')}
                      className="w-full text-center py-1 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-200/60 hover:bg-amber-200 rounded-lg transition-colors"
                    >
                      Duyệt ngay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Khối "Quản lý Nhanh Portal" đã bỏ theo yêu cầu: ba nút trong đó chỉ là
              lối tắt tới việc đã có sẵn ở thanh bên và trong từng tab. */}

        </div>

      </div>
      )}

      {/* Bảng điểm Anthropic Mock Exam — mở từ thẻ "Điểm Năng lực TB" */}
      {isExamScoresOpen && (
        <ExamScoresModal
          currentRole={currentRole}
          onClose={() => setIsExamScoresOpen(false)}
        />
      )}

    </div>
  );
};
