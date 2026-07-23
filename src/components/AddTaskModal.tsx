import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus, Intern, Project } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  interns: Intern[];
  projects: Project[];
  onAddTask: (task: TaskItem) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  interns,
  projects,
  onAddTask
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'PRJ-01');
  const [assignedInternId, setAssignedInternId] = useState(interns[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('High');
  const [dueDate, setDueDate] = useState('2025-03-30');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const selectedPrj = projects.find(p => p.id === projectId);
    const selectedIntern = interns.find(i => i.id === assignedInternId);

    const newTask: TaskItem = {
      id: `TSK-${String(Math.floor(Math.random() * 900) + 100)}`,
      title,
      projectId,
      projectName: selectedPrj ? selectedPrj.title : 'Dự án Core',
      assignedInternId,
      assignedInternName: selectedIntern ? selectedIntern.name : 'Thực tập sinh',
      mentorName: selectedIntern ? selectedIntern.mentor : 'Mentor',
      status: 'To Do' as TaskStatus,
      priority,
      dueDate,
      description,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span>Phân công Công việc (Task Mới)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Tên công việc / Yêu cầu *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Xây dựng RESTful API quản lý đơn hàng"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dự án áp dụng</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Thực tập sinh phụ trách</label>
              <select
                value={assignedInternId}
                onChange={(e) => setAssignedInternId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {interns.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.department})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Urgent">Khẩn cấp (Urgent)</option>
                <option value="High">Cao (High)</option>
                <option value="Medium">Trung bình (Medium)</option>
                <option value="Low">Thấp (Low)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Hạn hoàn thành (Deadline)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Mô tả chi tiết & Tiêu chuẩn nghiệm thu</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Yêu cầu kỹ thuật, tài liệu tham khảo, tiêu chuẩn code..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
            >
              Giao Task ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
