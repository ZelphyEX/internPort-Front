import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  GraduationCap,
  Award,
  Mail,
  Phone,
  Github,
  Sparkles,
  Grid,
  List,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Trash2,
  UserX
} from 'lucide-react';
import { Intern, Department, InternStatus, UserRole } from '../types';
import { canManageInterns } from '../services/permissions';

interface InternsViewProps {
  interns: Intern[];
  onSelectIntern: (intern: Intern) => void;
  onDeleteIntern?: (internId: string) => void;
  onKickIntern?: (internId: string) => void;
  currentRole: UserRole;
  searchTerm: string;
}

export const InternsView: React.FC<InternsViewProps> = ({
  interns,
  onSelectIntern,
  onDeleteIntern,
  onKickIntern,
  currentRole,
  searchTerm: externalSearch
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isAdmin = currentRole === 'ADMIN';
  const isMentor = currentRole === 'MENTOR';
  // Quản lý tài khoản Thực tập sinh là quyền của CẢ Mentor và Admin
  // (khác các mục nghiệp vụ — Admin chỉ được xem). Xem services/permissions.ts.
  const canManage = canManageInterns(currentRole);

  // ADMIN: xoá vĩnh viễn tài khoản. MENTOR: chỉ xoá khỏi khoá học (đổi trạng thái, không mất dữ liệu).
  const handleRemoveClick = (e: React.MouseEvent, internId: string, internName: string) => {
    e.stopPropagation();
    if (isAdmin && onDeleteIntern) {
      const confirmed = window.confirm(`[ADMIN] Xoá VĨNH VIỄN tài khoản "${internName}" khỏi hệ thống?\nToàn bộ Task đang gán và Báo cáo ngày của người này cũng sẽ bị xoá. Hành động này không thể hoàn tác.`);
      if (!confirmed) return;
      onDeleteIntern(internId);
    } else if (isMentor && onKickIntern) {
      const confirmed = window.confirm(`[MENTOR] Xoá "${internName}" khỏi khoá học / chương trình đào tạo?\nTài khoản và lịch sử dữ liệu vẫn được giữ lại, chỉ ẩn khỏi danh sách đang hoạt động. Chỉ Admin mới có thể xoá vĩnh viễn tài khoản.`);
      if (!confirmed) return;
      onKickIntern(internId);
    }
  };

  const query = (externalSearch || internalSearch).toLowerCase().trim();

  // Filter Logic — mặc định ẩn các Intern đã bị Mentor xoá khỏi khoá học (status Removed), trừ khi lọc riêng
  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      !query ||
      intern.name.toLowerCase().includes(query) ||
      intern.email.toLowerCase().includes(query) ||
      intern.mentor.toLowerCase().includes(query) ||
      (intern.university && intern.university.toLowerCase().includes(query));

    const matchesDept = selectedDept === 'ALL' || intern.department === selectedDept;
    const matchesStatus = selectedStatus === 'ALL'
      ? intern.status !== 'Removed'
      : intern.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: InternStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Onboarding':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Reviewing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Graduated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Paused':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'Removed':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Danh sách Thực tập sinh</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin, tiến độ đào tạo và đánh giá năng lực thực tập sinh Gimasys ({filteredInterns.length} nhân sự)
          </p>
        </div>

        {/* Nút "Thêm Thực tập sinh mới" đã bỏ: tài khoản chỉ sinh ra từ luồng
            Đăng nhập bằng Google (người dùng tự vào, xem auth_service). */}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Tìm theo tên, email, mentor, trường..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Dept Dropdown */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Khối Kỹ thuật</option>
            <option value="Java Back-End">Java Back-End</option>
            <option value="React Front-End">React Front-End</option>
            <option value="Cloud & DevOps">Cloud & DevOps</option>
            <option value="Salesforce / ERP">Salesforce / ERP</option>
            <option value="AI & Data Science">AI & Data Science</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả Trạng thái</option>
            <option value="Active">Đang Thực tập (Active)</option>
            <option value="Onboarding">Onboarding</option>
            <option value="Reviewing">Chờ Đánh giá</option>
            <option value="Graduated">Đã Tốt nghiệp / Tuyển dụng</option>
            <option value="Removed">Đã Xoá Khỏi Khoá Học</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
              title="Dạng thẻ Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
              title="Dạng Bảng Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Intern List Output */}
      {filteredInterns.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Không tìm thấy thực tập sinh phù hợp</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc.</p>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInterns.map((intern) => (
            <div
              key={intern.id}
              onClick={() => onSelectIntern(intern)}
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              {((isAdmin && onDeleteIntern) || (isMentor && onKickIntern)) && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveClick(e, intern.id, intern.name)}
                  title={isAdmin ? 'Xoá Vĩnh Viễn Tài Khoản (Admin)' : 'Xoá Khỏi Khoá Học (Mentor)'}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                </button>
              )}
              {/* Top Row */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={intern.avatar}
                      alt={intern.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors truncate">
                        {intern.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{intern.email}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(intern.status)}`}>
                    {intern.status}
                  </span>
                </div>

                {/* Đã bỏ khỏi thẻ: dòng chức danh ("Thực tập sinh Java Back-End"),
                    ô "Khối:" và dòng "Dự án:" — cả ba đều suy ra từ `department`
                    (không còn được điền ở đâu) hoặc từ dữ liệu mẫu. Thay bằng email
                    để vẫn nhận ra được người trong thẻ. */}

              </div>

              {/* Bottom Actions Row */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{intern.score}/10</span>
                  <span className="text-[10px] text-slate-400">({intern.attendanceRate}% CC)</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIntern(intern);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Hồ sơ & Đánh giá AI</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      ) : (

        /* Table Layout */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Thực tập sinh</th>
                  <th className="p-4">Khối Kỹ thuật</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Lộ trình học tập</th>
                  <th className="p-4">Điểm</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700 dark:text-slate-300">
                {filteredInterns.map((intern) => (
                  <tr 
                    key={intern.id}
                    onClick={() => onSelectIntern(intern)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={intern.avatar}
                          alt={intern.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{intern.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{intern.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{intern.department}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(intern.status)}`}>
                        {intern.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIntern(intern);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Xem chi tiết lộ trình
                      </button>
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100 text-sm">{intern.score}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIntern(intern);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                        >
                          Chi tiết
                        </button>
                        {((isAdmin && onDeleteIntern) || (isMentor && onKickIntern)) && (
                          <button
                            onClick={(e) => handleRemoveClick(e, intern.id, intern.name)}
                            title={isAdmin ? 'Xoá Vĩnh Viễn Tài Khoản (Admin)' : 'Xoá Khỏi Khoá Học (Mentor)'}
                            className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}

    </div>
  );
};
