import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ApiAssignedRoadmap,
  ApiAssignedRoadmapDetail,
  ApiExamSummary,
  EXAM_PASSING_SCORE,
  EXAM_PASS_PERCENT,
  EXAM_SCORE_MAX,
  examAttemptsApi,
  examPercent,
  learningApi,
  tokenStore,
  ApiError,
} from '../services/api';

/**
 * Hai khối trong hồ sơ chi tiết Thực tập sinh (Mentor/Admin xem):
 *
 *   1. **Điểm năng lực** — lấy từ bài thi Anthropic Mock Exam của chính người đó
 *      (`GET /users/{id}/exam-attempts/summary`). Bấm để xổ ra điểm từng đề, giống
 *      bảng điểm ở Dashboard.
 *   2. **Chi tiết Lộ trình Đào tạo** — bấm một lộ trình để xem đã học xong bài nào
 *      (`GET /users/{id}/roadmaps/{assignment_id}`).
 *
 * Nguyên tắc layout: một lộ trình có thể có RẤT NHIỀU bài, nên mọi thứ đều thu gọn
 * mặc định và mỗi vùng danh sách tự cuộn trong khung `max-h` của nó. Modal hồ sơ vì
 * thế không bị dài vô tận hay tràn ra ngoài.
 */

interface InternProgressPanelProps {
  /** Id thật do backend cấp. Dữ liệu mẫu (dạng "INT-01") thì không gọi API. */
  internId: string;
  internName: string;
}

const isBackendId = (id: string) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
};

const scoreColor = (score: number) =>
  score >= EXAM_PASSING_SCORE
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400';

export const InternProgressPanel: React.FC<InternProgressPanelProps> = ({
  internId,
  internName,
}) => {
  const [exam, setExam] = useState<ApiExamSummary | null>(null);
  const [roadmaps, setRoadmaps] = useState<ApiAssignedRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showExamDetail, setShowExamDetail] = useState(false);

  // Chi tiết bài học của lộ trình đang mở — tải theo yêu cầu vì payload khá lớn.
  const [openAssignmentId, setOpenAssignmentId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, ApiAssignedRoadmapDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);

  useEffect(() => {
    if (!isBackendId(internId) || !tokenStore.isAuthenticated()) {
      setLoading(false);
      setError('Hồ sơ này là dữ liệu mẫu, chưa có trên máy chủ nên không có điểm và lộ trình thật.');
      return;
    }
    const id = Number(internId);
    setLoading(true);
    setError('');
    setShowExamDetail(false);
    setOpenAssignmentId(null);
    setDetailCache({});
    Promise.all([
      examAttemptsApi.summaryForUser(id).then(setExam, () => setExam(null)),
      learningApi.roadmapsForUser(id).then(setRoadmaps, () => setRoadmaps([])),
    ]).finally(() => setLoading(false));
  }, [internId]);

  const toggleRoadmap = async (assignmentId: number) => {
    if (openAssignmentId === assignmentId) {
      setOpenAssignmentId(null);
      return;
    }
    setOpenAssignmentId(assignmentId);
    if (detailCache[assignmentId]) return;
    setLoadingDetailId(assignmentId);
    try {
      const detail = await learningApi.roadmapDetailForUser(Number(internId), assignmentId);
      setDetailCache((prev) => ({ ...prev, [assignmentId]: detail }));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail || 'Không tải được chi tiết lộ trình.'
          : 'Không kết nối được máy chủ.'
      );
    } finally {
      setLoadingDetailId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 p-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải điểm và lộ trình của {internName}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </p>
      )}

      {/* ---------------- 1. Điểm năng lực từ Mock Exam ---------------- */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExamDetail((s) => !s)}
          className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
        >
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Điểm Năng lực (Anthropic Mock Exam)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {exam && exam.exams_taken > 0
                ? `${exam.exams_passed}/${exam.exams_taken} đề đã đạt • ${exam.attempts_count} lần làm bài`
                : 'Chưa làm bài thi nào ở chế độ thi'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`text-xl font-black ${
                exam?.avg_score != null ? scoreColor(Math.round(exam.avg_score)) : 'text-slate-400'
              }`}
            >
              {exam?.avg_score != null ? exam.avg_score.toFixed(1) : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block">/ {EXAM_SCORE_MAX}</span>
          </div>
          {showExamDetail ? (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {showExamDetail && (
          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-3">
            {!exam || exam.per_exam.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                Chưa có bài thi nào ở chế độ thi để hiển thị.
              </p>
            ) : (
              // Nhiều đề -> khung cuộn riêng, modal không bị đẩy dài ra.
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {exam.per_exam.map((e) => (
                  <div
                    key={e.exam_id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                        {e.exam_title}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {e.attempts} lần làm • lần cuối{' '}
                        {new Date(e.last_taken_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-black ${scoreColor(e.best_score)}`}>
                        {e.best_score}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {examPercent(e.best_score).toFixed(0)}%
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                        e.passed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                      }`}
                    >
                      {e.passed ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-2">
              Điểm mỗi đề là lần làm tốt nhất. Đạt từ {EXAM_PASS_PERCENT}% số câu đúng
              ({EXAM_PASSING_SCORE}/{EXAM_SCORE_MAX} điểm).
            </p>
          </div>
        )}
      </div>

      {/* ---------------- 2. Chi tiết Lộ trình Đào tạo ---------------- */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Chi tiết Lộ trình Đào tạo
          </p>
          <span className="text-[10px] text-slate-400">({roadmaps.length} lộ trình)</span>
        </div>

        {roadmaps.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Chưa được gán lộ trình nào.</p>
        ) : (
          <div className="space-y-1.5">
            {roadmaps.map((r) => {
              const isOpen = openAssignmentId === r.assignment_id;
              const detail = detailCache[r.assignment_id];
              return (
                <div
                  key={r.assignment_id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => toggleRoadmap(r.assignment_id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {r.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${r.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {r.completed_lessons}/{r.total_lessons} bài • {r.progress_percent}%
                        </span>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50/70 dark:bg-slate-900/50">
                      {loadingDetailId === r.assignment_id ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải danh sách bài học...
                        </div>
                      ) : !detail ? (
                        <p className="text-xs text-slate-400 py-2">Không tải được chi tiết.</p>
                      ) : (
                        // Rất nhiều bài -> khung cuộn cố định thay vì đẩy dài modal.
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {detail.modules.map((m) => {
                            const done = m.lessons.filter((l) => l.completed).length;
                            return (
                              <div key={m.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2 sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 py-1">
                                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate">
                                    {m.position}. {m.title}
                                  </p>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 ${
                                      m.lessons.length > 0 && done === m.lessons.length
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                                        : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                                    }`}
                                  >
                                    {done}/{m.lessons.length}
                                  </span>
                                </div>
                                {m.lessons.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 pl-5">Chặng này chưa có bài học.</p>
                                ) : (
                                  <ul className="space-y-0.5">
                                    {m.lessons.map((l) => (
                                      <li
                                        key={l.module_document_id}
                                        className="flex items-start gap-2 text-[11px] leading-snug"
                                      >
                                        {l.completed ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                        ) : (
                                          <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                                        )}
                                        <span
                                          className={
                                            l.completed
                                              ? 'text-slate-700 dark:text-slate-200'
                                              : 'text-slate-500 dark:text-slate-400'
                                          }
                                        >
                                          {l.title}
                                          {l.completed && l.completed_at && (
                                            <span className="text-slate-400">
                                              {' '}• {new Date(l.completed_at).toLocaleDateString('vi-VN')}
                                            </span>
                                          )}
                                        </span>
                                        {l.content_url && (
                                          <a
                                            href={l.content_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Mở bài học"
                                            className="text-slate-400 hover:text-blue-600 shrink-0 mt-0.5"
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
