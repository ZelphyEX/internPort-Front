import React from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Flag } from 'lucide-react';
import { ApiExamAttempt } from '../services/api';
import { EXAMS_DATA, ScenarioQuestionBlock } from '../data/examCatalog';
import { useDismissablePopup } from '../hooks/useDismissablePopup';

/**
 * Xem lại chi tiết MỘT lần thi đã lưu: từng câu — đáp án đã chọn, đáp án đúng,
 * lời giải thích. Đề (câu hỏi/đáp án/giải thích) vẫn tĩnh ở frontend
 * (`EXAMS_DATA`, xem MockExamView) — `attempt.answers` chỉ lưu LỰA CHỌN, nên
 * đối chiếu lại với đề tĩnh bằng `exam_id` + số câu.
 *
 * `attempt.answers` là `null` cho các lần thi TRƯỚC khi trường này tồn tại —
 * không có gì để xem lại, chỉ còn điểm tổng (đã hiện ở danh sách lịch sử).
 */
interface ExamAttemptReviewModalProps {
  attempt: ApiExamAttempt;
  onClose: () => void;
}

export const ExamAttemptReviewModal: React.FC<ExamAttemptReviewModalProps> = ({
  attempt,
  onClose,
}) => {
  const exam = EXAMS_DATA.find((e) => e.id === attempt.exam_id);
  const dismiss = useDismissablePopup(onClose);
  // Cờ "xem lại sau" người thi tự đánh dấu lúc làm bài. `null`/`undefined` với các
  // lần thi trước khi trường này tồn tại — khi đó không hiện cờ nào (đúng thực tế:
  // không phải "không đánh dấu câu nào", mà là "không có dữ liệu cờ").
  const flaggedSet = new Set(attempt.flagged ?? []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      {...dismiss}
    >
      <div className="w-full max-w-3xl my-8 max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {attempt.exam_title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {attempt.correct_count}/{attempt.total_questions} câu đúng • điểm {attempt.score} •{' '}
              {new Date(attempt.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!attempt.answers ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-6 text-center">
              Lần thi này chưa lưu chi tiết từng câu (tính năng xem lại chỉ áp dụng cho các lần
              thi mới hơn) — chỉ còn điểm tổng ở trên.
            </p>
          ) : !exam ? (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl px-4 py-6 text-center">
              Không tìm thấy đề "{attempt.exam_id}" trong bộ đề hiện tại (có thể đề đã bị đổi/xoá)
              nên không hiển thị lại được câu hỏi.
            </p>
          ) : (
            exam.questions.map((q, idx) => {
              const userAns = attempt.answers?.[String(q.number)] || [];
              const correctAns = q.correct || [];
              const isCorrect =
                userAns.length === correctAns.length && userAns.every((v) => correctAns.includes(v));

              return (
                <div
                  key={q.number}
                  className={`bg-white dark:bg-slate-800 border rounded-3xl p-5 shadow-2xs space-y-4 ${
                    isCorrect
                      ? 'border-green-100 dark:border-green-900/30'
                      : userAns.length === 0
                      ? 'border-slate-200 dark:border-slate-700'
                      : 'border-red-100 dark:border-red-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      Câu hỏi {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                    {/* Cờ tự đánh dấu lúc làm bài — nhắc lại mình đã băn khoăn ở đâu. */}
                    {flaggedSet.has(q.number) && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-900/40">
                        <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Đã đánh dấu</span>
                      </span>
                    )}
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold border border-green-100 dark:border-green-900/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Chính xác</span>
                      </span>
                    ) : userAns.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                        <span>Chưa làm</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/20">
                        <XCircle className="w-3 h-3" />
                        <span>Sai</span>
                      </span>
                    )}
                    </div>
                  </div>

                  <ScenarioQuestionBlock question={q} compact />

                  <div className="space-y-2 pt-1">
                    {q.choices.map((choice) => {
                      const isOptionCorrect = correctAns.includes(choice.key);
                      const isOptionChosen = userAns.includes(choice.key);

                      let cardClass =
                        'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                      let bulletClass = 'border-slate-300 text-slate-400 dark:text-slate-600';

                      if (isOptionCorrect) {
                        cardClass =
                          'bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300';
                        bulletClass = 'border-green-500 bg-green-500 text-white';
                      } else if (isOptionChosen) {
                        cardClass =
                          'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300';
                        bulletClass = 'border-red-500 bg-red-500 text-white';
                      }

                      return (
                        <div
                          key={choice.key}
                          className={`px-4 py-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-start justify-between gap-3 ${cardClass}`}
                        >
                          <div className="flex gap-2.5 items-start">
                            <span className="font-extrabold shrink-0">{choice.key}.</span>
                            <span className="leading-relaxed">{choice.text}</span>
                          </div>
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[8px] font-bold ${bulletClass}`}
                            >
                              {isOptionChosen && !isOptionCorrect && (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              {isOptionCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-[11px] sm:text-xs leading-relaxed space-y-2">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Giải thích đáp án:
                    </span>

                    {q.explanations && (
                      <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-700/60">
                        {Object.entries(q.explanations).map(([key, exp]) => (
                          <div key={key} className="flex gap-2 items-start">
                            <span className="font-bold text-slate-800 dark:text-slate-300 shrink-0">
                              {key}:
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-slate-600 dark:text-slate-400 font-semibold leading-relaxed pt-1 whitespace-pre-line">
                      {q.questionExplanation}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
