import React from 'react';
import ReactMarkdown from 'react-markdown';
// react-markdown mặc định chỉ hiểu CommonMark, tức là BẢNG và gạch ngang (~~x~~) sẽ
// rơi xuống thành đoạn văn bản thô đầy dấu `|`. Claude hay dùng bảng khi liệt kê
// điểm/tiến độ nên phải bật GitHub Flavored Markdown.
import remarkGfm from 'remark-gfm';

/**
 * Hiển thị văn bản Markdown do Claude sinh ra.
 *
 * Vì sao cần component riêng: mọi chỗ hiện kết quả AI (chatbot, tóm tắt hoạt động,
 * tổng hợp standup) trước đây đổ thẳng chuỗi vào `whitespace-pre-line`, nên người
 * dùng đọc được nguyên dấu `**đậm**`, `### Tiêu đề` và `- gạch đầu dòng` — trong khi
 * system prompt lại yêu cầu model trả lời BẰNG Markdown.
 *
 * Vì sao tự khai báo `components` thay vì dựa vào class `prose`: dự án KHÔNG cài
 * `@tailwindcss/typography`, nên `prose prose-xs` chỉ là class rỗng — có render ra
 * HTML thật thì heading với danh sách vẫn trông y hệt đoạn văn thường.
 */
interface MarkdownTextProps {
  children: string;
  /**
   * `light` (mặc định) cho nền sáng; `invert` cho nền tối (vd thẻ tối ở trang Tổng quan).
   * Chỉ đổi màu chữ — cỡ chữ và khoảng cách do container bên ngoài quyết định.
   */
  tone?: 'light' | 'invert';
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ children, tone = 'light' }) => {
  const strong = tone === 'invert' ? 'text-white' : 'text-slate-900 dark:text-slate-100';
  const heading = tone === 'invert' ? 'text-white' : 'text-slate-900 dark:text-slate-100';
  const code =
    tone === 'invert'
      ? 'bg-white/10 text-amber-200'
      : 'bg-slate-100 dark:bg-slate-700 text-pink-600 dark:text-pink-300';
  const rule = tone === 'invert' ? 'border-white/20' : 'border-slate-200 dark:border-slate-700';
  const quote = tone === 'invert' ? 'border-white/30' : 'border-slate-300 dark:border-slate-600';

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Markdown tách đoạn bằng dòng trống; `space-y-*` của container lo khoảng cách
        // giữa các khối nên ở đây chỉ cần bỏ margin mặc định của thẻ <p>.
        p: ({ children }) => <p className="my-0">{children}</p>,

        strong: ({ children }) => <strong className={`font-bold ${strong}`}>{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,

        // Model hay dùng ### / #### cho các mục. Đưa hết về một cỡ nhỉnh hơn chữ
        // thường: bong bóng chat rất hẹp, heading to sẽ vỡ bố cục.
        h1: ({ children }) => <h3 className={`font-extrabold text-[13px] mt-3 mb-1 first:mt-0 ${heading}`}>{children}</h3>,
        h2: ({ children }) => <h3 className={`font-extrabold text-[13px] mt-3 mb-1 first:mt-0 ${heading}`}>{children}</h3>,
        h3: ({ children }) => <h3 className={`font-extrabold text-[13px] mt-3 mb-1 first:mt-0 ${heading}`}>{children}</h3>,
        h4: ({ children }) => <h4 className={`font-bold mt-2 mb-1 first:mt-0 ${heading}`}>{children}</h4>,
        h5: ({ children }) => <h4 className={`font-bold mt-2 mb-1 first:mt-0 ${heading}`}>{children}</h4>,
        h6: ({ children }) => <h4 className={`font-bold mt-2 mb-1 first:mt-0 ${heading}`}>{children}</h4>,

        ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,

        // `inline` bị bỏ ở react-markdown v10: khối code là <pre><code>, code trong
        // dòng là <code> trần. Nhận biết bằng cách xem có nằm trong <pre> không, nên
        // <pre> tự lo phần bao ngoài và <code> chỉ cần style cho trường hợp inline.
        code: ({ children }) => (
          <code className={`px-1 py-0.5 rounded font-mono text-[0.9em] ${code}`}>{children}</code>
        ),
        pre: ({ children }) => (
          <pre
            className={`my-2 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed ${
              tone === 'invert' ? 'bg-black/30 text-slate-100' : 'bg-slate-900 text-slate-100'
            } [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit`}
          >
            {children}
          </pre>
        ),

        // Link do AI sinh ra luôn mở tab mới; `noreferrer` để trang đích không đọc
        // được URL portal (có thể chứa id) qua document.referrer.
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 break-all"
          >
            {children}
          </a>
        ),

        blockquote: ({ children }) => (
          <blockquote className={`border-l-2 pl-3 my-2 italic ${quote}`}>{children}</blockquote>
        ),
        hr: () => <hr className={`my-3 border-t ${rule}`} />,

        // Bảng dễ tràn ngang trong bong bóng chat — cho cuộn trong khung riêng thay
        // vì đẩy cả modal rộng ra.
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full text-left border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className={`border-b px-2 py-1 font-bold whitespace-nowrap ${rule}`}>{children}</th>
        ),
        td: ({ children }) => <td className={`border-b px-2 py-1 align-top ${rule}`}>{children}</td>,

        del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
