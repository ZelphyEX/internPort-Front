import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Clock,
  Search,
  Loader2,
  Check,
  Trash2,
  Mail,
  ShieldCheck,
  RefreshCw,
  ArrowLeftRight,
  X,
  Grid,
  List,
  Users,
  GraduationCap,
} from 'lucide-react';
import { UserRole } from '../types';
import {
  usersApi,
  roleRequestsApi,
  tokenStore,
  ApiError,
  ApiUser,
  ApiRoleRequest,
} from '../services/api';

/**
 * Tab "Mentor" — chỉ Quản trị viên (ADMIN) thấy. Ba khối, xếp theo mức cần xử lý:
 *
 *   1. **Yêu cầu chuyển vai trò** — Thực tập sinh xin lên Mentor (`/role-requests`).
 *      Duyệt là đổi vai trò ngay; từ chối thì giữ nguyên, họ gửi lại được sau.
 *   2. **Tài khoản Mentor chờ duyệt** — dữ liệu cũ còn sót ở trạng thái PENDING.
 *   3. **Danh sách người dùng** — TẤT CẢ tài khoản, trình bày giống trang Thực tập
 *      sinh (thẻ / bảng, có ô tìm và bộ lọc). Đây là chỗ Admin tự tay chuyển một
 *      người qua lại giữa Mentor và Thực tập sinh mà không cần họ phải xin trước.
 *
 * Hai hàng đợi đều xếp ai gửi trước lên trước; xử lý xong yêu cầu nào thì yêu cầu
 * đó rời hàng đợi, nhường chỗ cho người tiếp theo lên đầu.
 */

interface MentorsViewProps {
  currentRole: UserRole;
  /** Gọi sau khi duyệt/từ chối/đổi vai trò để App cập nhật số badge ở thanh điều hướng. */
  onQueueChanged?: () => void;
}

/** Vai trò đích khi bấm nút chuyển — chỉ đảo giữa hai vai trò này. */
const OPPOSITE_ROLE: Record<'INTERN' | 'MENTOR', 'INTERN' | 'MENTOR'> = {
  INTERN: 'MENTOR',
  MENTOR: 'INTERN',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  MENTOR: 'Mentor',
  INTERN: 'Thực tập sinh',
};

const roleBadgeClass = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
    case 'MENTOR':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700';
  }
};

const statusBadgeClass = (status?: string) => {
  switch (status) {
    case 'LOCKED':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
  }
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khoá',
  PENDING: 'Chờ duyệt',
};

/**
 * Lấy TOÀN BỘ tài khoản, đi hết các trang.
 *
 * Backend chặn `size > 100` (422), mà trang này là chỗ Admin quản lý mọi người —
 * lấy đúng 100 người đầu rồi thôi thì những người sau lặng lẽ biến mất khỏi giao
 * diện, không có dấu hiệu gì báo là bị cắt. Nên đọc trang 1 để biết tổng số trang
 * rồi tải nốt phần còn lại.
 */
async function fetchAllUsers(): Promise<ApiUser[]> {
  const first = await usersApi.list({ page: 1, size: 100 });
  if (first.pages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, i) =>
      usersApi.list({ page: i + 2, size: 100 }).then((r) => r.items)
    )
  );
  return [...first.items, ...rest.flat()];
}

/** Ảnh đại diện, lùi về hai chữ cái đầu khi tài khoản chưa có ảnh. */
const Avatar: React.FC<{ user: ApiUser; size: string }> = ({ user, size }) =>
  user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt={user.full_name}
      className={`${size} rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0`}
    />
  ) : (
    <div
      className={`${size} rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white bg-gradient-to-br from-blue-600 to-indigo-700`}
    >
      {user.full_name.slice(0, 2).toUpperCase()}
    </div>
  );

export const MentorsView: React.FC<MentorsViewProps> = ({ currentRole, onQueueChanged }) => {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [roleRequests, setRoleRequests] = useState<ApiRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isAdmin = currentRole === 'ADMIN';

  const load = () => {
    if (!tokenStore.isAuthenticated()) {
      setUsers([]);
      setRoleRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      // Lấy TẤT CẢ tài khoản, không lọc theo vai trò: trang này giờ là chỗ đổi vai
      // trò qua lại nên phải nhìn thấy cả Thực tập sinh lẫn Mentor.
      fetchAllUsers().catch(() => [] as ApiUser[]),
      roleRequestsApi.list({ size: 100, status: 'PENDING' }).then(
        (res) => res.items,
        () => [] as ApiRoleRequest[]
      ),
    ])
      .then(([userList, requestList]) => {
        setUsers(userList);
        setRoleRequests(requestList);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const afterMutation = () => {
    load();
    onQueueChanged?.();
  };

  const handleApprove = async (u: ApiUser) => {
    setBusyId(u.id);
    try {
      await usersApi.approve(u.id);
      afterMutation();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Duyệt tài khoản thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (u: ApiUser) => {
    if (!window.confirm(`Từ chối và xoá yêu cầu làm Mentor của "${u.full_name}"?`)) return;
    setBusyId(u.id);
    try {
      await usersApi.remove(u.id);
      afterMutation();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Từ chối yêu cầu thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  // --- Admin tự tay đổi vai trò -------------------------------------------- #
  // Khác khối "Yêu cầu chuyển vai trò" ở trên: ở đó Admin DUYỆT cái người dùng đã
  // xin; ở đây Admin CHỦ ĐỘNG đặt vai trò, người kia không cần xin gì cả.
  const handleSwitchRole = async (u: ApiUser) => {
    if (u.role === 'ADMIN') return;
    const from = u.role as 'INTERN' | 'MENTOR';
    const to = OPPOSITE_ROLE[from];

    const consequence =
      to === 'MENTOR'
        ? 'Sau khi chuyển, người này sẽ QUẢN LÝ ĐƯỢC Thực tập sinh: xem hồ sơ, gán lộ trình & dự án, giao task và duyệt báo cáo ngày.'
        : 'Sau khi chuyển, người này MẤT toàn bộ quyền quản lý (không còn gán lộ trình, giao task hay duyệt báo cáo được nữa).\n' +
          'Dữ liệu đã tạo trước đó vẫn giữ nguyên, không bị xoá.';

    if (
      !window.confirm(
        `Chuyển "${u.full_name}" từ ${ROLE_LABEL[from]} sang ${ROLE_LABEL[to]}?\n\n` +
          `${consequence}\n\n` +
          'Vai trò đổi ngay lập tức, không cần người đó xác nhận. Bạn có thể chuyển ngược lại bất cứ lúc nào.'
      )
    ) {
      return;
    }

    setBusyId(u.id);
    try {
      await usersApi.setRole(u.id, to);
      afterMutation();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Đổi vai trò thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  // --- Yêu cầu chuyển vai trò ---------------------------------------------- #
  const handleApproveRequest = async (req: ApiRoleRequest) => {
    const who = req.user_name || `#${req.user_id}`;
    if (
      !window.confirm(
        `Duyệt cho "${who}" chuyển từ ${req.from_role} sang ${req.to_role}?\n\n` +
          'Vai trò sẽ đổi ngay sau khi bạn xác nhận.'
      )
    ) {
      return;
    }
    setBusyRequestId(req.id);
    try {
      await roleRequestsApi.approve(req.id);
      afterMutation();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Duyệt yêu cầu thất bại.');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleRejectRequest = async (req: ApiRoleRequest) => {
    const who = req.user_name || `#${req.user_id}`;
    if (!window.confirm(`Từ chối yêu cầu chuyển vai trò của "${who}"? Vai trò giữ nguyên.`)) {
      return;
    }
    setBusyRequestId(req.id);
    try {
      await roleRequestsApi.reject(req.id);
      afterMutation();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Từ chối yêu cầu thất bại.');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Quản lý Mentor là chức năng của Quản trị viên.
        </p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const all = users || [];
  const matchesSearch = (u: ApiUser) =>
    !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);

  // Danh sách chính: lọc theo ô tìm + vai trò + trạng thái.
  const filtered = all
    .filter(matchesSearch)
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) => statusFilter === 'ALL' || (u.status || 'ACTIVE') === statusFilter)
    .sort((a, b) => a.id - b.id);

  // Hàng đợi Mentor chờ duyệt (dữ liệu cũ) — vẫn xét trên toàn bộ, không theo bộ lọc.
  const pending = all
    .filter((u) => u.role === 'MENTOR' && u.status === 'PENDING' && matchesSearch(u))
    .sort((a, b) => a.id - b.id);

  const mentorCount = all.filter((u) => u.role === 'MENTOR').length;
  const internCount = all.filter((u) => u.role === 'INTERN').length;

  const requests = roleRequests
    .filter(
      (r) =>
        !q ||
        (r.user_name || '').toLowerCase().includes(q) ||
        (r.user_email || '').toLowerCase().includes(q)
    )
    .sort((a, b) => a.id - b.id);

  /** Nút chuyển vai trò — không hiện với tài khoản Quản trị viên. */
  const renderSwitchButton = (u: ApiUser, compact: boolean) => {
    if (u.role === 'ADMIN') {
      return (
        <span className="text-[11px] text-slate-400 px-2">Không đổi được</span>
      );
    }
    const to = OPPOSITE_ROLE[u.role as 'INTERN' | 'MENTOR'];
    const busy = busyId === u.id;
    return (
      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          handleSwitchRole(u);
        }}
        title={`Chuyển thành ${ROLE_LABEL[to]}`}
        className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50 ${
          compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-[11px]'
        } ${
          to === 'MENTOR'
            ? 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
            : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
        }`}
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ArrowLeftRight className="w-3.5 h-3.5" />
        )}
        <span>Chuyển thành {ROLE_LABEL[to]}</span>
      </button>
    );
  };

  const renderRequestRow = (req: ApiRoleRequest) => (
    <div
      key={req.id}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white bg-blue-600">
          {(req.user_name || '??').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
            {req.user_name || `Người dùng #${req.user_id}`}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{req.user_email || '—'}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
              <ArrowLeftRight className="w-2.5 h-2.5" />
              {req.from_role} → {req.to_role}
            </span>
            <span className="text-[10px] text-slate-400">
              gửi lúc {new Date(req.created_at).toLocaleString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          disabled={busyRequestId === req.id}
          onClick={() => handleApproveRequest(req)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          {busyRequestId === req.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Duyệt chuyển vai trò</span>
        </button>
        <button
          type="button"
          disabled={busyRequestId === req.id}
          onClick={() => handleRejectRequest(req)}
          title="Từ chối yêu cầu"
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderPendingRow = (u: ApiUser) => (
    <div
      key={u.id}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white bg-amber-500">
          {u.full_name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
            {u.full_name}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{u.email}</span>
          </p>
          <span className="mt-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-amber-100 text-amber-800 border-amber-300 items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Chờ duyệt
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          disabled={busyId === u.id}
          onClick={() => handleApprove(u)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
        >
          {busyId === u.id ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Duyệt</span>
        </button>
        <button
          type="button"
          disabled={busyId === u.id}
          onClick={() => handleReject(u)}
          title="Từ chối yêu cầu"
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Quản lý Mentor & Vai trò
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Duyệt yêu cầu chuyển vai trò và tự tay chuyển một tài khoản qua lại giữa
            Mentor và Thực tập sinh ({mentorCount} Mentor, {internCount} Thực tập sinh
            {requests.length > 0 ? `, ${requests.length} yêu cầu chờ duyệt` : ''})
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tải lại</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách người dùng...
        </div>
      ) : (
        <>
          {/* 1. Yêu cầu chuyển vai trò (Thực tập sinh xin lên Mentor) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Yêu cầu chuyển vai trò ({requests.length})</span>
            </h3>
            {requests.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                Không có yêu cầu chuyển vai trò nào đang chờ.
              </div>
            ) : (
              requests.map(renderRequestRow)
            )}
          </div>

          {/* 2. Tài khoản chờ duyệt — chỉ hiện khi thực sự có.
              Từ khi bỏ luật "tên miền quyết định vai trò", không tài khoản mới nào
              sinh ra ở trạng thái chờ duyệt nữa, nên khối này thường rỗng; hiện một
              ô trống vĩnh viễn chỉ làm rối. Vẫn giữ để xử lý được tài khoản cũ. */}
          {pending.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Tài khoản chờ duyệt ({pending.length})</span>
              </h3>
              {pending.map(renderPendingRow)}
            </div>
          )}

          {/* 3. Danh sách người dùng — cùng bố cục với trang Thực tập sinh */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Danh sách người dùng ({filtered.length})</span>
            </h3>

            {/* Filter & Search Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả Vai trò</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="INTERN">Thực tập sinh</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả Trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="LOCKED">Đã khoá</option>
                  <option value="PENDING">Chờ duyệt</option>
                </select>

                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
                    title="Dạng thẻ Grid"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
                    title="Dạng Bảng Table"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  Không tìm thấy người dùng phù hợp
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((u) => (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar user={u} size="w-12 h-12" />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {u.full_name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusBadgeClass(u.status)}`}
                      >
                        {STATUS_LABEL[u.status || 'ACTIVE']}
                      </span>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase shrink-0 ${roleBadgeClass(u.role)}`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                      {renderSwitchButton(u, true)}
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
                        <th className="p-4">Người dùng</th>
                        <th className="p-4">Vai trò</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
                      {filtered.map((u) => (
                        <tr key={u.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar user={u} size="w-10 h-10" />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                  {u.full_name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${roleBadgeClass(u.role)}`}
                            >
                              {ROLE_LABEL[u.role]}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass(u.status)}`}
                            >
                              {STATUS_LABEL[u.status || 'ACTIVE']}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end">
                              {renderSwitchButton(u, false)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>
                Đổi vai trò áp dụng ngay, không cần người đó xác nhận, và chuyển ngược
                lại được bất cứ lúc nào. Tài khoản Quản trị viên không đổi vai trò qua
                đây được.
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
};
