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
 *   2. **Tài khoản Mentor chờ duyệt** — người đăng nhập bằng email @gimasys.com lần
 *      đầu (trạng thái PENDING, chưa vào được portal).
 *   3. **Mentor đang hoạt động**.
 *
 * Hai hàng đợi đều xếp ai gửi trước lên trước; xử lý xong yêu cầu nào thì yêu cầu
 * đó rời hàng đợi, nhường chỗ cho người tiếp theo lên đầu.
 */

interface MentorsViewProps {
  currentRole: UserRole;
  /** Gọi sau khi duyệt/từ chối để App cập nhật lại số badge ở thanh điều hướng. */
  onQueueChanged?: () => void;
}

export const MentorsView: React.FC<MentorsViewProps> = ({ currentRole, onQueueChanged }) => {
  const [mentors, setMentors] = useState<ApiUser[] | null>(null);
  const [roleRequests, setRoleRequests] = useState<ApiRoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const isAdmin = currentRole === 'ADMIN';

  const load = () => {
    if (!tokenStore.isAuthenticated()) {
      setMentors([]);
      setRoleRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      usersApi.list({ size: 100, role: 'MENTOR' }).then(
        (res) => res.items,
        () => [] as ApiUser[]
      ),
      roleRequestsApi.list({ size: 100, status: 'PENDING' }).then(
        (res) => res.items,
        () => [] as ApiRoleRequest[]
      ),
    ])
      .then(([mentorList, requestList]) => {
        setMentors(mentorList);
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
  const all = (mentors || []).filter(
    (u) => !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  // Chờ duyệt lên đầu, ai gửi yêu cầu sớm hơn (id nhỏ hơn) đứng trước.
  const pending = all.filter((u) => u.status === 'PENDING').sort((a, b) => a.id - b.id);
  const others = all.filter((u) => u.status !== 'PENDING').sort((a, b) => a.id - b.id);
  const requests = roleRequests
    .filter(
      (r) =>
        !q ||
        (r.user_name || '').toLowerCase().includes(q) ||
        (r.user_email || '').toLowerCase().includes(q)
    )
    .sort((a, b) => a.id - b.id);

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

  const renderRow = (u: ApiUser, isPending: boolean) => (
    <div
      key={u.id}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
        isPending
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white ${
            isPending ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
          }`}
        >
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
          <div className="flex items-center gap-1.5 mt-1">
            {isPending ? (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Chờ duyệt
              </span>
            ) : u.status === 'LOCKED' ? (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-red-100 text-red-800 border-red-300">
                Đã khoá
              </span>
            ) : (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded border uppercase bg-emerald-100 text-emerald-800 border-emerald-300">
                Đang hoạt động
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {isPending ? (
          <>
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
          </>
        ) : (
          <span className="text-[11px] text-slate-400">Mentor #{u.id}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Quản lý Mentor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Duyệt yêu cầu chuyển vai trò, duyệt tài khoản Mentor mới và xem danh sách Mentor
            ({all.length} tài khoản
            {pending.length > 0 ? `, ${pending.length} tài khoản chờ duyệt` : ''}
            {requests.length > 0 ? `, ${requests.length} yêu cầu chuyển vai trò` : ''})
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

      {/* Tìm kiếm */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách Mentor...
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

          {/* 2. Tài khoản Mentor mới, chưa được duyệt */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Tài khoản Mentor chờ duyệt ({pending.length})</span>
            </h3>
            {pending.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                Không có tài khoản Mentor nào đang chờ duyệt.
              </div>
            ) : (
              pending.map((u) => renderRow(u, true))
            )}
          </div>

          {/* 3. Mentor đã duyệt */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Mentor đang hoạt động ({others.length})</span>
            </h3>
            {others.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                Chưa có Mentor nào được duyệt.
              </div>
            ) : (
              others.map((u) => renderRow(u, false))
            )}
          </div>
        </>
      )}
    </div>
  );
};
