import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { Intern, Department, InternStatus } from '../types';
import { usersApi, tokenStore, ApiError } from '../services/api';
import { apiUserToIntern, FE_DEPARTMENT_TO_API } from '../services/mappers';

interface AddInternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIntern: (newIntern: Intern) => void;
}

/**
 * Tạo tài khoản Thực tập sinh THẬT trên hệ thống (`POST /users`).
 *
 * Trước đây form này chỉ thêm một bản ghi ảo vào bộ nhớ trình duyệt, kèm điểm và
 * kỹ năng bịa sẵn — tải lại trang là mất. Nay backend đã cho MENTOR/ADMIN tạo tài
 * khoản INTERN nên form gọi API thật; các trường hồ sơ (khối kỹ thuật, trường học,
 * mentor phụ trách...) được cập nhật sau bằng `PATCH /users/{id}/profile`.
 */
export const AddInternModal: React.FC<AddInternModalProps> = ({
  isOpen,
  onClose,
  onAddIntern
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Java Back-End');
  const [roleTitle, setRoleTitle] = useState('Thực tập sinh Java Spring');
  const [mentor, setMentor] = useState('Trần Tuấn Anh (Senior Architect)');
  const [project, setProject] = useState('Hệ thống Quản lý Khách hàng Enterprise');
  const [university, setUniversity] = useState('Đại học Bách Khoa Hà Nội');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) return;
    if (password.length < 6) {
      setError('Mật khẩu khởi tạo phải có ít nhất 6 ký tự.');
      return;
    }

    const finalEmail = email.includes('@') ? email.trim() : `${email.trim()}@gimasys.com`;

    const isValidEmailDomain = (emailStr: string): boolean => {
      const emailLower = emailStr.trim().toLowerCase();
      if (
        emailLower === 'admin@example.com' ||
        emailLower === 'mentor@example.com' ||
        emailLower === 'intern@example.com'
      ) {
        return true;
      }
      return emailLower.endsWith('@gimasys.com') || emailLower.endsWith('@edu.gimasys.com');
    };

    if (!isValidEmailDomain(finalEmail)) {
      setError('Chỉ chấp nhận email thuộc tên miền @gimasys.com hoặc @edu.gimasys.com.');
      return;
    }

    if (tokenStore.isAuthenticated()) {
      setSaving(true);
      try {
        const created = await usersApi.create({
          full_name: name.trim(),
          email: finalEmail,
          password,
          role: 'INTERN',
        });
        // Bổ sung hồ sơ ngay sau khi có id thật (không chặn nếu bước này lỗi).
        try {
          // SĐT/Trường/Mentor phụ trách/Thời gian thực tập đã bị bỏ khỏi hồ sơ.
          await usersApi.updateProfile(created.id, {
            department: FE_DEPARTMENT_TO_API[department],
          });
        } catch {
          /* hồ sơ có thể sửa lại sau ở màn chi tiết */
        }
        onAddIntern(apiUserToIntern({ ...created, department: FE_DEPARTMENT_TO_API[department] }));
        onClose();
        return;
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.detail || 'Tạo tài khoản thất bại.'
            : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
        );
        return;
      } finally {
        setSaving(false);
      }
    }

    // Chế độ demo (chưa đăng nhập thật): chỉ thêm cục bộ để bản demo không gãy.
    const newIntern: Intern = {
      id: `INT-${String(Math.floor(Math.random() * 900) + 100)}`,
      name: name.trim(),
      email: finalEmail,
      phone: phone || '0988 000 000',
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&q=80&w=300`,
      department,
      roleTitle: roleTitle || `Thực tập sinh ${department}`,
      mentor,
      mentorEmail: 'mentor@gimasys.com',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'Onboarding' as InternStatus,
      project,
      projectId: '',
      score: 0,
      attendanceRate: 0,
      university,
      skills: []
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
                placeholder="nam.hoang@gimasys.com"
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

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Mật khẩu khởi tạo * <span className="font-normal text-slate-400">(tối thiểu 6 ký tự)</span>
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Gửi mật khẩu này cho thực tập sinh để đăng nhập lần đầu"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          {error && (
            <p className="text-[11px] font-bold text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-xs inline-flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Đang tạo tài khoản...' : 'Tạo tài khoản Thực tập sinh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
