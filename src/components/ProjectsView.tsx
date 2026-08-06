import React, { useEffect, useState } from 'react';
import {
  Kanban,
  Plus,
  Search,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FolderGit2,
  Users,
  Trash2,
  UserPlus,
  UserMinus,
  Loader2,
  X,
  CalendarDays,
} from 'lucide-react';
import { Project, TaskItem, TaskStatus, TaskPriority, UserRole, Intern } from '../types';
import { canManageContent } from '../services/permissions';
import { projectsApi, tokenStore, ApiError, ApiProjectMember } from '../services/api';

/**
 * Tab "Dự án & Kanban Worklog" — cấu trúc 2 tầng:
 *
 *   1. DANH SÁCH DỰ ÁN  — thẻ dự án (tên, mã, mô tả, deadline, tiến độ, số task).
 *                         Mentor tạo dự án mới ở đây.
 *   2. CHI TIẾT DỰ ÁN   — bấm vào một dự án mới mở ra: Kanban RIÊNG của dự án đó,
 *                         bảng Thành viên, và nút "Giao task" chỉ giao trong phạm vi
 *                         dự án này cho đúng thành viên của nó.
 *
 * Thành viên đọc từ `GET /projects/{id}` (danh sách dự án không trả kèm thành viên).
 * Người đã ở trong dự án sẽ biến mất khỏi ô chọn "thêm thành viên".
 */

interface ProjectsViewProps {
  projects: Project[];
  tasks: TaskItem[];
  interns?: Intern[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: TaskItem) => void;
  onDeleteTask?: (taskId: string) => void;
  onCreateProject?: (data: {
    code: string;
    title: string;
    description: string;
    deadline: string;
  }) => Promise<void> | void;
  onDeleteProject?: (projectId: string) => void;
  onReloadProjects?: () => void;
  currentRole: UserRole;
}

const COLUMNS: { title: string; status: TaskStatus; color: string; countColor: string }[] = [
  { title: 'Cần làm', status: 'To Do', color: 'border-slate-300 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40', countColor: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' },
  { title: 'Đang làm', status: 'In Progress', color: 'border-blue-300 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20', countColor: 'bg-blue-100 text-blue-800' },
  { title: 'Đang review', status: 'In Review', color: 'border-purple-300 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20', countColor: 'bg-purple-100 text-purple-800' },
  { title: 'Hoàn thành', status: 'Done', color: 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20', countColor: 'bg-emerald-100 text-emerald-800' },
  { title: 'Vướng mắc', status: 'Blocked', color: 'border-red-300 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20', countColor: 'bg-red-100 text-red-800' },
];

const priorityBadge = (priority: TaskPriority) => {
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

const statusBadge = (status: Project['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'Under Review':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'Completed':
      return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-300';
  }
};

/** Số ngày còn lại tới deadline; null nếu không có hạn. */
const daysLeft = (deadline?: string): number | null => {
  if (!deadline) return null;
  const end = new Date(deadline);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

const DeadlineChip: React.FC<{ deadline?: string }> = ({ deadline }) => {
  const left = daysLeft(deadline);
  if (left === null) {
    return <span className="text-[10px] font-bold text-slate-400">Chưa đặt hạn</span>;
  }
  const cls =
    left < 0
      ? 'bg-red-100 text-red-800 border-red-300'
      : left <= 7
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cls}`}>
      <CalendarDays className="w-3 h-3" />
      {left < 0 ? `Quá hạn ${Math.abs(left)} ngày` : left === 0 ? 'Hết hạn hôm nay' : `Còn ${left} ngày`}
    </span>
  );
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  interns = [],
  onUpdateTaskStatus,
  onAddTask,
  onDeleteTask,
  onCreateProject,
  onDeleteProject,
  onReloadProjects,
  currentRole,
}) => {
  const canManage = canManageContent(currentRole);

  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // --- Tạo dự án ---
  const [isCreating, setIsCreating] = useState(false);
  const [npCode, setNpCode] = useState('');
  const [npTitle, setNpTitle] = useState('');
  const [npDesc, setNpDesc] = useState('');
  const [npDeadline, setNpDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  // --- Thành viên của dự án đang mở ---
  const [members, setMembers] = useState<ApiProjectMember[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // --- Giao task trong phạm vi dự án ---
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [ntTitle, setNtTitle] = useState('');
  const [ntAssignee, setNtAssignee] = useState('');
  const [ntPriority, setNtPriority] = useState<TaskPriority>('Medium');
  const [ntDue, setNtDue] = useState('');
  const [ntDesc, setNtDesc] = useState('');

  const openProject = projects.find((p) => p.id === openProjectId) || null;
  const isBackendId = (id: string) => /^\d+$/.test(id);

  const loadMembers = (projectId: string) => {
    if (!tokenStore.isAuthenticated() || !isBackendId(projectId)) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    projectsApi
      .get(Number(projectId))
      .then((p) => setMembers(p.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  };

  useEffect(() => {
    if (openProjectId) loadMembers(openProjectId);
    else setMembers(null);
    setShowMembers(false);
    setIsAssigningTask(false);
    setMemberSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!npTitle.trim() || !npCode.trim() || !onCreateProject) return;
    setCreating(true);
    try {
      await onCreateProject({
        code: npCode.trim().toUpperCase(),
        title: npTitle.trim(),
        description: npDesc.trim(),
        deadline: npDeadline,
      });
      setNpCode('');
      setNpTitle('');
      setNpDesc('');
      setNpDeadline('');
      setIsCreating(false);
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (internId: string) => {
    if (!openProjectId || !isBackendId(openProjectId) || !isBackendId(internId)) {
      alert('Dự án hoặc tài khoản này là dữ liệu demo, chưa có trên máy chủ.');
      return;
    }
    setSavingMember(true);
    try {
      await projectsApi.addMembers(Number(openProjectId), [Number(internId)]);
      loadMembers(openProjectId);
      onReloadProjects?.();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Thêm thành viên thất bại.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number, name: string) => {
    if (!openProjectId) return;
    if (!window.confirm(`Gỡ "${name}" khỏi dự án này?`)) return;
    setSavingMember(true);
    try {
      await projectsApi.removeMember(Number(openProjectId), userId);
      loadMembers(openProjectId);
      onReloadProjects?.();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gỡ thành viên thất bại.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openProject || !ntTitle.trim() || !ntAssignee) return;
    const assignee = (members || []).find((m) => String(m.id) === ntAssignee);
    onAddTask({
      id: `TSK-${Date.now().toString().slice(-6)}`,
      title: ntTitle.trim(),
      projectId: openProject.id,
      projectName: openProject.title,
      assignedInternId: ntAssignee,
      assignedInternName: assignee?.full_name || '',
      mentorName: '',
      status: 'To Do',
      priority: ntPriority,
      dueDate: ntDue,
      description: ntDesc.trim(),
      createdAt: new Date().toISOString(),
    });
    setNtTitle('');
    setNtAssignee('');
    setNtDue('');
    setNtDesc('');
    setIsAssigningTask(false);
  };

  // ======================================================================== //
  // 1. DANH SÁCH DỰ ÁN
  // ======================================================================== //
  if (!openProject) {
    const q = search.trim().toLowerCase();
    const visible = projects.filter(
      (p) => !q || p.title.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );

    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Dự án & Kanban Worklog
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chọn một dự án để mở bảng Kanban và danh sách thành viên của riêng dự án đó
              ({projects.length} dự án)
            </p>
          </div>
          {canManage && onCreateProject && (
            <button
              onClick={() => setIsCreating((s) => !s)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo dự án mới</span>
            </button>
          )}
        </div>

        {/* Form tạo dự án */}
        {isCreating && canManage && onCreateProject && (
          <form
            onSubmit={handleCreateProject}
            className="bg-blue-50/80 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-900 rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Tạo Dự Án Mới</span>
              </h4>
              <button type="button" onClick={() => setIsCreating(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mã dự án *</label>
                <input
                  required
                  value={npCode}
                  onChange={(e) => setNpCode(e.target.value)}
                  placeholder="VD: CRM-2026"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold uppercase"
                />
              </div>
              <div className="md:col-span-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tên dự án *</label>
                <input
                  required
                  value={npTitle}
                  onChange={(e) => setNpTitle(e.target.value)}
                  placeholder="VD: Hệ thống Quản lý Khách hàng"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mô tả dự án</label>
              <textarea
                rows={2}
                value={npDesc}
                onChange={(e) => setNpDesc(e.target.value)}
                placeholder="Mục tiêu, phạm vi, công nghệ sử dụng..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:w-1/3">
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Deadline toàn dự án</label>
              <input
                type="date"
                value={npDeadline}
                onChange={(e) => setNpDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setIsCreating(false)} className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 text-xs">
                Huỷ
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs inline-flex items-center gap-1.5"
              >
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Tạo dự án</span>
              </button>
            </div>
          </form>
        )}

        {/* Tìm kiếm */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã dự án..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lưới thẻ dự án */}
        {visible.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {projects.length === 0 ? 'Chưa có dự án nào.' : 'Không tìm thấy dự án phù hợp.'}
            </p>
            {canManage && projects.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">Bấm &quot;Tạo dự án mới&quot; để bắt đầu.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((p) => {
              const projectTasks = tasks.filter((t) => t.projectId === p.id);
              const doneCount = projectTasks.filter((t) => t.status === 'Done').length;
              return (
                <div
                  key={p.id}
                  onClick={() => setOpenProjectId(p.id)}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-wider">{p.code}</p>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{p.title}</h3>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase shrink-0 ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <DeadlineChip deadline={p.deadline} />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {p.membersCount} thành viên
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                      <Kanban className="w-3 h-3" /> {doneCount}/{projectTasks.length} task
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${p.progress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{p.progress}% tiến độ</p>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      Mở Kanban <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ======================================================================== //
  // 2. CHI TIẾT DỰ ÁN — Kanban riêng + thành viên
  // ======================================================================== //
  const projectTasks = tasks.filter((t) => t.projectId === openProject.id);
  const memberIds = new Set((members || []).map((m) => String(m.id)));
  const candidates = interns
    .filter((i) => !memberIds.has(i.id))
    .filter((i) => {
      const q = memberSearch.trim().toLowerCase();
      return !q || i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Thanh điều hướng ngược + tiêu đề dự án */}
      <div className="space-y-4">
        <button
          onClick={() => setOpenProjectId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tất cả dự án</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-wider">{openProject.code}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${statusBadge(openProject.status)}`}>
                {openProject.status}
              </span>
              <DeadlineChip deadline={openProject.deadline} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {openProject.title}
            </h1>
            {openProject.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{openProject.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMembers((s) => !s)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                showMembers
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Thành viên ({members ? members.length : openProject.membersCount})</span>
            </button>

            {canManage && (
              <button
                onClick={() => setIsAssigningTask((s) => !s)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Giao task</span>
              </button>
            )}

            {canManage && onDeleteProject && (
              <button
                onClick={() => {
                  if (!window.confirm(`Xoá dự án "${openProject.title}"?`)) return;
                  onDeleteProject(openProject.id);
                  setOpenProjectId(null);
                }}
                title="Xoá dự án"
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bảng thành viên */}
      {showMembers && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Thành viên dự án</span>
          </h3>

          {loadingMembers ? (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
            </p>
          ) : !members || members.length === 0 ? (
            <p className="text-xs text-slate-500">Dự án chưa có thành viên nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{m.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                  </div>
                  {canManage && (
                    <button
                      disabled={savingMember}
                      onClick={() => handleRemoveMember(m.id, m.full_name)}
                      title="Gỡ khỏi dự án"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 shrink-0"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Kho chọn: người đã vào dự án sẽ biến mất khỏi đây */}
          {canManage && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Thêm thành viên vào dự án
              </p>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Tìm thực tập sinh..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {candidates.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {interns.length === 0
                    ? 'Chưa tải được danh sách thực tập sinh.'
                    : 'Tất cả thực tập sinh phù hợp đã ở trong dự án này.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {candidates.map((i) => (
                    <button
                      key={i.id}
                      disabled={savingMember}
                      onClick={() => handleAddMember(i.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 hover:text-blue-600 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{i.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Form giao task — chỉ trong dự án này, chỉ cho thành viên dự án */}
      {isAssigningTask && canManage && (
        <form
          onSubmit={handleAssignTask}
          className="bg-blue-50/80 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-900 rounded-2xl p-5 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-blue-950 dark:text-blue-200 text-sm">
              Giao task trong dự án &quot;{openProject.title}&quot;
            </h4>
            <button type="button" onClick={() => setIsAssigningTask(false)} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Tên công việc *</label>
            <input
              required
              value={ntTitle}
              onChange={(e) => setNtTitle(e.target.value)}
              placeholder="VD: Viết API đăng nhập JWT"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Giao cho *</label>
              <select
                required
                value={ntAssignee}
                onChange={(e) => setNtAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="">— Chọn thành viên —</option>
                {(members || []).map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.full_name}
                  </option>
                ))}
              </select>
              {(members || []).length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  Dự án chưa có thành viên — hãy thêm thành viên trước khi giao task.
                </p>
              )}
            </div>
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mức ưu tiên</label>
              <select
                value={ntPriority}
                onChange={(e) => setNtPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Hạn hoàn thành</label>
              <input
                type="date"
                value={ntDue}
                onChange={(e) => setNtDue(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Mô tả công việc</label>
            <textarea
              rows={2}
              value={ntDesc}
              onChange={(e) => setNtDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAssigningTask(false)} className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 text-xs">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={(members || []).length === 0}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs"
            >
              Giao task
            </button>
          </div>
        </form>
      )}

      {/* Kanban RIÊNG của dự án này */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = projectTasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className={`rounded-2xl p-3 border ${col.color} min-h-[420px] flex flex-col space-y-3`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{col.title}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">Trống</div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="relative bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-2.5 hover:shadow-md transition-all group"
                    >
                      {canManage && onDeleteTask && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Xoá task "${task.title}"?`)) onDeleteTask(task.id);
                          }}
                          title="Xoá task"
                          className="absolute top-2 right-2 p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug pr-4">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {task.assignedInternName || 'Chưa giao'}
                        </span>
                        {task.dueDate && (
                          <span className="text-slate-400 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" /> {task.dueDate.slice(5)}
                          </span>
                        )}
                      </div>

                      {task.prUrl && (
                        <a
                          href={task.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Pull Request</span>
                        </a>
                      )}

                      {task.mentorFeedback && (
                        <p className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                          <strong>Mentor:</strong> {task.mentorFeedback}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold">Chuyển:</span>
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold px-2 py-1 rounded-md focus:outline-none cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canManage && (
                <button
                  onClick={() => setIsAssigningTask(true)}
                  className="w-full text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors"
                >
                  + Giao task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
