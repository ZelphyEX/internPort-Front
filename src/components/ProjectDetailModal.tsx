import React, { useState } from 'react';
import { X, UserPlus, UserMinus, FolderGit2, CheckCircle2, Clock, AlertCircle, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import { Project, TaskItem, Intern, UserRole, AuthUser } from '../types';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  tasks: TaskItem[];
  interns: Intern[];
  mentors?: AuthUser[];
  currentRole: UserRole;
  onAddProjectMember?: (projectId: string, memberId: string) => void;
  onRemoveProjectMember?: (projectId: string, memberId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  tasks,
  interns,
  mentors = [],
  currentRole,
  onAddProjectMember,
  onRemoveProjectMember
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');

  if (!project) return null;

  const canManage = currentRole === 'ADMIN' || currentRole === 'MENTOR';
  const memberIds = project.memberIds || [];

  // Thành viên dự án có thể là Thực tập sinh HOẶC Mentor - dùng để phân quyền ai được tham gia dự án nào
  const memberInterns = interns.filter(i => memberIds.includes(i.id));
  const memberMentors = mentors.filter(m => memberIds.includes(m.id));
  const totalMembers = memberInterns.length + memberMentors.length;

  const availableInterns = interns.filter(i => !memberIds.includes(i.id));
  const availableMentors = mentors.filter(m => !memberIds.includes(m.id));

  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const doneCount = projectTasks.filter(t => t.status === 'Done').length;
  const inProgressCount = projectTasks.filter(t => t.status === 'In Progress' || t.status === 'In Review').length;
  const blockedCount = projectTasks.filter(t => t.status === 'Blocked').length;
  const todoCount = projectTasks.filter(t => t.status === 'To Do').length;
  const totalCount = projectTasks.length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleAddMember = () => {
    if (!selectedMemberId || !onAddProjectMember) return;
    const person = interns.find(i => i.id === selectedMemberId) || mentors.find(m => m.id === selectedMemberId);
    const confirmed = window.confirm(`Thêm "${person ? person.name : selectedMemberId}" vào dự án "${project.title}"?`);
    if (!confirmed) return;
    onAddProjectMember(project.id, selectedMemberId);
    setSelectedMemberId('');
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!onRemoveProjectMember) return;
    const confirmed = window.confirm(`Gỡ "${memberName}" khỏi dự án "${project.title}"?`);
    if (!confirmed) return;
    onRemoveProjectMember(project.id, memberId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-start gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="text-[10px] font-bold text-slate-400">{project.code}</div>
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-base leading-tight">{project.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{project.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracking */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">Tiến độ chi tiết</h4>
          <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${completionRate}%` }}></div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
              <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200">{todoCount}</div>
              <div className="text-[9px] text-slate-400 font-semibold">Cần làm</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-2 border border-blue-100 dark:border-blue-900">
              <div className="text-sm font-extrabold text-blue-700 dark:text-blue-300">{inProgressCount}</div>
              <div className="text-[9px] text-blue-500 font-semibold">Đang làm/Review</div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-2 border border-red-100 dark:border-red-900">
              <div className="text-sm font-extrabold text-red-700 dark:text-red-300">{blockedCount}</div>
              <div className="text-[9px] text-red-500 font-semibold">Vướng mắc</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-2 border border-emerald-100 dark:border-emerald-900">
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">{doneCount}</div>
              <div className="text-[9px] text-emerald-500 font-semibold">Hoàn thành</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">{completionRate}% Task đã hoàn thành trên tổng {totalCount} Task của dự án.</p>
        </div>

        {/* Members */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Thành viên dự án ({totalMembers})</span>
          </h4>
          <p className="text-[10px] text-slate-400 mb-2">Chỉ Thực tập sinh và Mentor có trong danh sách này mới được phân quyền tham gia dự án.</p>

          {totalMembers === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-2">Chưa có ai được thêm vào dự án này.</p>
          ) : (
            <div className="space-y-1.5">
              {memberMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={mentor.avatar} alt={mentor.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{mentor.name}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.2 rounded border bg-blue-100 text-blue-800 border-blue-300 uppercase flex items-center gap-0.5 shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Mentor</span>
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{mentor.roleTitle}</div>
                    </div>
                  </div>
                  {canManage && onRemoveProjectMember && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(mentor.id, mentor.name)}
                      title="Gỡ khỏi dự án"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {memberInterns.map((intern) => (
                <div key={intern.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={intern.avatar} alt={intern.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{intern.name}</span>
                        <span className="text-[8px] font-black px-1.5 py-0.2 rounded border bg-amber-100 text-amber-800 border-amber-300 uppercase flex items-center gap-0.5 shrink-0">
                          <GraduationCap className="w-2.5 h-2.5" />
                          <span>Intern</span>
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">{intern.roleTitle}</div>
                    </div>
                  </div>
                  {canManage && onRemoveProjectMember && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(intern.id, intern.name)}
                      title="Gỡ khỏi dự án"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManage && onAddProjectMember && (
            <div className="flex items-center gap-2 mt-3">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn người để thêm vào dự án --</option>
                {availableMentors.length > 0 && (
                  <optgroup label="Mentor">
                    {availableMentors.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup>
                )}
                {availableInterns.length > 0 && (
                  <optgroup label="Thực tập sinh">
                    {availableInterns.map(i => (
                      <option key={i.id} value={i.id}>{i.name} ({i.department})</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!selectedMemberId}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
