import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Loader2, 
  HelpCircle,
  Code2,
  BookOpen,
  Database
} from 'lucide-react';
import { AIMessage, AuthUser, UserRole } from '../types';
import { useDismissablePopup } from '../hooks/useDismissablePopup';
import { tokenStore } from '../services/api';
import { MarkdownText } from './MarkdownText';

/**
 * Nhãn tiếng Việt cho tên endpoint mà server trả về trong `lookups`.
 * Tên nào chưa có nhãn thì hiện nguyên tên — thà xấu còn hơn giấu nguồn.
 */
const SOURCE_LABELS: Record<string, string> = {
  me: 'Hồ sơ cá nhân',
  dashboard_me: 'Tổng quan cá nhân',
  dashboard_overview: 'Tổng quan hệ thống',
  dashboard_roadmap: 'Tiến độ lộ trình',
  users: 'Danh sách thành viên',
  user: 'Hồ sơ thành viên',
  groups: 'Nhóm thực tập',
  group: 'Chi tiết nhóm',
  role_requests: 'Yêu cầu đổi vai trò',
  my_role_request: 'Yêu cầu đổi vai trò của tôi',
  roadmaps: 'Lộ trình đào tạo',
  roadmap: 'Chi tiết lộ trình',
  my_roadmaps: 'Lộ trình của tôi',
  my_roadmap_detail: 'Tiến độ lộ trình của tôi',
  user_roadmaps: 'Lộ trình của thành viên',
  user_roadmap_detail: 'Tiến độ lộ trình của thành viên',
  roadmap_assignments: 'Lượt gán lộ trình',
  documents: 'Thư viện tài liệu',
  document: 'Tài liệu',
  tags: 'Thẻ phân loại',
  lesson_comments: 'Thảo luận bài học',
  projects: 'Dự án',
  project: 'Chi tiết dự án',
  tasks: 'Task Kanban',
  task: 'Chi tiết task',
  daily_reports: 'Báo cáo hằng ngày',
  daily_report: 'Chi tiết báo cáo',
  my_exam_summary: 'Điểm thi thử của tôi',
  my_exam_attempts: 'Lịch sử thi thử của tôi',
  exam_overview: 'Bảng điểm thi thử',
  user_exam_summary: 'Điểm thi thử của thành viên',
  user_exam_attempts: 'Lịch sử thi thử của thành viên',
};

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  /** Người đang đăng nhập — gửi kèm để trợ lý biết đang nói chuyện với ai. */
  currentUser?: AuthUser | null;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUser
}) => {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: 'Xin chào! Tôi là **Trợ lý AI Mentor Gimasys** (được vận hành bởi Claude Haiku 4.5).\n\nTôi đọc được **dữ liệu thật trên portal** trong phạm vi quyền của bạn: tiến độ lộ trình, task Kanban, dự án, báo cáo hằng ngày, điểm thi thử, tài liệu. Ngoài ra tôi vẫn giải đáp thắc mắc kỹ thuật (Java, React, DevOps, Cloud, Salesforce) và quy trình thực tập. Bạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const dismiss = useDismissablePopup(onClose);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const promptChips = [
    'Tôi đang học tới đâu rồi?',
    'Còn task nào chưa xong hoặc đang bị Blocked?',
    'Điểm thi thử của tôi thế nào, đề nào cần thi lại?',
    'Quy định nộp báo cáo hằng ngày (Daily Standup) tại Gimasys là gì?',
    'Hướng dẫn quy chuẩn Git Commit Message & Pull Request?'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendPrompt = async (textToSend?: string) => {
    const messageText = textToSend || inputPrompt;
    if (!messageText.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      // Gửi kèm các lượt trước để trợ lý nhớ mạch hội thoại. Trước đây chỉ gửi
      // `message` nên mỗi câu hỏi là một cuộc trò chuyện mới — hỏi "còn cách nào
      // khác không?" thì trợ lý không biết "khác" so với gì.
      //
      // Bỏ lời chào mở đầu (`msg-1`, do client tự dựng, model chưa hề nói câu đó) và
      // các thông báo lỗi: lượt đầu tiên gửi lên PHẢI là của người dùng.
      const history = messages
        .filter((m) => m.id !== 'msg-1' && !m.id.startsWith('err-'))
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      // Chuyển tiếp access token của chính người dùng: server dùng đúng token này để
      // tra cứu dữ liệu portal, nên backend vẫn chặn theo quyền (Intern không đọc
      // được dữ liệu người khác). Thiếu token thì trợ lý chỉ trả lời kiến thức chung.
      const accessToken = tokenStore.getAccess();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          message: messageText,
          history,
          role: currentRole,
          userContext: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
                roleTitle: currentUser.roleTitle
              }
            : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        const botMsg: AIMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          sources: Array.isArray(data.lookups) ? data.lookups : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Không nhận được câu trả lời từ AI');
      }
    } catch (e: any) {
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Chưa nhận được phản hồi từ AI Server. Hãy đảm bảo ANTHROPIC_API_KEY đã được cấu hình trên server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      {...dismiss}
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full h-[650px] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/30 text-amber-300 border border-indigo-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Trợ lý AI Mentor Gimasys</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Claude Haiku 4.5
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Giải đáp quy trình, tư vấn kỹ thuật & hướng dẫn thực tập 24/7</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-1 shadow-2xs ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 rounded-bl-none'
              }`}>
                {/* Câu của người dùng là chữ thuần, giữ nguyên xuống dòng họ gõ.
                    Câu của trợ lý là Markdown do Claude sinh ra nên phải render, không
                    thì hiện nguyên dấu ** và ###. */}
                {msg.sender === 'user' ? (
                  <div className="leading-relaxed whitespace-pre-line">{msg.text}</div>
                ) : (
                  <div className="leading-relaxed space-y-1.5">
                    <MarkdownText>{msg.text}</MarkdownText>
                  </div>
                )}

                {/* Nguồn dữ liệu đã tra cứu — để người dùng biết con số lấy từ đâu */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-2 mt-1 border-t border-slate-100 dark:border-slate-700">
                    <Database className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dữ liệu:</span>
                    {msg.sources.map((source) => (
                      <span
                        key={source}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      >
                        {SOURCE_LABELS[source] ?? source}
                      </span>
                    ))}
                  </div>
                )}

                <span className={`text-[10px] block text-right font-medium ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI Mentor đang tra cứu dữ liệu &amp; tư duy...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase">Gợi ý:</span>
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(chip)}
              className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Nhập câu hỏi cho AI Mentor Gimasys..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
