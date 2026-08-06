import { UserRole } from '../types';

/**
 * Nguồn duy nhất quy định "vai trò nào được làm gì" trên giao diện.
 *
 * Mô hình phân quyền (chốt 27/07/2026) — ADMIN **không** còn là superuser:
 *
 *   MENTOR : vận hành toàn bộ nghiệp vụ — lộ trình, bài học, dự án, task, tài liệu,
 *            duyệt báo cáo — và quản lý tài khoản THỰC TẬP SINH (thêm/xoá/khoá).
 *   ADMIN  : quản trị tài khoản — tạo/xoá Intern & Mentor, duyệt Mentor đăng ký.
 *            Với các mục nghiệp vụ thì **chỉ xem**, không tạo/sửa/xoá.
 *   INTERN : chỉ dùng phần của mình.
 *
 * ⚠️ Đây là lớp GIAO DIỆN. Backend vẫn cho ADMIN thao tác vì phân cấp
 * ADMIN > MENTOR ở `require_role`. Quyết định này là có chủ ý (Admin là người nội
 * bộ tin cậy); muốn chặn thật thì phải đổi mô hình phân quyền ở backend.
 */

/** Tạo/sửa/xoá các mục nghiệp vụ: lộ trình, chặng, bài học, dự án, task, tài liệu, nhóm. */
export const canManageContent = (role: UserRole): boolean => role === 'MENTOR';

/** Duyệt báo cáo hằng ngày của thực tập sinh. */
export const canReviewReports = (role: UserRole): boolean => role === 'MENTOR';

/** Thêm / xoá / khoá tài khoản Thực tập sinh. */
export const canManageInterns = (role: UserRole): boolean =>
  role === 'MENTOR' || role === 'ADMIN';

/** Tạo tài khoản Mentor và duyệt Mentor tự đăng ký — chỉ Quản trị viên. */
export const canManageMentors = (role: UserRole): boolean => role === 'ADMIN';

/** Xem được các màn quản lý (danh sách intern, dashboard tổng quan...). */
export const canViewManagement = (role: UserRole): boolean => role !== 'INTERN';

/** Câu giải thích dùng chung khi Admin chỉ được xem. */
export const ADMIN_READ_ONLY_NOTE =
  'Tài khoản Quản trị viên chỉ xem ở mục này. Việc tạo/sửa/xoá do Mentor thực hiện.';
