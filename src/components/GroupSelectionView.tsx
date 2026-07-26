import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Plus,
  Copy,
  Check,
  X,
  Share2,
  Clock,
  ShieldCheck,
  Link as LinkIcon,
  ArrowRight,
  Sparkles,
  Ban,
  ChevronRight
} from 'lucide-react';
import { AuthUser, Group, UserRole } from '../types';

// Ghi chú phân quyền: POST /groups yêu cầu quyền MENTOR trở lên, nên Intern chỉ
// được THAM GIA nhóm bằng mã mời, không được tạo nhóm. Trước đây nút "Tạo Nhóm Mới"
// hiện cho cả Intern -> bấm vào sẽ bị backend trả 403 (hoặc chỉ tạo nhóm ảo cục bộ).
interface GroupSelectionViewProps {
  currentUser: AuthUser;
  groups: Group[];
  onCreateGroup: (name: string) => void;
  onRequestJoinGroup: (code: string, role: UserRole) => { success: boolean; message: string };
  onSelectGroup: (groupId: string) => void;
  onApproveMember: (groupId: string, userId: string) => void;
  onRejectMember: (groupId: string, userId: string) => void;
  initialJoinCode?: string;
  /** Vai trò đang xem — dùng để ẩn thao tác tạo nhóm với Intern. */
  currentRole: UserRole;
}

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'ADMIN': return 'Quản trị viên';
    case 'MENTOR': return 'Mentor';
    case 'INTERN': return 'Thực tập sinh';
  }
};

const getRoleBadgeClass = (role: UserRole) => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'MENTOR': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'INTERN': return 'bg-amber-100 text-amber-800 border-amber-300';
  }
};

export const GroupSelectionView: React.FC<GroupSelectionViewProps> = ({
  currentUser,
  groups,
  onCreateGroup,
  onRequestJoinGroup,
  onSelectGroup,
  onApproveMember,
  onRejectMember,
  initialJoinCode,
  currentRole
}) => {
  const canCreateGroup = currentRole !== 'INTERN';
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(!!initialJoinCode);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState(initialJoinCode || '');
  const [joinRole, setJoinRole] = useState<UserRole>('INTERN');
  const [joinMessage, setJoinMessage] = useState('');
  const [shareGroupId, setShareGroupId] = useState<string | null>(null);
  const [approveGroupId, setApproveGroupId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode);
      setIsJoining(true);
    }
  }, [initialJoinCode]);

  const myGroups = groups.filter(g => g.members.some(m => m.userId === currentUser.id));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim());
    setNewGroupName('');
    setIsCreating(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const result = onRequestJoinGroup(joinCode.trim().toUpperCase(), joinRole);
    setJoinMessage(result.message);
    if (result.success) {
      setJoinCode('');
      setTimeout(() => {
        setIsJoining(false);
        setJoinMessage('');
      }, 1800);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const shareGroup = groups.find(g => g.id === shareGroupId) || null;
  const approveGroup = groups.find(g => g.id === approveGroupId) || null;
  const inviteLink = shareGroup
    ? `${window.location.origin}${window.location.pathname}?joinCode=${shareGroup.code}`
    : '';

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl relative overflow-hidden pb-10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-10 z-10 space-y-8 relative">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chọn Nhóm Thực Tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bạn muốn vào nhóm nào?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {canCreateGroup
              ? 'Tạo một nhóm mới để quản lý thực tập sinh, hoặc tham gia một nhóm đã có bằng mã mời / link mời.'
              : 'Tham gia nhóm thực tập bằng mã mời hoặc link mời do Mentor/Admin gửi cho bạn.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`grid grid-cols-1 ${canCreateGroup ? 'sm:grid-cols-2' : ''} gap-3 max-w-xl mx-auto`}>
          {canCreateGroup && (
          <button
            type="button"
            onClick={() => { setIsCreating(prev => !prev); setIsJoining(false); }}
            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
              isCreating ? 'bg-blue-600 border-blue-500 shadow-md' : 'bg-slate-800/90 border-slate-700 hover:border-blue-500'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-sm text-white">Tạo Nhóm Mới</p>
              <p className="text-[11px] text-slate-300">Bạn sẽ là Quản trị viên (Admin)</p>
            </div>
          </button>
          )}

          <button
            type="button"
            onClick={() => { setIsJoining(prev => !prev); setIsCreating(false); }}
            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
              isJoining ? 'bg-emerald-600 border-emerald-500 shadow-md' : 'bg-slate-800/90 border-slate-700 hover:border-emerald-500'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-sm text-white">Tham Gia Nhóm</p>
              <p className="text-[11px] text-slate-300">Nhập mã mời hoặc dùng link mời</p>
            </div>
          </button>
        </div>

        {/* Create Group Form */}
        {isCreating && canCreateGroup && (
          <form onSubmit={handleCreateSubmit} className="max-w-xl mx-auto bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <label className="font-bold text-slate-300 block">Tên Nhóm *</label>
            <input
              type="text"
              autoFocus
              required
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="VD: Nhóm Thực tập Java Back-End Q3/2026"
              className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            <p className="text-[11px] text-slate-400">Bạn sẽ tự động trở thành <strong>Quản trị viên (Admin)</strong> của nhóm này.</p>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Tạo Nhóm & Vào Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Join Group Form */}
        {isJoining && (
          <form onSubmit={handleJoinSubmit} className="max-w-xl mx-auto bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Mã Nhóm *</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="VD: A1B2C3"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold tracking-widest uppercase"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Vai trò bạn muốn tham gia *</label>
              <select
                value={joinRole}
                onChange={(e) => setJoinRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="INTERN">🎓 Thực tập sinh (INTERN)</option>
                <option value="MENTOR">👨‍🏫 Mentor Hướng dẫn (MENTOR)</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Yêu cầu tham gia sẽ cần Quản trị viên (Admin) của nhóm xác nhận trước khi bạn vào được.</span>
            </p>

            {joinMessage && (
              <p className={`text-[11px] font-bold rounded-lg px-3 py-2 border ${
                joinMessage.includes('thành công') || joinMessage.includes('Đã gửi')
                  ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60'
                  : 'text-red-300 bg-red-950/40 border-red-800/60'
              }`}>
                {joinMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Gửi Yêu Cầu Tham Gia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* My Groups List */}
        <div className="max-w-xl mx-auto space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Nhóm của bạn ({myGroups.length})</span>
          </h3>

          {myGroups.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-xs">
              Bạn chưa thuộc nhóm nào. Hãy tạo nhóm mới hoặc tham gia bằng mã mời.
            </div>
          ) : (
            myGroups.map((g) => {
              const myMembership = g.members.find(m => m.userId === currentUser.id)!;
              const isGroupAdmin = g.createdBy === currentUser.id || (myMembership.role === 'ADMIN' && myMembership.status === 'Approved');
              const pendingCount = g.members.filter(m => m.status === 'Pending').length;
              const isApproved = myMembership.status === 'Approved';
              const isRejected = myMembership.status === 'Rejected';

              return (
                <div
                  key={g.id}
                  className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-white text-sm truncate">{g.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase ${getRoleBadgeClass(myMembership.role)}`}>
                          {getRoleLabel(myMembership.role)}
                        </span>
                        {isApproved && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-emerald-100 text-emerald-800 border-emerald-300 uppercase">
                            Đã duyệt
                          </span>
                        )}
                        {myMembership.status === 'Pending' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-amber-100 text-amber-800 border-amber-300 uppercase flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Đang chờ duyệt</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-red-100 text-red-800 border-red-300 uppercase flex items-center gap-1">
                            <Ban className="w-2.5 h-2.5" />
                            <span>Bị từ chối</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isGroupAdmin && pendingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setApproveGroupId(g.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pendingCount} yêu cầu</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShareGroupId(g.id)}
                      title="Chia sẻ nhóm"
                      className="p-2 rounded-xl bg-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => onSelectGroup(g.id)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Vào nhóm</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 rounded-xl bg-slate-700 text-slate-400 font-bold text-[11px] cursor-not-allowed"
                      >
                        {isRejected ? 'Không thể vào' : 'Chờ duyệt'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Share Group Modal */}
      {shareGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>Chia sẻ nhóm "{shareGroup.name}"</span>
              </h3>
              <button onClick={() => setShareGroupId(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Mã mời nhóm</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-black tracking-widest text-center text-sm">
                  {shareGroup.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(shareGroup.code, 'code')}
                  className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl cursor-pointer"
                >
                  {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Link mời tham gia</label>
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 font-mono text-[11px] truncate">
                  {inviteLink}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(inviteLink, 'link')}
                  className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl cursor-pointer shrink-0"
                >
                  {copiedField === 'link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">Gửi mã hoặc link này cho thành viên bạn muốn mời. Họ vẫn cần được Admin xác nhận trước khi vào nhóm.</p>
          </div>
        </div>
      )}

      {/* Approve Requests Modal */}
      {approveGroup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Yêu cầu tham gia "{approveGroup.name}"</span>
              </h3>
              <button onClick={() => setApproveGroupId(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {approveGroup.members.filter(m => m.status === 'Pending').length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Không còn yêu cầu nào đang chờ.</p>
              ) : (
                approveGroup.members.filter(m => m.status === 'Pending').map((m) => (
                  <div key={m.userId} className="bg-slate-900/70 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={m.avatar} alt={m.userName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{m.userName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.userEmail}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border uppercase inline-block mt-0.5 ${getRoleBadgeClass(m.role)}`}>
                          {getRoleLabel(m.role)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onApproveMember(approveGroup.id, m.userId)}
                        title="Chấp nhận"
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectMember(approveGroup.id, m.userId)}
                        title="Từ chối"
                        className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
