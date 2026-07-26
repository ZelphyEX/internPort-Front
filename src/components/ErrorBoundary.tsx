import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Bắt lỗi render của cây con.
 *
 * Vì sao cần: React 19 unmount TOÀN BỘ cây khi một component ném lỗi lúc render.
 * Không có ranh giới này thì một lỗi nhỏ (vd `roadmaps.map is not a function` khi
 * kiểu dữ liệu API lệch) sẽ cho ra **một trang trắng tinh, không thông báo gì** —
 * đúng triệu chứng đã gặp ở tab "Lộ trình Đào tạo & Skills".
 *
 * Đặt quanh khu vực nội dung chính: lỗi ở một màn hình chỉ làm hỏng màn hình đó,
 * Header/Sidebar vẫn còn để người dùng chuyển sang tab khác.
 */

interface Props {
  children: React.ReactNode;
  /** Đổi giá trị này (vd tab đang mở) sẽ tự reset lỗi khi người dùng đi sang màn khác. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    // Người dùng chuyển màn khác -> bỏ trạng thái lỗi để thử render lại.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log ra console để còn debug được trên bản production đã deploy.
    console.error('[ErrorBoundary] Lỗi render màn hình:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Màn hình này gặp lỗi hiển thị
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Các phần khác của portal vẫn hoạt động bình thường — bạn có thể chuyển sang mục khác ở
            thanh bên trái. Nếu lỗi lặp lại, gửi ảnh chụp nội dung bên dưới cho đội kỹ thuật.
          </p>
          <pre className="text-[11px] text-left bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 overflow-x-auto text-red-600 dark:text-red-400">
            {error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      </div>
    );
  }
}
