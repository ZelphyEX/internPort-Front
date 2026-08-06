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
} from 'lucide-react';
import { UserRole } from '../types';
import { usersApi, tokenStore, ApiError, ApiUser } from '../services/api';

/**
 * Tab "Mentor" — chỉ Quản trị viên (ADMIN) thấy.
 *
 * Gồm cả Mentor đang hoạt động và Mentor **đang chờ duyệt** (tự đăng ký, trạng thái
 * PENDING). Hàng đợi chờ duyệt luôn nằm trên đầu, người đăng ký sớm hơn xếp trước.
 * Bấm "Duyệt" -> tài khoản chuyển ACTIVE nên tự động rơi xuống nhóm dưới, nhường
 * chỗ cho người chờ duyệt tiếp theo lên đầu.
 */

interface MentorsViewProps {
  currentRole: UserRole;
}

export const MentorsView: React.FC<MentorsViewProps> = ({ currentRole }) => {
  const [mentors, setMentors] = useState<ApiUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const isAdmin = currentRole === 'ADMIN';

  const load = () => {
    if (!tokenStore.isAuthenticated()) {
      setMentors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    usersApi
      .list({ size: 100, role: 'MENTOR' })
      .then((res) => setMentors(res.items))
      .catch(() => setMentors([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprove = async (u: ApiUser) => {
    setBusyId(u.id);
    try {
      await usersApi.approve(u.id);
      load();
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
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Từ chối yêu cầu thất bại.');
    } finally {
      setBusyId(null);
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
            Duyệt yêu cầu mở tài khoản Mentor và xem danh sách Mentor của hệ thống
            ({all.length} tài khoản{pending.length > 0 ? `, ${pending.length} chờ duyệt` : ''})
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
          {/* Hàng đợi chờ duyệt — luôn ở trên */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Chờ duyệt ({pending.length})</span>
            </h3>
            {pending.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                Không có yêu cầu nào đang chờ duyệt.
              </div>
            ) : (
              pending.map((u) => renderRow(u, true))
            )}
          </div>

          {/* Mentor đã duyệt */}
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
