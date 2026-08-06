import React, { useEffect, useState } from 'react';
import {
  Compass,
  Plus,
  X,
  Trash2,
  ChevronRight,
  Users as UsersIcon,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { AuthUser, Intern, Group, DocumentResource, UserRole } from '../types';
import { canManageContent, ADMIN_READ_ONLY_NOTE } from '../services/permissions';
import { ModuleDetailPanel, ModuleDeadlineChip } from './ModuleDetailPanel';
import {
  ApiError,
  roadmapsApi,
  modulesApi,
  learningApi,
  tokenStore,
  ApiRoadmapListItem,
  ApiRoadmapDetail,
  ApiModule,
  ApiAssignedRoadmap,
  ApiAssignedRoadmapDetail,
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


// ============================================================================
// Vai trò INTERN — xem lộ trình được giao + đánh dấu hoàn thành bài học.
// ============================================================================

const InternRoadmapView: React.FC = () => {
  const [myRoadmaps, setMyRoadmaps] = useState<ApiAssignedRoadmap[] | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiAssignedRoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLessonId, setBusyLessonId] = useState<number | null>(null);
  // Chặng học đang mở chi tiết (null = đang xem danh sách chặng).
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

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

  const openModule = detail?.modules.find((m) => m.id === openModuleId) || null;

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
        {/* Đang mở chi tiết một chặng học */}
        {detail && openModule && (
          <ModuleDetailPanel
            module={{
              id: openModule.id,
              title: openModule.title,
              track: openModule.track,
              week_number: openModule.week_number,
              duration_text: openModule.duration_text,
              start_date: openModule.start_date,
              end_date: openModule.end_date,
              lessons: openModule.lessons.map((l) => ({
                module_document_id: l.module_document_id,
                title: l.title,
                content_url: l.content_url,
                attachments: l.attachments,
                completed: l.completed,
              })),
            }}
            currentRole="INTERN"
            readOnly
            onToggleLesson={toggleLesson}
            busyLessonId={busyLessonId}
            onChanged={refreshDetail}
            onBack={() => setOpenModuleId(null)}
          />
        )}

        {detail && !openModule && (
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

            {/* Bấm vào chặng học -> mở chi tiết (danh sách bài học + tài liệu đính kèm) */}
            {detail.modules.map((m) => {
              const done = m.lessons.filter((l) => l.completed).length;
              return (
                <button
                  key={m.id}
                  onClick={() => setOpenModuleId(m.id)}
                  className="w-full text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="bg-slate-900 text-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-extrabold text-sm">
                        <GraduationCap className="w-4 h-4 text-amber-400" /> {m.title}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <ModuleHeaderMeta m={m} />
                  </div>
                  <div className="p-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {done}/{m.lessons.length} bài học đã hoàn thành
                    </span>
                    <ModuleDeadlineChip endDate={m.end_date} />
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Vai trò MENTOR/ADMIN — quản lý Roadmap/Module/Lesson + gán cho Intern/Nhóm.
// ============================================================================

const MentorRoadmapView: React.FC<{
  interns: Intern[];
  groups: Group[];
  documents: DocumentResource[];
  /** true với ADMIN: chỉ xem cấu trúc lộ trình, ẩn mọi thao tác tạo/sửa/xoá/gán. */
  readOnly?: boolean;
}> = ({ interns, groups, documents, readOnly = false }) => {
  const [roadmaps, setRoadmaps] = useState<ApiRoadmapListItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ApiRoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  // Chặng học đang mở chi tiết (null = đang xem danh sách chặng).
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState('');
  const [newRoadmapDesc, setNewRoadmapDesc] = useState('');

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleTrack, setNewModuleTrack] = useState<ApiDepartment>('Java Back-End');
  const [newModuleWeek, setNewModuleWeek] = useState(1);
  const [newModuleDuration, setNewModuleDuration] = useState('');
  const [newModuleSkills, setNewModuleSkills] = useState('');
  const [newModuleEnd, setNewModuleEnd] = useState('');


  const [isAssigning, setIsAssigning] = useState(false);
  const [assignInternIds, setAssignInternIds] = useState<string[]>([]);
  const [assignGroupId, setAssignGroupId] = useState('');

  const loadRoadmaps = () => {
    // GET /roadmaps trả Page -> phải lấy .items. Trả thẳng response vào setRoadmaps
    // sẽ khiến roadmaps là object và `roadmaps.map(...)` ném TypeError -> trắng trang.
    roadmapsApi
      .list({ size: 100 })
      .then((res) => setRoadmaps(res.items))
      .catch(() => setRoadmaps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadDetail = (id: number) => {
    roadmapsApi.get(id).then(setDetail).catch(() => setDetail(null));
  };

  const openModule = detail?.modules.find((m) => m.id === openModuleId) || null;

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
        end_date: newModuleEnd || undefined,
      });
      setNewModuleTitle('');
      setNewModuleDuration('');
      setNewModuleSkills('');
      setNewModuleEnd('');
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

  const handleAssign = async () => {
    if (!selectedId) return;

    // Chỉ id số mới là tài khoản thật do backend cấp (dữ liệu demo dùng id dạng "INT-01").
    const numericInternIds = assignInternIds.map(Number).filter(Number.isInteger);
    const hasGroup = !!assignGroupId && Number.isInteger(Number(assignGroupId));

    // Trước đây không kiểm tra gì: chọn rỗng (hoặc chỉ chọn intern demo) vẫn báo
    // "Đã gán lộ trình" dù không gọi API nào — người dùng tưởng đã gán xong.
    if (!hasGroup && numericInternIds.length === 0) {
      alert('Hãy chọn ít nhất một Nhóm hoặc một Thực tập sinh (tài khoản thật) để gán.');
      return;
    }

    try {
      // 2 endpoint trả về 2 dạng khác nhau: assign-group trả số đếm,
      // assign cá nhân trả mảng `created`. Backend bỏ qua người đã được gán trước đó.
      let assignedCount = 0;
      let skippedCount = 0;
      if (hasGroup) {
        const res = await roadmapsApi.assignGroup(selectedId, Number(assignGroupId));
        assignedCount += res.assigned_count;
        skippedCount += res.skipped_existing;
      }
      if (numericInternIds.length > 0) {
        const res = await roadmapsApi.assign(selectedId, numericInternIds);
        assignedCount += res.created.length;
        skippedCount += numericInternIds.length - res.created.length;
      }
      setAssignInternIds([]);
      setAssignGroupId('');
      setIsAssigning(false);
      const skippedNote = skippedCount > 0 ? ` (bỏ qua ${skippedCount} người đã được gán trước đó)` : '';
      alert(
        assignedCount > 0
          ? `Đã gán lộ trình cho ${assignedCount} thực tập sinh${skippedNote}.`
          : 'Không có ai được gán mới — tất cả những người bạn chọn đã được gán lộ trình này từ trước.'
      );
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
        {readOnly ? (
          <p className="text-[11px] font-bold text-blue-800 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5">
            {ADMIN_READ_ONLY_NOTE}
          </p>
        ) : (
          <button
            onClick={() => setIsCreatingRoadmap((s) => !s)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Tạo lộ trình mới
          </button>
        )}

        {isCreatingRoadmap && !readOnly && (
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
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoadmap(r.id);
                  }}
                  className={selectedId === r.id ? 'text-blue-100 hover:text-white' : 'text-slate-300 hover:text-red-500'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
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
        {/* Đang mở chi tiết một chặng học */}
        {detail && openModule && (
          <ModuleDetailPanel
            module={{
              id: openModule.id,
              title: openModule.title,
              description: openModule.description,
              track: openModule.track,
              week_number: openModule.week_number,
              duration_text: openModule.duration_text,
              start_date: openModule.start_date,
              end_date: openModule.end_date,
              lessons: (openModule.documents || []).map((d) => ({
                module_document_id: d.module_document_id,
                title: d.title,
                content_url: d.content_url,
                attachments: d.attachments,
              })),
            }}
            currentRole={readOnly ? 'ADMIN' : 'MENTOR'}
            documents={documents}
            readOnly={readOnly}
            onChanged={() => selectedId != null && loadDetail(selectedId)}
            onBack={() => setOpenModuleId(null)}
          />
        )}

        {detail && !openModule && (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100">{detail.title}</h3>
                {detail.description && <p className="text-xs text-slate-400 mt-0.5">{detail.description}</p>}
              </div>
              {!readOnly && (
                <button
                  onClick={() => setIsAssigning((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  <UsersIcon className="w-3.5 h-3.5" /> Gán lộ trình
                </button>
              )}
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

            {/* Bấm vào chặng học -> mở chi tiết (bài học, tài liệu đính kèm, hạn) */}
            {detail.modules.map((m: ApiModule) => (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 transition-colors"
              >
                <button
                  onClick={() => setOpenModuleId(m.id)}
                  className="w-full text-left bg-slate-900 text-white p-4 flex items-start justify-between gap-2 cursor-pointer"
                >
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
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </button>

                <div className="p-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {(m.documents || []).length} bài học
                  </span>
                  <div className="flex items-center gap-2">
                    <ModuleDeadlineChip endDate={m.end_date} />
                    {!readOnly && (
                      <button
                        onClick={() => handleDeleteModule(m.id)}
                        title="Xoá chặng học"
                        className="text-slate-300 hover:text-red-500 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {readOnly ? null : isAddingModule ? (
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
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Hạn hoàn thành chặng học (hiển thị &quot;còn N ngày&quot;)
                  </label>
                  <input
                    type="date"
                    value={newModuleEnd}
                    onChange={(e) => setNewModuleEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                  />
                </div>
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
        // ADMIN chỉ xem cấu trúc lộ trình; MENTOR mới được tạo/sửa/gán.
        <MentorRoadmapView
          interns={interns}
          groups={groups}
          documents={documents}
          readOnly={!canManageContent(currentRole)}
        />
      )}
    </div>
  );
};
