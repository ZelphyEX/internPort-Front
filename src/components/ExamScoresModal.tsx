import React, { useEffect, useState } from 'react';
import {
  X,
  Award,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  BarChart3,
  Mail,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { UserRole } from '../types';
import {
  ApiExamAttempt,
  ApiExamOverview,
  ApiExamSummary,
  EXAM_PASSING_SCORE,
  EXAM_PASS_PERCENT,
  EXAM_SCORE_MAX,
  EXAM_SCORE_MIN,
  examAttemptsApi,
  examPercent,
  tokenStore,
} from '../services/api';
import { ExamAttemptReviewModal } from './ExamAttemptReviewModal';

/**
 * Bảng điểm Anthropic Mock Exam — mở ra khi bấm thẻ "Điểm Năng lực TB".
 *
 * Cách hiển thị theo vai trò:
 *   * INTERN         : điểm từng đề của chính mình.
 *   * MENTOR / ADMIN : điểm của chính mình + bảng điểm toàn bộ Thực tập sinh, bấm
 *                      vào từng người để xem điểm từng đề của họ.
 *
 * Điểm hiển thị là điểm TỐT NHẤT của mỗi đề: phần trăm câu đúng quy về thang 1000
 * (mọi câu tính như nhau), đạt khi đúng từ 80%.
 * Chỉ tính bài làm ở chế độ THI — luyện tập không được ghi nhận.
 */

interface ExamScoresModalProps {
  currentRole: UserRole;
  onClose: () => void;
}

const scoreColor = (score: number) =>
  score >= EXAM_PASSING_SCORE
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

/** Vị trí của điểm trên thang 0..1000, dùng cho chiều dài thanh tiến độ. */
const scorePercent = (score: number) =>
  Math.max(
    0,
    Math.min(100, ((score - EXAM_SCORE_MIN) / (EXAM_SCORE_MAX - EXAM_SCORE_MIN)) * 100)
  );

const PassBadge: React.FC<{ passed: boolean }> = ({ passed }) => (
  <span
    className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 shrink-0 ${
      passed
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
        : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    }`}
  >
    {passed ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
    {passed ? 'Đạt' : 'Chưa đạt'}
  </span>
);

/** Danh sách điểm từng đề của một người. */
const PerExamList: React.FC<{
  summary: ApiExamSummary;
  attempts: ApiExamAttempt[];
  loadingAttempts: boolean;
  onLoadAttempts: () => void;
  onReview: (attempt: ApiExamAttempt) => void;
}> = ({ summary, attempts, loadingAttempts, onLoadAttempts, onReview }) => {
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  if (summary.per_exam.length === 0) {
    return (
      <p className="text-xs text-slate-400 px-3 py-4 text-center">
        Chưa làm bài thi nào ở chế độ thi.
      </p>
    );
  }

  const formatDuration = (seconds?: number | null) => {
    if (seconds === undefined || seconds === null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const handleToggle = (examId: string) => {
    if (expandedExamId === examId) {
      setExpandedExamId(null);
    } else {
      setExpandedExamId(examId);
      onLoadAttempts();
    }
  };

  return (
    <div className="space-y-2">
      {summary.per_exam.map((exam) => {
        const isExpanded = expandedExamId === exam.exam_id;
        const examAttempts = attempts.filter((a) => a.exam_id === exam.exam_id);

        return (
          <div
            key={exam.exam_id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800"
          >
            {/* Exam card header / trigger */}
            <button
              type="button"
              onClick={() => handleToggle(exam.exam_id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-left transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {exam.exam_title}
                  </p>
                  <PassBadge passed={exam.passed} />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        exam.passed ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${scorePercent(exam.best_score)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {exam.attempts} lần làm • lần cuối{' '}
                    {new Date(exam.last_taken_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-base font-black ${scoreColor(exam.best_score)}`}>
                  {exam.best_score}
                </span>
                <span className="text-[10px] text-slate-400 block">/ {EXAM_SCORE_MAX}</span>
              </div>
            </button>

            {/* Expanded attempts log list */}
            {isExpanded && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Lịch sử làm bài thi này:
                </p>
                {loadingAttempts && examAttempts.length === 0 ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải lịch sử...
                  </div>
                ) : examAttempts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 px-1">Không tìm thấy chi tiết lần thi nào.</p>
                ) : (
                  examAttempts.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Lần {examAttempts.length - index}: {attempt.correct_count}/{attempt.total_questions} câu đúng
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Thời gian làm: {formatDuration(attempt.duration_seconds)} •{' '}
                          {new Date(attempt.created_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-black ${scoreColor(attempt.score)}`}>
                          {attempt.score}
                        </span>
                        <PassBadge passed={attempt.passed} />
                        <button
                          type="button"
                          onClick={() => onReview(attempt)}
                          title="Xem lại đáp án đã chọn / đáp án đúng / lời giải thích"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Thẻ tổng hợp của một người (điểm TB, điểm cao nhất, số đề đã đạt). */
const SummaryHeadline: React.FC<{ summary: ApiExamSummary; label: string }> = ({
  summary,
  label,
}) => (
  <div className="grid grid-cols-3 gap-2">
    {[
      {
        title: label,
        value: summary.avg_score !== null && summary.avg_score !== undefined
          ? summary.avg_score.toFixed(1)
          : '—',
        hint:
          summary.avg_score !== null && summary.avg_score !== undefined
            ? `${examPercent(summary.avg_score).toFixed(1)}% • thang ${EXAM_SCORE_MAX}`
            : `thang ${EXAM_SCORE_MAX}`,
      },
      {
        title: 'Điểm cao nhất',
        value: summary.best_score ?? '—',
        hint: `đạt từ ${EXAM_PASS_PERCENT}%`,
      },
      {
        title: 'Đề đã đạt',
        value: `${summary.exams_passed}/${summary.exams_taken}`,
        hint: `${summary.attempts_count} lần làm`,
      },
    ].map((card) => (
      <div
        key={card.title}
        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center"
      >
        <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
          {card.title}
        </span>
        <span className="text-lg font-black text-slate-900 dark:text-slate-100 block">
          {card.value}
        </span>
        <span className="text-[10px] text-slate-400">{card.hint}</span>
      </div>
    ))}
  </div>
);

export const ExamScoresModal: React.FC<ExamScoresModalProps> = ({
  currentRole,
  onClose,
}) => {
  const isMentorOrAdmin = currentRole !== 'INTERN';

  const [mySummary, setMySummary] = useState<ApiExamSummary | null>(null);
  const [overview, setOverview] = useState<ApiExamOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // `overview` đã kèm sẵn điểm từng đề của mọi Thực tập sinh (một truy vấn gom nhóm
  // ở server), nên bấm mở chỉ là xổ ra — không cần gọi thêm API.
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [attemptsByUser, setAttemptsByUser] = useState<Record<number, ApiExamAttempt[]>>({});
  const [loadingAttemptsUserIds, setLoadingAttemptsUserIds] = useState<Record<number, boolean>>({});
  const [reviewAttempt, setReviewAttempt] = useState<ApiExamAttempt | null>(null);

  const loadAttempts = (userId: number) => {
    if (attemptsByUser[userId] || loadingAttemptsUserIds[userId]) return;

    setLoadingAttemptsUserIds((prev) => ({ ...prev, [userId]: true }));
    const promise =
      mySummary && mySummary.user_id === userId
        ? examAttemptsApi.mine({ page: 1, size: 100 })
        : examAttemptsApi.forUser(userId, { page: 1, size: 100 });

    promise
      .then((res) => {
        setAttemptsByUser((prev) => ({ ...prev, [userId]: res.items }));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingAttemptsUserIds((prev) => ({ ...prev, [userId]: false }));
      });
  };

  const load = () => {
    if (!tokenStore.isAuthenticated()) {
      setLoading(false);
      setError('Bảng điểm chỉ có ở phiên đăng nhập thật.');
      return;
    }
    setLoading(true);
    setError('');
    const jobs: Promise<void>[] = [
      examAttemptsApi.mySummary().then(setMySummary, () => {}),
    ];
    if (isMentorOrAdmin) {
      jobs.push(examAttemptsApi.overview().then(setOverview, () => {}));
    }
    Promise.all(jobs)
      .catch(() => setError('Không tải được bảng điểm.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [currentRole]);

  const toggleIntern = (userId: number) =>
    setExpandedId((prev) => (prev === userId ? null : userId));

  const q = search.trim().toLowerCase();
  const interns = (overview?.interns || []).filter(
    (i) =>
      !q ||
      (i.full_name || '').toLowerCase().includes(q) ||
      (i.email || '').toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      {/* Hộp cao tối đa 90vh, chia hai tầng: đầu đề cố định + phần thân TỰ CUỘN.
          Bản cũ để cả hộp dài ra rồi cho đầu đề `sticky top-0`. Sticky là phần tử
          được định vị nên nó VẼ ĐÈ lên danh sách bên dưới — cuộn tới đâu là vài
          người bị khuất sau khối đầu đề tới đó. Nay đầu đề chiếm chỗ thật của nó
          trong flex column, không còn nằm chồng lên ai. Đây cũng là cách các hộp
          thoại khác trong portal đang dùng (xem InternDetailModal). */}
      <div className="w-full max-w-3xl my-8 max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">

        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Bảng điểm Anthropic Mock Exam
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Điểm tốt nhất mỗi đề — phần trăm câu đúng quy về thang {EXAM_SCORE_MAX},
                đạt từ {EXAM_PASS_PERCENT}% ({EXAM_PASSING_SCORE} điểm). Chỉ tính bài làm
                ở chế độ thi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={load}
              title="Tải lại"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải bảng điểm...
            </div>
          ) : (
            <>
              {error && (
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </p>
              )}

              {/* Điểm trung bình toàn bộ Thực tập sinh — chỉ Mentor/Admin */}
              {isMentorOrAdmin && overview && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>{currentRole === 'ADMIN' ? 'Thực tập sinh & Mentor' : 'Toàn bộ Thực tập sinh'}</span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                        Điểm trung bình
                      </span>
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                        {overview.avg_score !== null && overview.avg_score !== undefined
                          ? overview.avg_score.toFixed(1)
                          : '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right leading-relaxed max-w-[55%]">
                      Tính trên <strong>{overview.interns_with_attempts}</strong> /{' '}
                      {overview.interns_total} {currentRole === 'ADMIN' ? 'thành viên' : 'Thực tập sinh'} đã thi ít nhất một bài. Người
                      chưa thi không bị tính là 0 điểm.
                    </p>
                  </div>

                  {overview.interns_total > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={currentRole === 'ADMIN' ? "Tìm thành viên theo tên hoặc email..." : "Tìm Thực tập sinh theo tên hoặc email..."}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {interns.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        {overview.interns_total === 0
                          ? (currentRole === 'ADMIN' ? 'Chưa có thành viên nào trong hệ thống.' : 'Chưa có Thực tập sinh nào trong hệ thống.')
                          : (currentRole === 'ADMIN' ? 'Không tìm thấy thành viên nào khớp.' : 'Không tìm thấy Thực tập sinh nào khớp.')}
                      </p>
                    ) : (
                      interns.map((intern) => {
                        const isOpen = expandedId === intern.user_id;
                        return (
                          <div
                            key={intern.user_id}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleIntern(intern.user_id)}
                              className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer text-left"
                            >
                              {isOpen ? (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                  <span className="truncate">{intern.full_name || `Người dùng #${intern.user_id}`}</span>
                                  {currentRole === 'ADMIN' && intern.role === 'MENTOR' && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded border uppercase bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 shrink-0">
                                      Mentor
                                    </span>
                                  )}
                                  {currentRole === 'ADMIN' && intern.role === 'INTERN' && (
                                    <span className="text-[9px] font-black px-1 py-0.2 rounded border uppercase bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800 shrink-0">
                                      Intern
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{intern.email || '—'}</span>
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                {intern.avg_score !== null && intern.avg_score !== undefined ? (
                                  <>
                                    <span
                                      className={`text-sm font-black ${scoreColor(
                                        Math.round(intern.avg_score)
                                      )}`}
                                    >
                                      {intern.avg_score.toFixed(1)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                      {intern.exams_passed}/{intern.exams_taken} đề đạt
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Chưa thi</span>
                                )}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="p-3 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700">
                                <PerExamList
                                  summary={intern}
                                  attempts={attemptsByUser[intern.user_id] || []}
                                  loadingAttempts={!!loadingAttemptsUserIds[intern.user_id]}
                                  onLoadAttempts={() => loadAttempts(intern.user_id)}
                                  onReview={setReviewAttempt}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Điểm của chính mình */}
              {mySummary && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{isMentorOrAdmin ? 'Điểm thi của bạn' : 'Điểm thi của tôi'}</span>
                  </h4>
                  <SummaryHeadline
                    summary={mySummary}
                    label={isMentorOrAdmin ? 'Điểm TB của bạn' : 'Điểm trung bình'}
                  />
                  <PerExamList
                    summary={mySummary}
                    attempts={attemptsByUser[mySummary.user_id] || []}
                    loadingAttempts={!!loadingAttemptsUserIds[mySummary.user_id]}
                    onLoadAttempts={() => loadAttempts(mySummary.user_id)}
                    onReview={setReviewAttempt}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {reviewAttempt && (
        <ExamAttemptReviewModal attempt={reviewAttempt} onClose={() => setReviewAttempt(null)} />
      )}
    </div>
  );
};
