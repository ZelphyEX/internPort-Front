import React, { useEffect, useState } from 'react';
import { MessageSquare, Code2, Send, Check } from 'lucide-react';
import { UserRole } from '../types';
import { commentsApi, ApiError, ApiComment } from '../services/api';

/**
 * Khối "Thảo Luận & Hỏi Đáp" của một bài học (khoá theo `module_document_id`).
 * Dùng chung cho cả giao diện Mentor và Intern.
 *
 * Lưu ý: `ApiComment.user` không có field `role` nên không tô màu badge theo vai
 * trò tác giả — mọi bình luận hiển thị cùng một kiểu. Chỉ MENTOR mới thấy nút
 * "Đánh dấu Đã Giải Đáp" (backend: `PATCH /comments/{id}/resolve` yêu cầu MENTOR).
 */
export const LessonCommentThread: React.FC<{
  moduleDocumentId: number;
  currentRole: UserRole;
}> = ({ moduleDocumentId, currentRole }) => {
  const [comments, setComments] = useState<ApiComment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    commentsApi
      .list(moduleDocumentId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleDocumentId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await commentsApi.create(moduleDocumentId, content.trim(), null, codeSnippet.trim() || undefined);
      setContent('');
      setCodeSnippet('');
      setShowCode(false);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Gửi bình luận thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId: number, next: boolean) => {
    try {
      await commentsApi.resolve(commentId, next);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : 'Cập nhật thất bại.');
    }
  };

  return (
    <div className="mt-3 p-4 bg-slate-50/90 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
      <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-200">
        <MessageSquare className="w-3.5 h-3.5" /> Thảo Luận &amp; Hỏi Đáp Bài Học
      </div>

      {loading && <p className="text-[11px] text-slate-400">Đang tải bình luận...</p>}
      {!loading && comments && comments.length === 0 && (
        <p className="text-[11px] text-slate-400 italic">Chưa có bình luận nào.</p>
      )}
      {!loading &&
        comments?.map((c) => (
          <div key={c.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {c.user.avatar_url ? (
                  <img src={c.user.avatar_url} alt={c.user.full_name} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                    {c.user.full_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-slate-700 dark:text-slate-200">{c.user.full_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.is_resolved && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300">
                    <Check className="w-3 h-3 text-emerald-600" /> Đã Giải Đáp
                  </span>
                )}
                {currentRole === 'MENTOR' && (
                  <button onClick={() => handleResolve(c.id, !c.is_resolved)} className="text-[10px] font-bold text-blue-600 hover:underline">
                    {c.is_resolved ? 'Bỏ đánh dấu' : 'Đánh dấu Đã Giải Đáp'}
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{c.content}</p>
            {c.code_snippet && (
              <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                <code>{c.code_snippet}</code>
              </pre>
            )}
          </div>
        ))}

      <div className="pt-1 space-y-1.5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Viết câu hỏi / bình luận..."
          className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
        {showCode && (
          <textarea
            value={codeSnippet}
            onChange={(e) => setCodeSnippet(e.target.value)}
            rows={3}
            placeholder="Đoạn code / log lỗi đính kèm (tuỳ chọn)"
            className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono rounded-xl text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => setShowCode((s) => !s)} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <Code2 className="w-3.5 h-3.5" /> {showCode ? 'Bỏ code' : '+ Đính kèm code snippet / Lỗi log'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Gửi Thảo Luận
          </button>
        </div>
      </div>
    </div>
  );
};
