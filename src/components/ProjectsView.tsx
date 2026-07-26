import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  FolderGit2,
  Users,
  Flag,
  Trash2,
  Info,
  UserPlus
} from 'lucide-react';
import { Project, TaskItem, TaskStatus, TaskPriority, UserRole, Intern, AuthUser } from '../types';
import { ProjectDetailModal } from './ProjectDetailModal';

interface ProjectsViewProps {
  projects: Project[];
  tasks: TaskItem[];
  interns?: Intern[];
  mentors?: AuthUser[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onOpenAddTask: () => void;
  onOpenAddMember?: () => void;
  onDeleteTask?: (taskId: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onAddProjectMember?: (projectId: string, memberId: string) => void;
  onRemoveProjectMember?: (projectId: string, memberId: string) => void;
  currentRole: UserRole;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  interns = [],
  mentors = [],
  onUpdateTaskStatus,
  onOpenAddTask,
  onOpenAddMember,
  onDeleteTask,
  onDeleteProject,
  onAddProjectMember,
  onRemoveProjectMember,
  currentRole
}) => {
  const canManage = currentRole === 'ADMIN' || currentRole === 'MENTOR';

  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('ALL');
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesProject = selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    const matchesStatus = taskFilterStatus === 'ALL' || t.status === taskFilterStatus;
    return matchesProject && matchesStatus;
  });

  const handleDeleteProjectClick = (e: React.MouseEvent, projectId: string, projectTitle: string) => {
    e.stopPropagation();
    if (!onDeleteProject) return;
    const confirmed = window.confirm(`Xoá dự án "${projectTitle}"?\nTất cả Task thuộc dự án này trên Kanban sẽ bị xoá theo. Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    onDeleteProject(projectId);
    if (selectedProjectId === projectId) setSelectedProjectId('ALL');
  };

  const handleDeleteTaskClick = (taskId: string, taskTitle: string) => {
    if (!onDeleteTask) return;
    const confirmed = window.confirm(`Xoá task "${taskTitle}"?\nHành động này không thể hoàn tác.`);
    if (!confirmed) return;
    onDeleteTask(taskId);
  };

  const columns: { title: string; status: TaskStatus; color: string; countColor: string }[] = [
    { title: 'Cần làm (To Do)', status: 'To Do', color: 'border-slate-300 dark:border-slate-600 bg-slate-50/80', countColor: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' },
    { title: 'Đang làm (In Progress)', status: 'In Progress', color: 'border-blue-300 bg-blue-50/40', countColor: 'bg-blue-100 text-blue-800' },
    { title: 'Đang Review (In Review)', status: 'In Review', color: 'border-purple-300 bg-purple-50/40', countColor: 'bg-purple-100 text-purple-800' },
    { title: 'Hoàn thành (Done)', status: 'Done', color: 'border-emerald-300 bg-emerald-50/40', countColor: 'bg-emerald-100 text-emerald-800' },
    { title: 'Vướng mắc (Blocked)', status: 'Blocked', color: 'border-red-300 bg-red-50/40', countColor: 'bg-red-100 text-red-800' }
  ];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-200 font-bold';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Dự án & Kanban Worklog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ Sprint, phân công công việc thực tập sinh và review Pull Request
          </p>
        </div>

        {(currentRole === 'ADMIN' || currentRole === 'MENTOR') && (
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAddMember && (
              <button
                id="btn-add-member-kanban"
                onClick={onOpenAddMember}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Người</span>
              </button>
            )}
            <button
              id="btn-add-task-kanban"
              onClick={onOpenAddTask}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Giao công việc (Task) mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Projects Overview Carousel / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {projects.map((prj) => {
          const isSelected = selectedProjectId === prj.id;
          return (
            <div
              key={prj.id}
              onClick={() => setSelectedProjectId(isSelected ? 'ALL' : prj.id)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-700 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className={`absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDetailProjectId(prj.id); }}
                  title="Xem chi tiết & Thành viên"
                  className={`p-1 rounded-lg cursor-pointer ${
                    isSelected ? 'text-blue-200 hover:text-white hover:bg-white/10' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                {canManage && onDeleteProject && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProjectClick(e, prj.id, prj.title)}
                    title="Xoá Dự Án Này"
                    className={`p-1 rounded-lg cursor-pointer ${
                      isSelected ? 'text-red-300 hover:text-red-200 hover:bg-white/10' : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mb-2 pr-8">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                  {prj.code}
                </span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {prj.progress}%
                </span>
              </div>
              <h4 className="font-extrabold text-xs line-clamp-1 mb-2">{prj.title}</h4>
              <div className="w-full bg-slate-200/40 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-600'}`}
                  style={{ width: `${prj.progress}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {detailProjectId && (
        <ProjectDetailModal
          project={projects.find(p => p.id === detailProjectId) || null}
          onClose={() => setDetailProjectId(null)}
          tasks={tasks}
          interns={interns}
          mentors={mentors}
          currentRole={currentRole}
          onAddProjectMember={onAddProjectMember}
          onRemoveProjectMember={onRemoveProjectMember}
        />
      )}

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Lọc công việc:</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
          >
            <option value="ALL">Tất cả Dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
            ))}
          </select>

          <select
            value={taskFilterStatus}
            onChange={(e) => setTaskFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="To Do">Cần làm (To Do)</option>
            <option value="In Progress">Đang làm (In Progress)</option>
            <option value="In Review">Đang Review</option>
            <option value="Done">Hoàn thành</option>
            <option value="Blocked">Vướng mắc</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          return (
            <div 
              key={col.status} 
              className={`rounded-2xl p-3 border ${col.color} min-h-[500px] flex flex-col justify-between space-y-3`}
            >
              <div>
                {/* Column Title */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{col.title}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.countColor}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      Trống
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="relative bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 hover:shadow-md transition-all group"
                      >
                        {canManage && onDeleteTask && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTaskClick(task.id, task.title)}
                            title="Xoá Task Này"
                            className="absolute top-2 right-2 p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Task Priority & Project */}
                        <div className="flex items-center justify-between pr-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{task.projectName}</span>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">{task.title}</h4>

                        {/* Task Assignee */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{task.assignedInternName}</span>
                          <span className="text-slate-400">Hạn: {task.dueDate.slice(5)}</span>
                        </div>

                        {/* PR link if present */}
                        {task.prUrl && (
                          <a
                            href={task.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline pt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Pull Request GitHub</span>
                          </a>
                        )}

                        {/* Mentor Feedback snippet */}
                        {task.mentorFeedback && (
                          <p className="text-[10px] text-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100">
                            <strong>Mentor:</strong> {task.mentorFeedback}
                          </p>
                        )}

                        {/* Status Change Selector */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">Chuyển:</span>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold px-2 py-1 rounded-md focus:outline-none cursor-pointer"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Done">Done</option>
                            <option value="Blocked">Blocked</option>
                          </select>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Quick Add inside Column */}
              {(currentRole === 'ADMIN' || currentRole === 'MENTOR') && (
                <button
                  onClick={onOpenAddTask}
                  className="w-full text-center py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 hover:bg-white/80 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors"
                >
                  + Thêm Task
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
