import React, { useState } from 'react';
import { Search, UserPlus, Users, Info, Loader2 } from 'lucide-react';

/**
 * Khối "gán" dùng chung cho **Dự án & Kanban Worklog** và **Lộ trình Đào tạo & Skills**.
 *
 * Hai màn trước đây gán theo hai kiểu khác hẳn nhau: dự án dùng chip bấm-là-gán,
 * lộ trình dùng hai ô `<select>` (một dropdown nhóm + một multi-select giữ Ctrl).
 * Gộp về một kiểu nên thao tác ở đâu cũng giống nhau:
 *
 *   1. **Gán cả nhóm** — bấm một nhóm là cả nhóm được gán. Đây là *luật thường
 *      trực*: ai vào nhóm sau này cũng tự được nhận (backend lo, xem
 *      `group_service.add_members`).
 *   2. **Gán từng người** — ô tìm kiếm + danh sách chip; ai đã được gán rồi thì
 *      biến mất khỏi danh sách nên không bấm nhầm hai lần.
 *
 * Bấm là gán ngay, không có nút "Xác nhận" — bớt một bước, và vì backend bỏ qua
 * bản ghi trùng nên bấm nhầm cũng không hỏng dữ liệu.
 */

export interface AssignCandidate {
  id: string;
  name: string;
  /** Dòng phụ nhỏ dưới tên (email, đơn vị...). */
  subtitle?: string;
}

export interface AssignGroupOption {
  id: string;
  name: string;
  memberCount?: number;
  cohort?: string;
}

interface AssignPickerProps {
  groups: AssignGroupOption[];
  /** Ứng viên cá nhân — người đã được gán phải được lọc bỏ TRƯỚC khi truyền vào. */
  candidates: AssignCandidate[];
  busy?: boolean;
  /** Id nhóm đang xử lý (hiện spinner trên đúng chip đó). */
  busyGroupId?: string | null;
  groupTitle: string;
  personTitle: string;
  searchPlaceholder?: string;
  /** Câu hiển thị khi không còn ai để gán. */
  emptyCandidates: string;
  /** Giải thích ngắn về hệ quả của việc gán cả nhóm. */
  groupNote?: string;
  onAssignGroup: (groupId: string) => void;
  onAssignPerson: (candidate: AssignCandidate) => void;
}

export const AssignPicker: React.FC<AssignPickerProps> = ({
  groups,
  candidates,
  busy = false,
  busyGroupId = null,
  groupTitle,
  personTitle,
  searchPlaceholder = 'Tìm thực tập sinh...',
  emptyCandidates,
  groupNote,
  onAssignGroup,
  onAssignPerson,
}) => {
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const shown = candidates.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || (c.subtitle || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      {/* 1. Gán cả nhóm */}
      <div className="space-y-2">
        <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span>{groupTitle}</span>
        </p>

        {groups.length === 0 ? (
          <p className="text-xs text-slate-500">
            Chưa có nhóm nào. Tạo nhóm ở mục &quot;Quản Lý Nhóm&quot; trước.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                disabled={busy}
                onClick={() => onAssignGroup(g.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {busyGroupId === g.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                <span>{g.name}</span>
                {g.memberCount !== undefined && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-200/70 dark:bg-indigo-900/60">
                    {g.memberCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {groupNote && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-px text-indigo-500" />
            <span>{groupNote}</span>
          </p>
        )}
      </div>

      {/* 2. Gán từng người */}
      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{personTitle}</span>
        </p>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {shown.length === 0 ? (
          <p className="text-xs text-slate-500">
            {q ? 'Không tìm thấy ai khớp từ khoá.' : emptyCandidates}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
            {shown.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => onAssignPerson(c)}
                title={c.subtitle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 hover:text-blue-600 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
