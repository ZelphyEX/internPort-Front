import React, { useState } from 'react';
import { X, Hash, Link as LinkIcon, Mail, Copy, Check, Send, Users, ExternalLink } from 'lucide-react';
import { Group } from '../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

type InviteMethod = 'code' | 'link' | 'gmail';

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, group }) => {
  const [activeMethod, setActiveMethod] = useState<InviteMethod>('code');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const inviteLink = group ? `${window.location.origin}${window.location.pathname}?joinCode=${group.code}` : '';

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSendGmail = () => {
    if (!group || !inviteEmail.trim()) return;
    const subject = encodeURIComponent(`Lời mời tham gia nhóm "${group.name}" trên Gimasys Intern Portal`);
    const body = encodeURIComponent(
      `Xin chào,\n\nBạn được mời tham gia nhóm "${group.name}" trên Gimasys Intern Portal.\n\nMã mời: ${group.code}\nHoặc bấm vào link sau để tham gia trực tiếp:\n${inviteLink}\n\nLưu ý: Sau khi gửi yêu cầu tham gia, bạn cần chờ Quản trị viên (Admin) của nhóm xác nhận.\n\nTrân trọng,\nGimasys Intern Portal`
    );
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inviteEmail.trim())}&su=${subject}&body=${body}`,
      '_blank'
    );
    setInviteEmail('');
  };

  const methods: { key: InviteMethod; label: string; icon: React.ElementType }[] = [
    { key: 'code', label: 'Mã mời', icon: Hash },
    { key: 'link', label: 'Link mời', icon: LinkIcon },
    { key: 'gmail', label: 'Gmail', icon: Mail }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold text-base">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Mời Người Vào Nhóm</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!group ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Bạn cần thuộc một nhóm để mời thêm người tham gia.
          </div>
        ) : (
          <>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mời thêm người vào nhóm <strong className="text-slate-700 dark:text-slate-300">"{group.name}"</strong>. Người được mời cần chờ Admin xác nhận trước khi vào nhóm.
            </p>

            {/* Method Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              {methods.map((m) => {
                const Icon = m.icon;
                const isActive = activeMethod === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setActiveMethod(m.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isActive ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: Mã mời */}
            {activeMethod === 'code' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Mã mời nhóm</label>
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-black tracking-widest text-center text-sm">
                    {group.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(group.code, 'code')}
                    className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
                  >
                    {copiedField === 'code' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Gửi mã này cho người bạn muốn mời. Họ nhập mã ở màn hình "Tham gia nhóm".</p>
              </div>
            )}

            {/* TAB: Link mời */}
            {activeMethod === 'link' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Link mời tham gia</label>
                <div className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate">
                    {inviteLink}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(inviteLink, 'link')}
                    className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer shrink-0"
                  >
                    {copiedField === 'link' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Bấm vào link này sẽ tự động điền mã mời ở màn hình tham gia nhóm.</p>
              </div>
            )}

            {/* TAB: Gmail */}
            {activeMethod === 'gmail' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Địa chỉ Gmail người nhận</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="vd: intern.moi@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendGmail}
                  disabled={!inviteEmail.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Soạn Email Mời qua Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-slate-400">Mở cửa sổ soạn thư Gmail với nội dung mời + mã/link đã điền sẵn.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
