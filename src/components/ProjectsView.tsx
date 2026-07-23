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
  Flag
} from 'lucide-react';
import { Project, TaskItem, TaskStatus, TaskPriority, UserRole } from '../types';

interface ProjectsViewProps {
  projects: Project[];
  tasks: TaskItem[];
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onOpenAddTask: () => void;
  currentRole: UserRole;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks,
  onUpdateTaskStatus,
  onOpenAddTask,
  currentRole
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesProject = selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    const matchesStatus = taskFilterStatus === 'ALL' || t.status === taskFilterStatus;
    return matchesProject && matchesStatus;
  });

  const columns: { title: string; status: TaskStatus; color: string; countColor: string }[] = [
    { title: 'Cần làm (To Do)', status: 'To Do', color: 'border-slate-300 bg-slate-50/80', countColor: 'bg-slate-200 text-slate-800' },
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
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dự án & Kanban Worklog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tiến độ Sprint, phân công công việc thực tập sinh và review Pull Request
          </p>
        </div>

        {(currentRole === 'ADMIN' || currentRole === 'MENTOR' || currentRole === 'PROJECT_LEAD') && (
          <button
            id="btn-add-task-kanban"
            onClick={onOpenAddTask}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Giao công việc (Task) mới</span>
          </button>
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
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-blue-900 text-white border-blue-700 shadow-md' 
                  : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-600'}`}>
                  {prj.code}
                </span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-300' : 'text-slate-500'}`}>
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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Lọc công việc:</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
          >
            <option value="ALL">Tất cả Dự án</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
            ))}
          </select>

          <select
            value={taskFilterStatus}
            onChange={(e) => setTaskFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none"
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
                  <span className="font-extrabold text-xs text-slate-800">{col.title}</span>
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
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 hover:shadow-md transition-all"
                      >
                        {/* Task Priority & Project */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{task.projectName}</span>
                        </div>

                        {/* Task Title */}
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">{task.title}</h4>

                        {/* Task Assignee */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="font-semibold text-slate-700">{task.assignedInternName}</span>
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
                          <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            <strong>Mentor:</strong> {task.mentorFeedback}
                          </p>
                        )}

                        {/* Status Change Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">Chuyển:</span>
                          <select
                            value={task.status}
                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded-md focus:outline-none cursor-pointer"
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
              {(currentRole === 'ADMIN' || currentRole === 'MENTOR' || currentRole === 'PROJECT_LEAD') && (
                <button
                  onClick={onOpenAddTask}
                  className="w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl border border-dashed border-slate-300 transition-colors"
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
