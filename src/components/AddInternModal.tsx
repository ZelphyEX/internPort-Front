import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Intern, Department, InternStatus } from '../types';

interface AddInternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIntern: (newIntern: Intern) => void;
}

export const AddInternModal: React.FC<AddInternModalProps> = ({
  isOpen,
  onClose,
  onAddIntern
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Java Back-End');
  const [roleTitle, setRoleTitle] = useState('Thực tập sinh Java Spring');
  const [mentor, setMentor] = useState('Trần Tuấn Anh (Senior Architect)');
  const [project, setProject] = useState('Hệ thống Quản lý Khách hàng Enterprise');
  const [university, setUniversity] = useState('Đại học Bách Khoa Hà Nội');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const confirmed = window.confirm(`Xác nhận thêm thực tập sinh "${name}" (${email}) vào hệ thống?`);
    if (!confirmed) return;

    const newIntern: Intern = {
      id: `INT-${String(Math.floor(Math.random() * 900) + 100)}`,
      name,
      email,
      phone: phone || '0988 000 000',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&q=80&w=300`,
      department,
      roleTitle: roleTitle || `Thực tập sinh ${department}`,
      mentor,
      mentorEmail: 'mentor@gimasys.vn',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2025-06-30',
      status: 'Onboarding' as InternStatus,
      project,
      projectId: 'PRJ-01',
      score: 8.5,
      attendanceRate: 100,
      university,
      skills: [
        { name: `${department} Basic`, level: 75, category: 'Core' },
        { name: 'Git Workflow', level: 80, category: 'Tools' }
      ]
    };

    onAddIntern(newIntern);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Thêm Thực tập sinh mới</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Họ và tên thực tập sinh *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Hoàng Văn Nam"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Gimasys *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nam.hoang@gimasys.vn"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Khối Kỹ thuật *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Java Back-End">Java Back-End</option>
                <option value="React Front-End">React Front-End</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="Salesforce / ERP">Salesforce / ERP</option>
                <option value="AI & Data Science">AI & Data Science</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Mentor hướng dẫn</label>
              <input
                type="text"
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Trường Đại học</label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Đại học Bách Khoa Hà Nội"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
            >
              Lưu Thực tập sinh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
