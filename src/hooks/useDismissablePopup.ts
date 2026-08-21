import React, { useEffect } from 'react';

/**
 * Cơ chế đóng popup dùng chung: bấm ra vùng nền bên ngoài, hoặc nhấn Esc —
 * cộng thêm nút X sẵn có trên từng popup (giữ nguyên, coi như 3 tuỳ chọn).
 *
 * Vì sao cần dùng `onMouseDown` chứ không phải `onClick` cho vùng nền:
 * `onClick` chỉ nổ khi CẢ mousedown lẫn mouseup xảy ra trên cùng một phần tử.
 * Nếu người dùng bắt đầu bôi đen một đoạn văn bản BÊN TRONG popup rồi nhả chuột
 * ra ngoài nền, `onClick` vẫn nổ trên nền và popup đóng đột ngột giữa lúc đang
 * chọn chữ. Bắt `mousedown` thì hành vi này không xảy ra: chỉ đóng khi cú nhấn
 * thật sự BẮT ĐẦU ở vùng nền.
 *
 * Trả về props để rải vào thẳng phần tử nền (lớp `fixed inset-0 ...`):
 *
 *     const dismiss = useDismissablePopup(onClose);
 *     <div className="fixed inset-0 ..." {...dismiss}>
 *       <div className="...panel..."> ... </div>
 *     </div>
 *
 * `e.target === e.currentTarget` bảo đảm chỉ đóng khi bấm đúng vào nền, không
 * đóng khi bấm vào panel con (sự kiện từ panel nổi bọt lên nền) — nhờ vậy không
 * phải rải `stopPropagation` khắp các phần tử bên trong.
 */
export function useDismissablePopup(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
  };
}
