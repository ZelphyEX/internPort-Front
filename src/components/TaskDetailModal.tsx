import React from 'react';
import { X, Users, CalendarDays, ExternalLink, Trash2, FolderGit2 } from 'lucide-react';
import { TaskItem } from '../types';
import { useDismissablePopup } from '../hooks/useDismissablePopup';

/**
 * Chi tiết một task — mở khi bấm vào thẻ Kanban. Task có thể dùng chung cho
 * NHIỀU người (xem `TaskItem.assignedInternIds/-Names`), nên đây là nơi xem
 * đầy đủ danh sách người nhận (thẻ Kanban chỉ hiện "người đầu +N khác" cho gọn).
 */
interface TaskDetailModalProps {
  task: TaskItem;
  /** Mentor/Admin mới xoá được task. */
  canManage: boolean;
  onClose: () => void;
  onDelete?: (taskId: string) => void;
}

const priorityBadge = (priority: TaskItem['priority']) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-800 border-red-200 font-bold';
    case 'High':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Medium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  canManage,
  onClose,
  onDelete,
}) => {
  const dismiss = useDismissablePopup(onClose);

  const handleDelete = () => {
    if (!onDelete) return;
    if (!window.confirm(`Xoá task "${task.title}"? Không thể hoàn tác.`)) return;
    onDelete(task.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      {...dismiss}
    >
      <div className="w-full max-w-lg my-8 max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${priorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold uppercase">
                {task.status}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {task.title}
            </h3>
            {task.projectName && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <FolderGit2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{task.projectName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Người nhận — đầy đủ, không rút gọn như trên thẻ Kanban */}
          <div>
            <p className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                Người thực hiện
                {task.assignedInternNames.length > 1 && ` (${task.assignedInternNames.length} người)`}
              </span>
            </p>
            {task.assignedInternNames.length === 0 ? (
              <p className="text-slate-400 italic">Chưa giao cho ai.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {task.assignedInternNames.map((name, idx) => (
                  <span
                    key={`${name}-${idx}`}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 font-bold"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
            {task.assignedInternNames.length > 1 && (
              <p className="text-[10px] text-slate-400 mt-1.5">
                Đây là MỘT task dùng chung — ai trong số họ đổi trạng thái là đổi chung, mọi người còn lại cùng thấy ngay.
              </p>
            )}
          </div>

          {/* Mô tả */}
          <div>
            <p className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
              Mô tả công việc
            </p>
            {task.description ? (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            ) : (
              <p className="text-slate-400 italic">Không có mô tả.</p>
            )}
          </div>

          {/* Hạn hoàn thành + mentor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                Hạn hoàn thành
              </p>
              <p className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {task.dueDate || 'Chưa đặt hạn'}
              </p>
            </div>
            {task.mentorName && (
              <div>
                <p className="font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Mentor phụ trách
                </p>
                <p className="text-slate-700 dark:text-slate-300 font-semibold">{task.mentorName}</p>
              </div>
            )}
          </div>

          {task.prUrl && (
            <a
              href={task.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem Pull Request</span>
            </a>
          )}

          {task.mentorFeedback && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-3">
              <p className="font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px] mb-1">
                Nhận xét của Mentor
              </p>
              <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">{task.mentorFeedback}</p>
            </div>
          )}
        </div>

        {/* Footer — xoá task */}
        {canManage && onDelete && (
          <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá task này</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
