import React, { useState } from 'react';
import { X, UserPlus, FolderGit2 } from 'lucide-react';
import { Project, Intern, AuthUser } from '../types';

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  interns: Intern[];
  mentors: AuthUser[];
  onAddProjectMember: (projectId: string, memberId: string) => void;
}

export const AddProjectMemberModal: React.FC<AddProjectMemberModalProps> = ({
  isOpen,
  onClose,
  projects,
  interns,
  mentors,
  onAddProjectMember
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  if (!isOpen) return null;

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const memberIds = selectedProject?.memberIds || [];

  const availableMentors = mentors.filter(m => !memberIds.includes(m.id));
  const availableInterns = interns.filter(i => !memberIds.includes(i.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedMemberId) return;

    const person = interns.find(i => i.id === selectedMemberId) || mentors.find(m => m.id === selectedMemberId);
    const confirmed = window.confirm(`Thêm "${person ? person.name : selectedMemberId}" vào dự án "${selectedProject ? selectedProject.title : selectedProjectId}"?`);
    if (!confirmed) return;

    onAddProjectMember(selectedProjectId, selectedMemberId);
    setSelectedMemberId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Thêm Người Vào Dự Án</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Chưa có dự án nào để thêm người.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Thêm vào Dự án nào? *</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedMemberId(''); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Chọn Người Để Thêm *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="">-- Chọn Mentor hoặc Thực tập sinh --</option>
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
              {selectedProject && availableMentors.length === 0 && availableInterns.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-1">Tất cả mọi người đều đã ở trong dự án này rồi.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!selectedMemberId}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold shadow-xs"
              >
                Thêm Vào Dự Án
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
