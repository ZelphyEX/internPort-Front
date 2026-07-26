import React, { useEffect, useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  X,
  FileText,
  Trash2,
  MessageSquare,
  Code2,
  Send,
  Check,
  Users as UsersIcon,
  Loader2,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { AuthUser, Intern, Group, DocumentResource, UserRole } from '../types';
import {
  tokenStore,
  ApiError,
  roadmapsApi,
  modulesApi,
  moduleDocumentsApi,
  learningApi,
  commentsApi,
  ApiRoadmapListItem,
  ApiRoadmapDetail,
  ApiModule,
  ApiAssignedRoadmap,
  ApiAssignedRoadmapDetail,
  ApiComment,
  ApiDepartment,
} from '../services/api';

interface RoadmapViewProps {
  currentRole: UserRole;
  currentUser: AuthUser | null;
  interns: Intern[];
  groups: Group[];
  documents: DocumentResource[];
}

const DEPARTMENT_OPTIONS: ApiDepartment[] = [
  'Java Back-End',
  'React Front-End',
  'Cloud & DevOps',
  'Salesforce/ERP',
  'AI & Data Science',
];

// ============================================================================
// Khối bình luận theo bài học (module_document_id) — dùng chung cho cả 2 vai trò.
// Phong cách "Thảo Luận & Hỏi Đáp Bài Học" mượn từ giao diện Skilljar cũ.
// Lưu ý: ApiComment.user không có field "role" nên không thể tô màu badge theo
// vai trò tác giả như bản mock cũ — mọi bình luận dùng chung 1 kiểu hiển thị.
// ============================================================================

const CommentThread: React.FC<{ moduleDocumentId: number; currentRole: UserRole }> = ({
  moduleDocumentId,
  currentRole,
}) => {
  const [comments, setComments] = useState<ApiComment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    commentsApi
      .list(moduleDocumentId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleDocumentId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.create(moduleDocumentId, content.trim(), null, codeSnippet.trim() || undefined);
      setContent('');
      setCodeSnippet('');
      setShowCode(false);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gửi bình luận thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: number, next: boolean) => {
    try {
      await commentsApi.resolve(commentId, next);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Cập nhật thất bại.');
    }
  };

  return (
    <div className="mt-3 p-4 bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
      <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
        <MessageSquare className="w-3.5 h-3.5" /> Thảo Luận &amp; Hỏi Đáp Bài Học
      </div>

      {loading && <p className="text-[11px] text-slate-400">Đang tải bình luận...</p>}
      {!loading && comments && comments.length === 0 && (
        <p className="text-[11px] text-slate-400 italic">Chưa có bình luận nào.</p>
      )}
      {!loading &&
        comments?.map((c) => (
          <div key={c.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {c.user.avatar_url ? (
                  <img src={c.user.avatar_url} alt={c.user.full_name} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                    {c.user.full_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-slate-700 dark:text-slate-200">{c.user.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.is_resolved && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300">
                    <Check className="w-3 h-3 text-emerald-600" /> Đã Giải Đáp
                  </span>
                )}
                {currentRole !== 'INTERN' && (
                  <button onClick={() => handleResolve(c.id, !c.is_resolved)} className="text-[10px] font-bold text-blue-600 hover:underline">
                    {c.is_resolved ? 'Bỏ đánh dấu' : 'Đánh dấu Đã Giải Đáp'}
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
            {c.code_snippet && (
              <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                <code>{c.code_snippet}</code>
              </pre>
            )}
          </div>
        ))}

      <div className="pt-1 space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Viết câu hỏi / bình luận..."
          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
        {showCode && (
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={3}
            placeholder="Đoạn code / log lỗi đính kèm (tuỳ chọn)"
            className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => setShowCode((s) => !s)} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Code2 className="w-3.5 h-3.5" /> {showCode ? 'Bỏ code' : '+ Đính kèm code snippet / Lỗi log'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Gửi Thảo Luận
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Thẻ "khoá học" (Module) + danh sách bài học — phong cách mượn từ tab Skilljar cũ.
// Dùng chung cho cả INTERN (đọc + tick hoàn thành) và MENTOR (quản lý).
// ============================================================================

function ModuleHeaderMeta({ m }: { m: { track?: ApiDepartment | null; week_number?: number | null; duration_text?: string | null } }) {
  return (
    <div className="flex items-center flex-wrap gap-2 mt-1.5">
      {m.week_number != null && (
        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
          T{m.week_number}
        </span>
      )}
      {m.track && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
          {m.track}
        </span>
      )}
      {m.duration_text && <span className="text-[11px] text-slate-300">{m.duration_text}</span>}
    </div>
  );
}

interface LessonLike {
  module_document_id: number;
  title: string;
  content_url?: string | null;
  completed?: boolean;
}

interface LessonCardProps {
  lesson: LessonLike;
  onToggle?: () => void;
  busy?: boolean;
  expanded: boolean;
  onToggleComments: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onToggle,
  busy,
  expanded,
  onToggleComments,
  showRemove,
  onRemove,
}) => {
  const completed = !!lesson.completed;
  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        completed
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-2xs'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {onToggle ? (
          <button onClick={onToggle} disabled={busy} className="shrink-0">
            {completed ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-slate-400" />}
          </button>
        ) : (
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <span className={`flex-1 text-xs ${completed ? 'line-through text-slate-500 dark:text-slate-400' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
          {lesson.title}
        </span>
        {completed && (
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Đã Hoàn Thành
          </span>
        )}
        <button onClick={onToggleComments} className="text-slate-400 hover:text-slate-600 shrink-0">
          <MessageSquare className="w-4 h-4" />
        </button>
        {showRemove && (
          <button onClick={onRemove} className="text-slate-300 hover:text-red-500 shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {lesson.content_url && (
        <a
          href={lesson.content_url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-md border border-orange-400"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Mở Bài Học Anthropic Skilljar
        </a>
      )}
      {expanded && <CommentThread moduleDocumentId={lesson.module_document_id} currentRole={onToggle ? 'INTERN' : 'MENTOR'} />}
    </div>
  );
}

// ============================================================================
// Vai trò INTERN — xem lộ trình được giao + đánh dấu hoàn thành bài học.
// ============================================================================

const InternRoadmapView: React.FC = () => {
  const [myRoadmaps, setMyRoadmaps] = useState<ApiAssignedRoadmap[] | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiAssignedRoadmapDetail | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLessonId, setBusyLessonId] = useState<number | null>(null);

  useEffect(() => {
    learningApi
      .myRoadmaps()
      .then((res) => {
        setMyRoadmaps(res);
        if (res.length > 0) setSelectedAssignmentId(res[0].assignment_id);
      })
      .catch(() => setMyRoadmaps([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAssignmentId == null) {
      setDetail(null);
      return;
    }
    learningApi
      .myRoadmapDetail(selectedAssignmentId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedAssignmentId]);

  const refreshDetail = () => {
    if (selectedAssignmentId != null) {
      learningApi.myRoadmapDetail(selectedAssignmentId).then(setDetail).catch(() => {});
    }
  };

  const toggleLesson = async (moduleDocumentId: number, completed: boolean) => {
    if (selectedAssignmentId == null) return;
    setBusyLessonId(moduleDocumentId);
    try {
      if (completed) {
        await learningApi.uncompleteLesson(moduleDocumentId, selectedAssignmentId);
      } else {
        await learningApi.completeLesson(moduleDocumentId, selectedAssignmentId);
      }
      refreshDetail();
      // Cập nhật lại % tiến độ trong danh sách lộ trình bên trái.
      learningApi.myRoadmaps().then(setMyRoadmaps).catch(() => {});
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Cập nhật trạng thái bài học thất bại.');
    } finally {
      setBusyLessonId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải lộ trình...
      </div>
    );
  }

  if (!myRoadmaps || myRoadmaps.length === 0) {
    return (
      <div className="p-8 text-center">
        <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Bạn chưa được giao lộ trình học tập nào.</p>
        <p className="text-xs text-slate-400 mt-1">Liên hệ Mentor/Admin để được gán lộ trình.</p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 space-y-2">
        {myRoadmaps.map((r) => (
          <button
            key={r.assignment_id}
            onClick={() => setSelectedAssignmentId(r.assignment_id)}
            className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
              selectedAssignmentId === r.assignment_id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            <p className="font-bold text-sm">{r.title}</p>
            <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${selectedAssignmentId === r.assignment_id ? 'bg-white' : 'bg-blue-600'}`}
                style={{ width: `${r.progress_percent}%` }}
              />
            </div>
            <p className={`text-[11px] mt-1 font-semibold ${selectedAssignmentId === r.assignment_id ? 'text-blue-100' : 'text-slate-400'}`}>
              {r.progress_percent}% • {r.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học'}
            </p>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {detail && (
          <>
            {/* Banner tổng quan lộ trình, phong cách "command center" của Skilljar */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden space-y-3">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" /> Lộ Trình Đào Tạo
              </div>
              <h3 className="relative z-10 text-xl font-black">{detail.title}</h3>
              <div className="relative z-10 w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${detail.progress_percent}%` }}
                />
              </div>
              <p className="relative z-10 text-xl font-black text-emerald-400">{detail.progress_percent}% hoàn thành</p>
            </div>

            {detail.modules.map((m) => (
              <div key={m.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-900 text-white p-4">
                  <div className="flex items-center gap-2 font-extrabold text-sm">
                    <GraduationCap className="w-4 h-4 text-amber-400" /> {m.title}
                  </div>
                  <ModuleHeaderMeta m={m} />
                </div>
                <div className="p-3 space-y-2.5">
                  {m.lessons.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Chưa có bài học nào trong chặng này.</p>}
                  {m.lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.module_document_id}
                      lesson={lesson}
                      busy={busyLessonId === lesson.module_document_id}
                      onToggle={() => toggleLesson(lesson.module_document_id, lesson.completed)}
                      expanded={expandedLessonId === lesson.module_document_id}
                      onToggleComments={() =>
                        setExpandedLessonId((id) => (id === lesson.module_document_id ? null : lesson.module_document_id))
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Vai trò MENTOR/ADMIN — quản lý Roadmap/Module/Lesson + gán cho Intern/Nhóm.
// ============================================================================

const MentorRoadmapView: React.FC<{ interns: Intern[]; groups: Group[]; documents: DocumentResource[] }> = ({
  interns,
  groups,
  documents,
}) => {
  const [roadmaps, setRoadmaps] = useState<ApiRoadmapListItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiRoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);

  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('');
  const [newRoadmapDesc, setNewRoadmapDesc] = useState('');

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleTrack, setNewModuleTrack] = useState<ApiDepartment>('Java Back-End');
  const [newModuleWeek, setNewModuleWeek] = useState(1);
  const [newModuleDuration, setNewModuleDuration] = useState('');
  const [newModuleSkills, setNewModuleSkills] = useState('');

  const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<number | null>(null);
  const [lessonDocumentId, setLessonDocumentId] = useState('');

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignInternIds, setAssignInternIds] = useState<string[]>([]);
  const [assignGroupId, setAssignGroupId] = useState('');

  const loadRoadmaps = () => {
    roadmapsApi
      .list()
      .then(setRoadmaps)
      .catch(() => setRoadmaps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadDetail = (id: number) => {
    roadmapsApi.get(id).then(setDetail).catch(() => setDetail(null));
  };

  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId]);

  const handleCreateRoadmap = async () => {
    if (!newRoadmapTitle.trim()) return;
    try {
      const created = await roadmapsApi.create({ title: newRoadmapTitle.trim(), description: newRoadmapDesc.trim() || undefined });
      setNewRoadmapTitle('');
      setNewRoadmapDesc('');
      setIsCreatingRoadmap(false);
      loadRoadmaps();
      setSelectedId(created.id);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Tạo lộ trình thất bại.');
    }
  };

  const handleDeleteRoadmap = async (id: number) => {
    if (!window.confirm('Xoá lộ trình này? Toàn bộ chặng/bài học bên trong sẽ bị xoá.')) return;
    try {
      await roadmapsApi.remove(id);
      if (selectedId === id) setSelectedId(null);
      loadRoadmaps();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Xoá lộ trình thất bại.');
    }
  };

  const handleAddModule = async () => {
    if (!selectedId || !newModuleTitle.trim()) return;
    try {
      await roadmapsApi.addModule(selectedId, {
        title: newModuleTitle.trim(),
        track: newModuleTrack,
        week_number: newModuleWeek,
        duration_text: newModuleDuration.trim() || undefined,
        key_skills: newModuleSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        position: (detail?.modules.length || 0) + 1,
      });
      setNewModuleTitle('');
      setNewModuleDuration('');
      setNewModuleSkills('');
      setIsAddingModule(false);
      loadDetail(selectedId);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Thêm chặng thất bại.');
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!selectedId || !window.confirm('Xoá chặng học này?')) return;
    try {
      await modulesApi.remove(moduleId);
      loadDetail(selectedId);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Xoá chặng thất bại.');
    }
  };

  const handleAddLesson = async (moduleId: number) => {
    const docId = Number(lessonDocumentId);
    if (!selectedId || !Number.isInteger(docId)) return;
    try {
      await modulesApi.addDocuments(moduleId, [{ document_id: docId, position: 1 }]);
      setLessonDocumentId('');
      setAddingLessonToModuleId(null);
      loadDetail(selectedId);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gán tài liệu thất bại.');
    }
  };

  const handleRemoveLesson = async (moduleDocumentId: number) => {
    if (!selectedId || !window.confirm('Gỡ bài học này khỏi chặng?')) return;
    try {
      await moduleDocumentsApi.remove(moduleDocumentId);
      loadDetail(selectedId);
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gỡ bài học thất bại.');
    }
  };

  const handleAssign = async () => {
    if (!selectedId) return;
    try {
      if (assignGroupId) {
        await roadmapsApi.assignGroup(selectedId, Number(assignGroupId));
      }
      const numericInternIds = assignInternIds.map(Number).filter(Number.isInteger);
      if (numericInternIds.length > 0) {
        await roadmapsApi.assign(selectedId, numericInternIds);
      }
      setAssignInternIds([]);
      setAssignGroupId('');
      setIsAssigning(false);
      alert('Đã gán lộ trình.');
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gán lộ trình thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách lộ trình...
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 space-y-3">
        <button
          onClick={() => setIsCreatingRoadmap((s) => !s)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> Tạo lộ trình mới
        </button>

        {isCreatingRoadmap && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
            <input
              value={newRoadmapTitle}
              onChange={(e) => setNewRoadmapTitle(e.target.value)}
              placeholder="Tên lộ trình"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
            />
            <textarea
              value={newRoadmapDesc}
              onChange={(e) => setNewRoadmapDesc(e.target.value)}
              placeholder="Mô tả (tuỳ chọn)"
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
            />
            <button onClick={handleCreateRoadmap} className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
              Tạo
            </button>
          </div>
        )}

        {(roadmaps || []).map((r) => (
          <div
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              selectedId === r.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm">{r.title}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoadmap(r.id);
                }}
                className={selectedId === r.id ? 'text-blue-100 hover:text-white' : 'text-slate-300 hover:text-red-500'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className={`text-[11px] mt-1 ${selectedId === r.id ? 'text-blue-100' : 'text-slate-400'}`}>
              {r.module_count || 0} chặng học
            </p>
          </div>
        ))}
        {roadmaps && roadmaps.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Chưa có lộ trình nào. Tạo lộ trình đầu tiên bên trên.</p>
        )}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {detail && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{detail.title}</h3>
                {detail.description && <p className="text-xs text-slate-400 mt-0.5">{detail.description}</p>}
              </div>
              <button
                onClick={() => setIsAssigning((s) => !s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <UsersIcon className="w-3.5 h-3.5" /> Gán lộ trình
              </button>
            </div>

            {isAssigning && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Gán theo Nhóm</label>
                  <select
                    value={assignGroupId}
                    onChange={(e) => setAssignGroupId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="">— Không chọn nhóm —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Hoặc chọn từng Thực tập sinh
                  </label>
                  <select
                    multiple
                    value={assignInternIds}
                    onChange={(e) =>
                      setAssignInternIds(
                        Array.from(e.target.selectedOptions).map((o) => (o as HTMLOptionElement).value)
                      )
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 h-28"
                  >
                    {interns.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAssign} className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                  Xác nhận gán
                </button>
              </div>
            )}

            {detail.modules.map((m: ApiModule) => (
              <div key={m.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-900 text-white p-4 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-extrabold text-sm">
                      <GraduationCap className="w-4 h-4 text-amber-400" /> {m.title}
                    </div>
                    <ModuleHeaderMeta m={m} />
                    {m.key_skills && m.key_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.key_skills.map((s) => (
                          <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteModule(m.id)} className="text-slate-400 hover:text-red-400 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2.5">
                  {(m.documents || []).map((lesson) => (
                    <LessonCard
                      key={lesson.module_document_id}
                      lesson={lesson}
                      expanded={expandedLessonId === lesson.module_document_id}
                      onToggleComments={() =>
                        setExpandedLessonId((id) => (id === lesson.module_document_id ? null : lesson.module_document_id))
                      }
                      showRemove
                      onRemove={() => handleRemoveLesson(lesson.module_document_id)}
                    />
                  ))}

                  {addingLessonToModuleId === m.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={lessonDocumentId}
                        onChange={(e) => setLessonDocumentId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="">— Chọn tài liệu có sẵn —</option>
                        {documents.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleAddLesson(m.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                        Gán
                      </button>
                      <button onClick={() => setAddingLessonToModuleId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLessonToModuleId(m.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Gán tài liệu làm bài học
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isAddingModule ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
                <input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Tên chặng học (VD: Java Core Deep Dive)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newModuleTrack}
                    onChange={(e) => setNewModuleTrack(e.target.value as ApiDepartment)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                  >
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={newModuleWeek}
                    onChange={(e) => setNewModuleWeek(Number(e.target.value))}
                    placeholder="Tuần thứ mấy"
                    className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <input
                  value={newModuleDuration}
                  onChange={(e) => setNewModuleDuration(e.target.value)}
                  placeholder="Thời lượng (VD: 2 tuần)"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                />
                <input
                  value={newModuleSkills}
                  onChange={(e) => setNewModuleSkills(e.target.value)}
                  placeholder="Kỹ năng chính, cách nhau bởi dấu phẩy"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddModule} className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">
                    Thêm chặng
                  </button>
                  <button onClick={() => setIsAddingModule(false)} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold">
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingModule(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-blue-400 hover:text-blue-600 text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Thêm chặng học mới
              </button>
            )}
          </>
        )}
        {!detail && (
          <div className="p-8 text-center text-slate-400 text-sm">Chọn 1 lộ trình bên trái để xem chi tiết.</div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Export chính — chọn view theo vai trò.
// ============================================================================

export const RoadmapView: React.FC<RoadmapViewProps> = ({ currentRole, interns, groups, documents }) => {
  const [online, setOnline] = useState(tokenStore.isAuthenticated());

  useEffect(() => {
    setOnline(tokenStore.isAuthenticated());
  }, []);

  if (!online) {
    return (
      <div className="p-8 text-center">
        <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Cần đăng nhập tài khoản thật để xem Lộ trình Đào tạo.</p>
        <p className="text-xs text-slate-400 mt-1">Tài khoản demo cục bộ chưa hỗ trợ tính năng này.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-6 pt-6 flex items-center gap-2.5">
        <Compass className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Lộ trình Đào tạo & Skills</h2>
      </div>
      {currentRole === 'INTERN' ? (
        <InternRoadmapView />
      ) : (
        <MentorRoadmapView interns={interns} groups={groups} documents={documents} />
      )}
    </div>
  );
};
