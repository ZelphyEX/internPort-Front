import React, { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  Check,
  ExternalLink,
  MessageSquare,
  FileText,
  Paperclip,
  CalendarDays,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  GraduationCap,
} from 'lucide-react';
import { DocumentResource, UserRole } from '../types';
import {
  modulesApi,
  moduleDocumentsApi,
  ApiError,
  ApiModuleDocument,
  ApiLessonAttachment,
  ApiDepartment,
  API_DEPARTMENTS,
} from '../services/api';
import { LessonCommentThread } from './LessonCommentThread';

/**
 * Chi tiết một CHẶNG HỌC — mở ra sau khi bấm vào chặng ở màn Lộ trình.
 *
 * Cấu trúc dữ liệu (khớp backend):
 *   Chặng (module) → Bài học (module_document) → Tài liệu đính kèm (lesson_attachments)
 *
 *   * Bài học bắt buộc có TÊN và LINK. Bấm vào tên là mở thẳng link (video/bài giảng).
 *   * Tài liệu đính kèm nằm ngay DƯỚI từng bài học, gán riêng cho bài học đó.
 *   * Mentor đặt hạn cho chặng (`end_date`) -> hiển thị "còn N ngày".
 *
 * Dùng chung cho cả 2 vai trò: Intern thêm được ô tick hoàn thành, Mentor thêm được
 * các thao tác tạo/xoá/gán. ADMIN xem ở chế độ chỉ đọc (`readOnly`).
 */

/** Bài học ở dạng chung cho cả 2 view (mentor: ApiModuleDocument, intern: ApiLessonState). */
export interface PanelLesson {
  module_document_id: number;
  title: string;
  content_url?: string | null;
  attachments?: ApiLessonAttachment[];
  completed?: boolean;
}

export interface PanelModule {
  id: number;
  title: string;
  description?: string | null;
  track?: ApiDepartment | null;
  week_number?: number | null;
  duration_text?: string | null;
  key_skills?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  lessons: PanelLesson[];
}

interface ModuleDetailPanelProps {
  module: PanelModule;
  currentRole: UserRole;
  /** Kho tài liệu để gán vào bài học (Mentor). */
  documents?: DocumentResource[];
  /** true = chỉ xem (Admin, hoặc Intern). */
  readOnly?: boolean;
  /** Intern tick / bỏ tick hoàn thành bài học. */
  onToggleLesson?: (moduleDocumentId: number, completed: boolean) => void;
  busyLessonId?: number | null;
  /** Gọi lại sau mỗi thay đổi để màn cha tải lại dữ liệu. */
  onChanged: () => void;
  onBack: () => void;
}

/** Số ngày còn lại tới hạn; null nếu chưa đặt hạn. */
export const daysUntil = (date?: string | null): number | null => {
  if (!date) return null;
  const end = new Date(date);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

/** Nhãn "còn N ngày / quá hạn" dùng chung cho thẻ chặng học. */
export const ModuleDeadlineChip: React.FC<{ endDate?: string | null }> = ({ endDate }) => {
  const left = daysUntil(endDate);
  if (left === null) return null;
  const cls =
    left < 0
      ? 'bg-red-100 text-red-800 border-red-300'
      : left <= 3
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-emerald-100 text-emerald-800 border-emerald-300';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cls}`}>
      <CalendarDays className="w-3 h-3" />
      {left < 0 ? `Quá hạn ${Math.abs(left)} ngày` : left === 0 ? 'Hạn hôm nay' : `Còn ${left} ngày`}
    </span>
  );
};

export const ModuleDetailPanel: React.FC<ModuleDetailPanelProps> = ({
  module,
  currentRole,
  documents = [],
  readOnly = false,
  onToggleLesson,
  busyLessonId,
  onChanged,
  onBack,
}) => {
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Tạo bài học (tên + link)
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  // Gán tài liệu vào từng bài học
  const [attachingTo, setAttachingTo] = useState<number | null>(null);
  const [attachDocId, setAttachDocId] = useState('');

  // Sửa tên/link một bài học đã có
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonUrl, setEditLessonUrl] = useState('');

  // Sửa thông tin chặng học (tên, mô tả, khối, tuần, thời lượng, kỹ năng, hạn).
  // Gộp chung một form thay vì tách riêng "sửa hạn" như trước — mọi field trong
  // PATCH /modules/{id} đều có chỗ sửa, không chỉ mỗi ngày hạn.
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editTitle, setEditTitle] = useState(module.title);
  const [editDescription, setEditDescription] = useState(module.description || '');
  const [editTrack, setEditTrack] = useState<ApiDepartment | ''>(module.track || '');
  const [editWeek, setEditWeek] = useState(module.week_number != null ? String(module.week_number) : '');
  const [editDuration, setEditDuration] = useState(module.duration_text || '');
  const [editSkills, setEditSkills] = useState((module.key_skills || []).join(', '));
  const [editEndDate, setEditEndDate] = useState(module.end_date || '');

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    setBusy(true);
    try {
      await modulesApi.createLesson(module.id, {
        title: newTitle.trim(),
        content_url: newUrl.trim(),
        position: module.lessons.length + 1,
      });
      setNewTitle('');
      setNewUrl('');
      setIsCreating(false);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Tạo bài học thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLesson = async (lesson: PanelLesson) => {
    if (!window.confirm(`Xoá bài học "${lesson.title}" khỏi chặng này?`)) return;
    setBusy(true);
    try {
      await moduleDocumentsApi.remove(lesson.module_document_id);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Xoá bài học thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const startEditLesson = (lesson: PanelLesson) => {
    setEditingLessonId(lesson.module_document_id);
    setEditLessonTitle(lesson.title);
    setEditLessonUrl(lesson.content_url || '');
  };

  const handleSaveLesson = async (moduleDocumentId: number) => {
    if (!editLessonTitle.trim() || !editLessonUrl.trim()) return;
    setBusy(true);
    try {
      await moduleDocumentsApi.update(moduleDocumentId, {
        title: editLessonTitle.trim(),
        content_url: editLessonUrl.trim(),
      });
      setEditingLessonId(null);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Sửa bài học thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleAttach = async (moduleDocumentId: number) => {
    const docId = Number(attachDocId);
    if (!Number.isInteger(docId) || docId <= 0) {
      alert('Tài liệu này là dữ liệu demo, chưa có trên máy chủ.');
      return;
    }
    setBusy(true);
    try {
      await moduleDocumentsApi.attachDocuments(moduleDocumentId, [docId]);
      setAttachDocId('');
      setAttachingTo(null);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gán tài liệu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleDetach = async (moduleDocumentId: number, documentId: number) => {
    setBusy(true);
    try {
      await moduleDocumentsApi.detachDocument(moduleDocumentId, documentId);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gỡ tài liệu thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const startEditModule = () => {
    setEditTitle(module.title);
    setEditDescription(module.description || '');
    setEditTrack(module.track || '');
    setEditWeek(module.week_number != null ? String(module.week_number) : '');
    setEditDuration(module.duration_text || '');
    setEditSkills((module.key_skills || []).join(', '));
    setEditEndDate(module.end_date || '');
    setIsEditingModule(true);
  };

  const handleSaveModule = async () => {
    if (!editTitle.trim()) return;
    setBusy(true);
    try {
      await modulesApi.update(module.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        track: editTrack || undefined,
        week_number: editWeek.trim() ? Number(editWeek) : undefined,
        duration_text: editDuration.trim(),
        key_skills: editSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        end_date: editEndDate || null,
      });
      setIsEditingModule(false);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Sửa chặng học thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const doneCount = module.lessons.filter((l) => l.completed).length;

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Tất cả chặng học</span>
      </button>

      {/* Đầu trang chặng học */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-[11px] uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" /> Chặng học
          </div>
          {!readOnly && !isEditingModule && (
            <button
              onClick={startEditModule}
              title="Sửa thông tin chặng học"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditingModule ? (
          <div className="space-y-2.5 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Tên chặng học *</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Mô tả</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Khối kỹ thuật</label>
                <select
                  value={editTrack}
                  onChange={(e) => setEditTrack(e.target.value as ApiDepartment)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="">— Không đặt —</option>
                  {API_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tuần thứ mấy</label>
                <input
                  type="number"
                  min={1}
                  value={editWeek}
                  onChange={(e) => setEditWeek(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Thời lượng (VD: 2 tuần)</label>
              <input
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">Kỹ năng chính, cách nhau bởi dấu phẩy</label>
              <input
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Hạn hoàn thành chặng học (hiển thị &quot;còn N ngày&quot;)
              </label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveModule}
                disabled={busy || !editTitle.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Lưu
              </button>
              <button
                onClick={() => setIsEditingModule(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-bold cursor-pointer"
              >
                Huỷ
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black">{module.title}</h2>
            {module.description && <p className="text-xs text-slate-300">{module.description}</p>}

            <div className="flex items-center gap-2 flex-wrap">
              {module.week_number != null && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  Tuần {module.week_number}
                </span>
              )}
              {module.track && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  {module.track}
                </span>
              )}
              {module.duration_text && (
                <span className="text-[11px] text-slate-300">{module.duration_text}</span>
              )}
              <ModuleDeadlineChip endDate={module.end_date} />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                {doneCount}/{module.lessons.length} bài học
              </span>
            </div>

            {module.key_skills && module.key_skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {module.key_skills.map((s) => (
                  <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Danh sách bài học */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Danh sách bài học ({module.lessons.length})
          </h3>
          {!readOnly && (
            <button
              onClick={() => setIsCreating((s) => !s)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo bài học
            </button>
          )}
        </div>

        {/* Form tạo bài học: tên + link (cả hai bắt buộc) */}
        {isCreating && !readOnly && (
          <form
            onSubmit={handleCreateLesson}
            className="bg-blue-50/80 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-900 rounded-2xl p-4 space-y-2.5 text-xs"
          >
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tên bài học *</label>
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Bài 1 — Cài đặt môi trường Spring Boot"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Link bài giảng * <span className="font-normal text-slate-400">(video hoặc tài liệu — bấm vào tên bài học sẽ mở link này)</span>
              </label>
              <input
                required
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300">
                Huỷ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold inline-flex items-center gap-1.5"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Tạo bài học</span>
              </button>
            </div>
          </form>
        )}

        {module.lessons.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            Chặng học này chưa có bài học nào.
          </p>
        )}

        {module.lessons.map((lesson) => (
          <div
            key={lesson.module_document_id}
            className={`rounded-2xl border overflow-hidden transition-all ${
              lesson.completed
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="p-4 space-y-2.5">
              {editingLessonId === lesson.module_document_id ? (
                <div className="space-y-2 text-xs">
                  <input
                    value={editLessonTitle}
                    onChange={(e) => setEditLessonTitle(e.target.value)}
                    placeholder="Tên bài học"
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 font-bold"
                  />
                  <input
                    type="url"
                    value={editLessonUrl}
                    onChange={(e) => setEditLessonUrl(e.target.value)}
                    placeholder="Link bài giảng"
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveLesson(lesson.module_document_id)}
                      disabled={busy || !editLessonTitle.trim() || !editLessonUrl.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingLessonId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold cursor-pointer"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  {onToggleLesson && (
                    <button
                      onClick={() => onToggleLesson(lesson.module_document_id, !!lesson.completed)}
                      disabled={busyLessonId === lesson.module_document_id}
                      title={lesson.completed ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu đã hoàn thành'}
                      className="shrink-0"
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  )}

                  {/* Bấm vào TÊN bài học -> mở thẳng link bài giảng */}
                  {lesson.content_url ? (
                    <a
                      href={lesson.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex-1 text-xs font-bold hover:underline inline-flex items-center gap-1.5 ${
                        lesson.completed
                          ? 'line-through text-slate-500 dark:text-slate-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {lesson.title}
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {lesson.title}
                    </span>
                  )}

                  <button
                    onClick={() =>
                      setExpandedLessonId((id) =>
                        id === lesson.module_document_id ? null : lesson.module_document_id
                      )
                    }
                    title="Thảo luận"
                    className="text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {!readOnly && (
                    <>
                      <button
                        onClick={() => startEditLesson(lesson)}
                        title="Sửa tên/link bài học"
                        className="text-slate-300 hover:text-blue-500 shrink-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson)}
                        disabled={busy}
                        title="Xoá bài học"
                        className="text-slate-300 hover:text-red-500 disabled:opacity-50 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Tài liệu đính kèm — hiển thị NGAY DƯỚI bài học */}
              {(lesson.attachments || []).length > 0 && (
                <div className="pl-7 space-y-1.5">
                  {(lesson.attachments || []).map((a) => (
                    <div
                      key={a.attachment_id}
                      className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5"
                    >
                      <a
                        href={a.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 min-w-0"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{a.title}</span>
                      </a>
                      {!readOnly && (
                        <button
                          onClick={() => handleDetach(lesson.module_document_id, a.document_id)}
                          disabled={busy}
                          title="Gỡ tài liệu"
                          className="text-slate-300 hover:text-red-500 disabled:opacity-50 shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Gán tài liệu cho CHÍNH bài học này */}
              {!readOnly && (
                <div className="pl-7">
                  {attachingTo === lesson.module_document_id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={attachDocId}
                        onChange={(e) => setAttachDocId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="">— Chọn tài liệu từ Thư viện —</option>
                        {documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAttach(lesson.module_document_id)}
                        disabled={busy || !attachDocId}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold"
                      >
                        Gán
                      </button>
                      <button onClick={() => setAttachingTo(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAttachingTo(lesson.module_document_id); setAttachDocId(''); }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Gán tài liệu cho bài học này
                    </button>
                  )}
                </div>
              )}

              {expandedLessonId === lesson.module_document_id && (
                <LessonCommentThread
                  moduleDocumentId={lesson.module_document_id}
                  currentRole={currentRole}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
