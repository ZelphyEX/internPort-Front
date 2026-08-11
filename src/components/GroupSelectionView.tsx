import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Building2,
  Sparkles,
  UserPlus,
  UserMinus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import { AuthUser, Group, Intern, UserRole } from '../types';
import { groupsApi, tokenStore, ApiError, ApiGroupMember } from '../services/api';

/**
 * Màn "Quản Lý Nhóm" — dành cho MENTOR/ADMIN.
 *
 * Nhóm chỉ phục vụ MỘT việc: gom Intern lại để gán lộ trình hàng loạt
 * (`POST /roadmaps/{id}/assign-group`). Nhóm không phân quyền, không tách dữ liệu.
 *
 * Luồng đúng theo API hiện có:
 *   1. Mentor tạo nhóm            -> POST /groups
 *   2. Mentor chọn intern, thêm   -> POST /groups/{id}/members   (bỏ qua người đã có)
 *   3. Gỡ thành viên              -> DELETE /groups/{id}/members/{user_id}
 *   4. Sang tab Lộ trình, gán lộ trình cho cả nhóm
 *
 * Cơ chế "mã mời + duyệt yêu cầu" cũ đã được gỡ bỏ: mã được sinh ngẫu nhiên ở
 * trình duyệt và không lưu ở server, nên link mời không dùng được ở máy khác và
 * yêu cầu tham gia thì Mentor ở máy khác không nhìn thấy để duyệt.
 *
 * INTERN không vào được màn này (backend chặn `GET /groups`), nên mục Quản Lý Nhóm
 * cũng được ẩn khỏi thanh bên với Intern.
 */

interface GroupSelectionViewProps {
  currentUser: AuthUser;
  currentRole: UserRole;
  groups: Group[];
  /** Danh sách Intern thật (từ `GET /users?role=INTERN`) để chọn thêm vào nhóm. */
  interns: Intern[];
  onCreateGroup: (name: string, cohort: string) => Promise<void> | void;
  /** Gọi lại `GET /groups` để đồng bộ số thành viên sau khi thêm/gỡ. */
  onReloadGroups: () => void;
}

export const GroupSelectionView: React.FC<GroupSelectionViewProps> = ({
  currentUser,
  currentRole,
  groups,
  interns,
  onCreateGroup,
  onReloadGroups,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCohort, setNewGroupCohort] = useState(String(new Date().getFullYear()));
  const [creating, setCreating] = useState(false);

  // Nhóm đang mở bảng thành viên + dữ liệu thành viên tải từ GET /groups/{id}.
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<ApiGroupMember[] | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [internSearch, setInternSearch] = useState('');
  const [pickedInternIds, setPickedInternIds] = useState<string[]>([]);

  const isManager = currentRole !== 'INTERN';
  const online = tokenStore.isAuthenticated();

  // Chỉ id số mới là tài khoản/nhóm thật do backend cấp (dữ liệu demo dùng "GRP-x", "INT-01").
  const isBackendId = (id: string) => /^\d+$/.test(id);

  const loadMembers = (groupId: string) => {
    if (!online || !isBackendId(groupId)) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    groupsApi
      .get(Number(groupId))
      .then((g) => setMembers(g.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  };

  useEffect(() => {
    if (openGroupId) loadMembers(openGroupId);
    else setMembers(null);
    setPickedInternIds([]);
    setInternSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGroupId]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      await onCreateGroup(newGroupName.trim(), newGroupCohort.trim());
      setNewGroupName('');
      setIsCreating(false);
    } finally {
      setCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (!openGroupId || pickedInternIds.length === 0) return;
    const ids = pickedInternIds.map(Number).filter(Number.isInteger);
    if (ids.length === 0) {
      alert('Những người bạn chọn là dữ liệu demo, chưa có tài khoản thật trên hệ thống.');
      return;
    }
    setSavingMember(true);
    try {
      const res = await groupsApi.addMembers(Number(openGroupId), ids);
      setPickedInternIds([]);
      loadMembers(openGroupId);
      onReloadGroups();
      // Vào nhóm là kế thừa ngay lộ trình + dự án của nhóm. Nói ra để Mentor biết
      // vừa cấp thêm quyền học/làm việc cho ai, chứ không âm thầm.
      const inherited: string[] = [];
      if (res.inherited_roadmaps > 0) inherited.push(`${res.inherited_roadmaps} lượt gán lộ trình`);
      if (res.inherited_projects > 0) inherited.push(`${res.inherited_projects} lượt vào dự án`);
      if (inherited.length > 0) {
        alert(
          `Đã thêm ${res.added_count} người vào nhóm.\n\n` +
            `Họ được nhận luôn theo nhóm: ${inherited.join(' và ')}.`
        );
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Thêm thành viên thất bại.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (userId: number, fullName: string) => {
    if (!openGroupId) return;
    if (
      !window.confirm(
        `Gỡ "${fullName}" khỏi nhóm này?\n\n` +
          'Những lộ trình / dự án người này nhận được VÌ ở trong nhóm sẽ bị thu hồi — ' +
          'trừ phần họ đã bắt đầu (đã học bài hoặc đang có task), phần đó được giữ lại.'
      )
    ) {
      return;
    }
    setSavingMember(true);
    try {
      const res = await groupsApi.removeMember(Number(openGroupId), userId);
      loadMembers(openGroupId);
      onReloadGroups();
      if (res.kept_roadmaps > 0 || res.kept_projects > 0) {
        alert(
          `Đã gỡ "${fullName}" khỏi nhóm.\n\n` +
            `Giữ lại (vì đã có tiến độ): ${res.kept_roadmaps} lộ trình, ${res.kept_projects} dự án.\n` +
            `Thu hồi: ${res.revoked_roadmaps} lộ trình, ${res.revoked_projects} dự án.`
        );
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gỡ thành viên thất bại.');
    } finally {
      setSavingMember(false);
    }
  };

  // Intern chưa có trong nhóm + khớp từ khoá tìm kiếm.
  const memberIdSet = new Set((members || []).map((m) => String(m.id)));
  const candidates = interns
    .filter((i) => !memberIdSet.has(i.id))
    .filter((i) => {
      const q = internSearch.trim().toLowerCase();
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q);
    });

  if (!isManager) {
    return (
      <div className="p-8 text-center">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
          Quản lý nhóm là chức năng của Mentor / Quản trị viên.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Bạn được Mentor thêm vào nhóm; lộ trình học sẽ tự xuất hiện ở tab &quot;Lộ trình Đào tạo &amp; Skills&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl min-h-[70vh]">
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Quản Lý Nhóm Thực Tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Nhóm & Thành viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Gom thực tập sinh vào nhóm để <strong className="text-slate-200">gán lộ trình cho cả nhóm chỉ bằng một thao tác</strong> ở
            tab &quot;Lộ trình Đào tạo &amp; Skills&quot;.
          </p>
        </div>

        {/* Tạo nhóm */}
        <div className="max-w-xl mx-auto space-y-3">
          <button
            type="button"
            onClick={() => setIsCreating((s) => !s)}
            className="w-full p-4 rounded-2xl border-2 border-slate-700 bg-slate-800/90 hover:border-blue-500 transition-all flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-sm text-white">Tạo Nhóm Mới</p>
              <p className="text-[11px] text-slate-300">VD: Nhóm Thực tập Java Back-End Q3/2026</p>
            </div>
          </button>

          {isCreating && (
            <form
              onSubmit={handleCreateSubmit}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tên Nhóm *</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="VD: Nhóm Thực tập Java Back-End Q3/2026"
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Niên khoá</label>
                <input
                  type="text"
                  value={newGroupCohort}
                  onChange={(e) => setNewGroupCohort(e.target.value)}
                  placeholder="VD: 2026"
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Tạo Nhóm</span>
              </button>
            </form>
          )}
        </div>

        {/* Danh sách nhóm */}
        <div className="max-w-xl mx-auto space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Nhóm trong hệ thống ({groups.length})</span>
          </h3>

          {groups.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Chưa có nhóm nào. Bấm &quot;Tạo Nhóm Mới&quot; ở trên để tạo nhóm đầu tiên.
            </div>
          ) : (
            groups.map((g) => {
              const isOpen = openGroupId === g.id;
              const memberCount = g.memberCount ?? g.members.length;

              return (
                <div
                  key={g.id}
                  className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-md overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenGroupId(isOpen ? null : g.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {g.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-white text-sm truncate">{g.name}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-slate-700 text-slate-200 border-slate-600 uppercase">
                            {memberCount} thành viên
                          </span>
                          {g.cohort && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-slate-700 text-slate-300 border-slate-600 uppercase">
                              Niên khoá {g.cohort}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-300 shrink-0">
                      <span className="hidden sm:inline">Thành viên</span>
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-700/80 p-4 space-y-4">
                      {!isBackendId(g.id) && (
                        <p className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/60 rounded-lg px-3 py-2">
                          Nhóm này chỉ tồn tại cục bộ (tạo khi mất mạng), chưa có trên máy chủ nên
                          không quản lý thành viên được.
                        </p>
                      )}

                      {/* Thành viên hiện tại */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Thành viên hiện tại
                        </p>
                        {loadingMembers ? (
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...
                          </p>
                        ) : !members || members.length === 0 ? (
                          <p className="text-xs text-slate-500">Nhóm chưa có thành viên nào.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {members.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-100 truncate">{m.full_name}</p>
                                  <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={savingMember}
                                  onClick={() => handleRemoveMember(m.id, m.full_name)}
                                  title="Gỡ khỏi nhóm"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 disabled:opacity-50 shrink-0"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Thêm thành viên */}
                      {isBackendId(g.id) && (
                        <div className="space-y-2">
                          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                            Thêm thực tập sinh vào nhóm
                          </p>

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                              value={internSearch}
                              onChange={(e) => setInternSearch(e.target.value)}
                              placeholder="Tìm theo tên hoặc email..."
                              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {candidates.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              {interns.length === 0
                                ? 'Chưa tải được danh sách thực tập sinh.'
                                : 'Không còn thực tập sinh nào phù hợp để thêm.'}
                            </p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                              {candidates.map((i) => {
                                const picked = pickedInternIds.includes(i.id);
                                return (
                                  <label
                                    key={i.id}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                                      picked
                                        ? 'bg-blue-600/20 border-blue-500'
                                        : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={picked}
                                      onChange={() =>
                                        setPickedInternIds((prev) =>
                                          prev.includes(i.id)
                                            ? prev.filter((id) => id !== i.id)
                                            : [...prev, i.id]
                                        )
                                      }
                                      className="accent-blue-600"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-100 truncate">{i.name}</p>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {i.email} · {i.department}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          <button
                            type="button"
                            disabled={pickedInternIds.length === 0 || savingMember}
                            onClick={handleAddMembers}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center justify-center gap-2"
                          >
                            {savingMember ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            <span>
                              Thêm {pickedInternIds.length > 0 ? `${pickedInternIds.length} người` : 'thành viên'}
                            </span>
                          </button>
                          <p className="text-[11px] text-slate-500">
                            Người đã có trong nhóm sẽ tự động được bỏ qua, không báo lỗi.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Gợi ý bước tiếp theo */}
        {groups.length > 0 && (
          <div className="max-w-xl mx-auto bg-blue-950/40 border border-blue-800/60 rounded-2xl p-4 flex items-start gap-3">
            <ChevronRight className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-200 leading-relaxed">
              <strong>Bước tiếp theo:</strong> sang tab &quot;Lộ trình Đào tạo &amp; Skills&quot;, chọn một lộ trình rồi bấm
              <strong> Gán lộ trình → Gán theo Nhóm</strong> để giao lộ trình cho toàn bộ thành viên nhóm cùng lúc.
            </p>
          </div>
        )}

        {/* Người đang đăng nhập — giữ để biết đang thao tác dưới tài khoản nào */}
        <p className="text-center text-[11px] text-slate-500">
          Đang đăng nhập: <span className="text-slate-300 font-bold">{currentUser.name}</span> ({currentRole})
        </p>
      </main>
    </div>
  );
};
