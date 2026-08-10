import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Clock,
  Loader2,
  X,
  AlertTriangle,
  Check,
  Undo2,
  ShieldCheck,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { UserRole } from '../types';
import { ApiError, ApiRoleRequest, roleRequestsApi, tokenStore } from '../services/api';

/**
 * Nút "chuyển vai trò" trong Cài đặt.
 *
 * Luật (backend là nơi thực thi, xem app/services/role_request_service.py):
 *   * Thực tập sinh -> Mentor : gửi yêu cầu, **chờ Quản trị viên duyệt**. Trong lúc
 *     chờ, người dùng có thể tự **rút lại** yêu cầu.
 *   * Mentor -> Thực tập sinh : là hạ quyền nên **áp dụng ngay**, không cần duyệt,
 *     nhưng vẫn phải xác nhận qua popup cảnh báo.
 *   * Quản trị viên : không dùng cơ chế này.
 */

interface RoleSwitchCardProps {
  /** Vai trò THẬT của tài khoản (server trả về), không phải vai trò đang xem thử. */
  realRole: UserRole;
  /** Gọi sau khi vai trò đã đổi thật, để App tải lại phiên từ `GET /auth/me`. */
  onRoleApplied: () => void;
}

export const RoleSwitchCard: React.FC<RoleSwitchCardProps> = ({ realRole, onRoleApplied }) => {
  const [pendingRequest, setPendingRequest] = useState<ApiRoleRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Popup xác nhận: 'UP' = xin lên Mentor, 'DOWN' = về Thực tập sinh, 'CANCEL' = rút yêu cầu.
  const [confirming, setConfirming] = useState<'UP' | 'DOWN' | 'CANCEL' | null>(null);

  const targetRole: UserRole = realRole === 'MENTOR' ? 'INTERN' : 'MENTOR';

  const load = () => {
    // Admin không dùng cơ chế này nên khỏi gọi API.
    if (realRole === 'ADMIN' || !tokenStore.isAuthenticated()) {
      setPendingRequest(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    roleRequestsApi
      .me()
      .then((req) => setPendingRequest(req ?? null))
      .catch(() => setPendingRequest(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const reportError = (err: unknown, fallback: string) => {
    setError(
      err instanceof ApiError
        ? err.detail || fallback
        : `${fallback} Không kết nối được máy chủ — thao tác chưa được lưu.`
    );
  };

  const submitRequest = async () => {
    setError('');
    setNotice('');
    setIsBusy(true);
    try {
      const req = await roleRequestsApi.create(targetRole === 'MENTOR' ? 'MENTOR' : 'INTERN');
      setConfirming(null);
      if (req.applied) {
        // Hạ quyền: đã đổi ngay -> tải lại phiên để giao diện khớp vai trò mới.
        setNotice('Đã chuyển bạn về vai trò Thực tập sinh.');
        setPendingRequest(null);
        onRoleApplied();
      } else {
        setNotice('Đã gửi yêu cầu. Quản trị viên sẽ xem xét và duyệt.');
        setPendingRequest(req);
      }
    } catch (err) {
      reportError(err, 'Gửi yêu cầu thất bại.');
      setConfirming(null);
    } finally {
      setIsBusy(false);
    }
  };

  const cancelRequest = async () => {
    setError('');
    setNotice('');
    setIsBusy(true);
    try {
      await roleRequestsApi.cancelMine();
      setPendingRequest(null);
      setConfirming(null);
      setNotice('Đã rút lại yêu cầu chuyển vai trò.');
    } catch (err) {
      reportError(err, 'Rút yêu cầu thất bại.');
      setConfirming(null);
    } finally {
      setIsBusy(false);
    }
  };

  // Admin không dùng cơ chế này.
  if (realRole === 'ADMIN') {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
            Tài khoản Quản trị viên không đổi vai trò
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Vai trò Quản trị viên do hệ thống cấp. Bạn là người duyệt yêu cầu chuyển vai
            trò của người khác ở tab <strong>Mentor</strong>.
          </p>
        </div>
      </div>
    );
  }

  const confirmDialog = confirming && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                confirming === 'DOWN'
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                  : confirming === 'CANCEL'
                  ? 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
              }`}
            >
              {confirming === 'DOWN' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : confirming === 'CANCEL' ? (
                <Undo2 className="w-5 h-5" />
              ) : (
                <ArrowLeftRight className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {confirming === 'DOWN'
                ? 'Chuyển về vai trò Thực tập sinh?'
                : confirming === 'CANCEL'
                ? 'Rút lại yêu cầu chuyển vai trò?'
                : 'Gửi yêu cầu trở thành Mentor?'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {confirming === 'UP' && (
            <>
              <p>
                Yêu cầu sẽ được gửi tới <strong>Quản trị viên</strong> để xem xét. Trong lúc
                chờ, bạn vẫn dùng portal bình thường với vai trò Thực tập sinh.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bạn có thể rút lại yêu cầu bất cứ lúc nào trước khi được duyệt.
              </p>
            </>
          )}

          {confirming === 'DOWN' && (
            <>
              <p className="font-bold text-amber-700 dark:text-amber-400">
                Thao tác này có hiệu lực ngay, không cần ai duyệt.
              </p>
              <p>
                Bạn sẽ <strong>mất toàn bộ quyền Mentor</strong>: không còn tạo/sửa lộ trình
                đào tạo, giao việc, duyệt báo cáo hay quản lý thực tập sinh và nhóm.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Muốn quay lại làm Mentor, bạn phải gửi yêu cầu mới và chờ Quản trị viên duyệt.
              </p>
            </>
          )}

          {confirming === 'CANCEL' && (
            <p>
              Yêu cầu đang chờ duyệt sẽ bị huỷ. Vai trò của bạn không thay đổi và bạn có thể
              gửi lại yêu cầu sau.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setConfirming(null)}
            disabled={isBusy}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs cursor-pointer"
          >
            Không, giữ nguyên
          </button>
          <button
            type="button"
            onClick={confirming === 'CANCEL' ? cancelRequest : submitRequest}
            disabled={isBusy}
            className={`px-4 py-2 rounded-xl text-white font-extrabold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-xs ${
              confirming === 'DOWN'
                ? 'bg-amber-600 hover:bg-amber-500'
                : confirming === 'CANCEL'
                ? 'bg-slate-700 hover:bg-slate-600'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>
              {confirming === 'DOWN'
                ? 'Xác nhận hạ vai trò'
                : confirming === 'CANCEL'
                ? 'Rút yêu cầu'
                : 'Gửi yêu cầu duyệt'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Chuyển vai trò tài khoản
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug flex items-center gap-1.5 flex-wrap">
                {realRole === 'INTERN' ? (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Thực tập sinh</span>
                    <span className="text-slate-400">→</span>
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Mentor — cần Quản trị viên duyệt.</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Mentor</span>
                    <span className="text-slate-400">→</span>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Thực tập sinh — có hiệu lực ngay, không cần duyệt.</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {isLoading ? (
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang kiểm tra...
            </span>
          ) : pendingRequest ? (
            <button
              type="button"
              onClick={() => setConfirming('CANCEL')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Rút lại yêu cầu</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(realRole === 'MENTOR' ? 'DOWN' : 'UP')}
              className={`px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                realRole === 'MENTOR'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>
                {realRole === 'MENTOR'
                  ? 'Chuyển về Thực tập sinh'
                  : 'Yêu cầu chuyển thành Mentor'}
              </span>
            </button>
          )}
        </div>

        {pendingRequest && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 text-[11px] font-bold text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>
              Đang chờ Quản trị viên duyệt yêu cầu chuyển sang{' '}
              {pendingRequest.to_role === 'MENTOR' ? 'Mentor' : 'Thực tập sinh'}
              {' '}(gửi lúc {new Date(pendingRequest.created_at).toLocaleString('vi-VN')}).
            </span>
          </div>
        )}

        {notice && (
          <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{notice}</span>
          </p>
        )}

        {error && (
          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-start gap-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 rounded-lg px-2.5 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {confirmDialog}
    </div>
  );
};
