import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  ListRestart, 
  AlertCircle,
  FileCheck2,
  ChevronRight,
  Eye,
  Info,
  Sliders,
  Pause,
  Play,
  Save,
  History
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  tokenStore,
  examAttemptsApi,
  examScaledScore,
  examIsPassing,
  examPercent,
  EXAM_PASSING_SCORE,
  EXAM_PASS_PERCENT,
  EXAM_SCORE_MAX,
} from '../services/api';
import { ExamScoresModal } from './ExamScoresModal';

// Import Claude Developer (dev)
import dev1 from '../data/CF.tests/exams/exam_dev_1.json';
import dev2 from '../data/CF.tests/exams/exam_dev_2.json';
import dev3 from '../data/CF.tests/exams/exam_dev_3.json';
import dev4 from '../data/CF.tests/exams/exam_dev_4.json';
import dev5 from '../data/CF.tests/exams/exam_dev_5.json';
import dev6 from '../data/CF.tests/exams/exam_dev_6.json';

// Import Claude Foundation (foundation)
import fd1 from '../data/CF.tests/exams/exam_foundation_1.json';
import fd2 from '../data/CF.tests/exams/exam_foundation_2.json';
import fd3 from '../data/CF.tests/exams/exam_foundation_3.json';
import fd4 from '../data/CF.tests/exams/exam_foundation_4.json';
import fd5 from '../data/CF.tests/exams/exam_foundation_5.json';
import fd6 from '../data/CF.tests/exams/exam_foundation_6.json';

// Import Claude Architect Professional (pro)
import pro1 from '../data/CF.tests/exams/exam_pro_1.json';
import pro2 from '../data/CF.tests/exams/exam_pro_2.json';
import pro3 from '../data/CF.tests/exams/exam_pro_3.json';
import pro4 from '../data/CF.tests/exams/exam_pro_4.json';
import pro5 from '../data/CF.tests/exams/exam_pro_5.json';
import pro6 from '../data/CF.tests/exams/exam_pro_6.json';

interface Choice {
  key: string;
  text: string;
}

interface Question {
  number: number;
  question: string;
  multiSelect: boolean;
  choices: Choice[];
  correct: string[];
  explanations: Record<string, string>;
  questionExplanation: string;
}

interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: number; // minutes
  questions: Question[];
}

interface SavedSession {
  examId: string;
  mode: 'practice' | 'exam';
  currentQuestionIndex: number;
  selectedAnswers: Record<number, string[]>;
  checkedQuestions: Record<number, boolean>;
  timeLeft: number;
  date: string;
}

const EXAMS_DATA: Exam[] = [
  // Claude Developer
  {
    id: 'claude-dev-1',
    title: 'Claude Developer — Practice Exam 1',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 1 ôn luyện chứng chỉ Claude Developer. Đánh giá kỹ năng lập trình với Claude API, sử dụng SDK, tối ưu hóa prompt trong code và xây dựng ứng dụng.',
    duration: 120,
    questions: dev1.questions as Question[]
  },
  {
    id: 'claude-dev-2',
    title: 'Claude Developer — Practice Exam 2',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 2 ôn luyện chứng chỉ Claude Developer. Tập trung vào các kỹ thuật gọi tool (Tool Calling), quản lý lỗi API và xử lý bất đồng bộ.',
    duration: 120,
    questions: dev2.questions as Question[]
  },
  {
    id: 'claude-dev-3',
    title: 'Claude Developer — Practice Exam 3',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 3 ôn luyện chứng chỉ Claude Developer. Đánh giá thiết kế giải pháp AI, tối ưu hóa Token, xử lý context window dài và kiểm soát chi phí.',
    duration: 120,
    questions: dev3.questions as Question[]
  },
  {
    id: 'claude-dev-4',
    title: 'Claude Developer — Practice Exam 4',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 4 ôn luyện chứng chỉ Claude Developer. Bao gồm thiết lập và tích hợp Model Context Protocol (MCP) và các chuẩn bảo mật truyền nhận dữ liệu.',
    duration: 120,
    questions: dev4.questions as Question[]
  },
  {
    id: 'claude-dev-5',
    title: 'Claude Developer — Practice Exam 5',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 5 ôn luyện chứng chỉ Claude Developer. Kiểm tra các tình huống thực tế về orchestration, chaining và kết hợp nhiều LLM.',
    duration: 120,
    questions: dev5.questions as Question[]
  },
  {
    id: 'claude-dev-6',
    title: 'Claude Developer — Practice Exam 6',
    code: 'Claude Developer',
    description: 'Bộ câu hỏi thi thử số 6 ôn luyện chứng chỉ Claude Developer. Tổng hợp nâng cao, sẵn sàng cho kỳ thi chính thức của Anthropic dành cho nhà phát triển.',
    duration: 120,
    questions: dev6.questions as Question[]
  },

  // Claude Foundation
  {
    id: 'claude-foundation-1',
    title: 'Claude Foundation — Practice Exam 1',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 1 chứng chỉ Claude Certified Architect - Foundations. Tập trung vào cấu trúc hệ thống, SDK cơ bản, thiết kế Prompt và các đặc điểm mô hình.',
    duration: 120,
    questions: fd1.questions as Question[]
  },
  {
    id: 'claude-foundation-2',
    title: 'Claude Foundation — Practice Exam 2',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 2 chứng chỉ Claude Certified Architect - Foundations. Đánh giá các quy tắc prompt cơ bản, cấu trúc context window, và định dạng JSON.',
    duration: 120,
    questions: fd2.questions as Question[]
  },
  {
    id: 'claude-foundation-3',
    title: 'Claude Foundation — Practice Exam 3',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 3 chứng chỉ Claude Certified Architect - Foundations. Tập trung sâu vào cơ chế Tokenizer, Prompt Engineering, và cấu hình cuộc hội thoại.',
    duration: 120,
    questions: fd3.questions as Question[]
  },
  {
    id: 'claude-foundation-4',
    title: 'Claude Foundation — Practice Exam 4',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 4 chứng chỉ Claude Certified Architect - Foundations. Gồm các câu hỏi thực tế về Model Context Protocol (MCP) và bảo mật cơ bản cho doanh nghiệp.',
    duration: 120,
    questions: fd4.questions as Question[]
  },
  {
    id: 'claude-foundation-5',
    title: 'Claude Foundation — Practice Exam 5',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 5 chứng chỉ Claude Certified Architect - Foundations. Trắc nghiệm mô phỏng chi tiết các case study thiết kế Prompt và định dạng API.',
    duration: 120,
    questions: fd5.questions as Question[]
  },
  {
    id: 'claude-foundation-6',
    title: 'Claude Foundation — Practice Exam 6',
    code: 'Claude Foundation',
    description: 'Bộ câu hỏi thi thử số 6 chứng chỉ Claude Certified Architect - Foundations. Kiểm tra kiến thức tổng hợp, so sánh mô hình Opus, Sonnet và Haiku.',
    duration: 120,
    questions: fd6.questions as Question[]
  },

  // Claude Certified Architect - Professional
  {
    id: 'claude-pro-1',
    title: 'Claude Certified Architect – Professional — Practice Exam 1',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi ôn luyện chứng chỉ chuyên gia CCAP-P (Claude Certified Architect - Professional). Gồm các bài toán thiết kế kiến trúc AI cấp doanh nghiệp nâng cao, bảo mật dữ liệu, và tích hợp quy mô lớn.',
    duration: 120,
    questions: pro1.questions as Question[]
  },
  {
    id: 'claude-pro-2',
    title: 'Claude Certified Architect – Professional — Practice Exam 2',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi thi thử số 2 cho chứng chỉ CCAP-P. Đánh giá khả năng tối ưu hóa chi phí API, thiết lập caching thông minh, và xử lý Rate Limit trên quy mô lớn.',
    duration: 120,
    questions: pro2.questions as Question[]
  },
  {
    id: 'claude-pro-3',
    title: 'Claude Certified Architect – Professional — Practice Exam 3',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi thi thử số 3 cho chứng chỉ CCAP-P. Tập trung vào an toàn AI, hạn chế tấn công prompt injection, và giám sát tính nhất quán của hệ thống.',
    duration: 120,
    questions: pro3.questions as Question[]
  },
  {
    id: 'claude-pro-4',
    title: 'Claude Certified Architect – Professional — Practice Exam 4',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi thi thử số 4 cho chứng chỉ CCAP-P. Chứa các câu hỏi tình huống thực tiễn thiết kế hệ thống multi-agent phức tạp và luồng kiểm soát chất lượng.',
    duration: 120,
    questions: pro4.questions as Question[]
  },
  {
    id: 'claude-pro-5',
    title: 'Claude Certified Architect – Professional — Practice Exam 5',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi thi thử số 5 cho chứng chỉ CCAP-P. Ôn tập kỹ thuật Fine-tuning, RAG kết hợp, và sử dụng công nghệ thị giác máy tính trong sản xuất.',
    duration: 120,
    questions: pro5.questions as Question[]
  },
  {
    id: 'claude-pro-6',
    title: 'Claude Certified Architect – Professional — Practice Exam 6',
    code: 'Claude Professional',
    description: 'Bộ câu hỏi thi thử số 6 cho chứng chỉ CCAP-P. Kiến thức tổng quát cuối cùng, đảm bảo sự sẵn sàng tốt nhất cho kỳ thi chính thức của Anthropic.',
    duration: 120,
    questions: pro6.questions as Question[]
  }
];

interface MockExamViewProps {
  currentUser: AuthUser | null;
}

export const MockExamView: React.FC<MockExamViewProps> = ({ currentUser }) => {
  const [examState, setExamState] = useState<'select' | 'quiz' | 'result'>('select');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [showInstantExplanation, setShowInstantExplanation] = useState<boolean>(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  
  // Paused states
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [savedSessions, setSavedSessions] = useState<Record<string, SavedSession>>({});
  // Khác null = nộp bài xong nhưng không đẩy được kết quả lên server.
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isScoresOpen, setIsScoresOpen] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Bài đang làm dở được lưu ở máy (server không có khái niệm "bài thi tạm"), nên
  // khoá phải gắn với ID TÀI KHOẢN, không phải email.
  //
  // Trước đây khoá là email. Xoá tài khoản rồi đăng nhập lại bằng đúng email đó sẽ
  // sinh ra một tài khoản MỚI (id mới, `auth_service.delete_self` chỉ đặt `deleted_at`
  // và đổi tên email cũ) — nhưng trình duyệt vẫn khớp khoá cũ, nên bài thi và điểm
  // của tài khoản đã xoá hiện lại trên tài khoản mới, trong khi Mentor xem qua API
  // thì không thấy gì. Đó chính là chỗ dữ liệu lệch nhau.
  const sessionKey = currentUser ? `gimasys_exam_saved_u${currentUser.id}` : null;

  // Load saved sessions on mount
  useEffect(() => {
    // Dọn các khoá kiểu cũ (theo email) một lần: chúng không thuộc về tài khoản nào
    // xác định được nữa và chỉ còn khả năng làm dữ liệu lẫn sang tài khoản khác.
    // Điểm (`gimasys_exam_scores_*`) bỏ hẳn — giờ chỉ đọc từ server.
    // Nhận ra khoá kiểu cũ bằng dấu '@': khoá mới là `..._u<id>` nên không thể có
    // '@', còn khoá cũ luôn có vì nó ghép email vào.
    // `Object.keys` trả về bản chụp nên xoá trong lúc lặp là an toàn.
    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith('gimasys_exam_scores_') ||
          (k.startsWith('gimasys_exam_saved_') && k.includes('@'))
      )
      .forEach((k) => localStorage.removeItem(k));

    if (!sessionKey) return;
    const savedSession = localStorage.getItem(sessionKey);
    try {
      setSavedSessions(savedSession ? JSON.parse(savedSession) : {});
    } catch {
      setSavedSessions({});
    }
  }, [sessionKey]);

  // Điểm CHỈ lấy từ SERVER (`GET /exam-attempts/me/summary`) — không đệm ở máy nữa.
  // Server là nguồn sự thật duy nhất: đổi máy vẫn thấy đúng điểm, Mentor xem được
  // điểm của Thực tập sinh, và điểm không bao giờ sống lâu hơn tài khoản.
  // Ngoại tuyến thì để trống chứ không hiện điểm cũ — thà không có số còn hơn hiện
  // một con số không ai kiểm chứng được.
  const reloadBestScores = React.useCallback(() => {
    if (!tokenStore.isAuthenticated()) {
      setBestScores({});
      return;
    }
    examAttemptsApi
      .mySummary()
      .then((summary) => {
        const fromServer: Record<string, number> = {};
        summary.per_exam.forEach((e) => {
          fromServer[e.exam_id] = e.best_score;
        });
        setBestScores(fromServer);
      })
      .catch(() => {/* ngoại tuyến: giữ nguyên những gì đang hiện */});
  }, []);

  useEffect(reloadBestScores, [reloadBestScores, currentUser]);

  // Timer countdown
  useEffect(() => {
    if (examState === 'quiz' && mode === 'exam' && timeLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, mode, timeLeft, isPaused]);

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setShowInstantExplanation(false);
    setTimeLeft(exam.duration * 60);
    setIsPaused(false);
    setExamState('quiz');
  };

  const handleResumeExam = (exam: Exam, session: SavedSession) => {
    setCurrentExam(exam);
    setMode(session.mode);
    setCurrentQuestionIndex(session.currentQuestionIndex);
    setSelectedAnswers(session.selectedAnswers);
    setCheckedQuestions(session.checkedQuestions);
    setTimeLeft(session.timeLeft);
    setIsPaused(false);
    setShowInstantExplanation(false);
    setExamState('quiz');
  };

  const handleSaveAndExit = () => {
    if (!currentExam || !sessionKey) return;

    const session: SavedSession = {
      examId: currentExam.id,
      mode,
      currentQuestionIndex,
      selectedAnswers,
      checkedQuestions,
      timeLeft,
      date: new Date().toISOString()
    };

    const newSessions = {
      ...savedSessions,
      [currentExam.id]: session
    };

    setSavedSessions(newSessions);
    localStorage.setItem(sessionKey, JSON.stringify(newSessions));

    setExamState('select');
    setCurrentExam(null);
  };

  const clearSavedSession = (examId: string) => {
    if (!sessionKey) return;
    const newSessions = { ...savedSessions };
    delete newSessions[examId];
    setSavedSessions(newSessions);
    localStorage.setItem(sessionKey, JSON.stringify(newSessions));
  };

  const handleSelectOption = (questionId: number, optionKey: string, multiSelect: boolean) => {
    // If answer is already checked in practice mode, do not allow changes
    if (mode === 'practice' && checkedQuestions[questionId]) return;

    setSelectedAnswers((prev) => {
      const current = prev[questionId] || [];
      if (multiSelect) {
        if (current.includes(optionKey)) {
          return { ...prev, [questionId]: current.filter(k => k !== optionKey) };
        } else {
          return { ...prev, [questionId]: [...current, optionKey] };
        }
      } else {
        return { ...prev, [questionId]: [optionKey] };
      }
    });
  };

  const handleCheckAnswer = (questionId: number) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [questionId]: true
    }));
    setShowInstantExplanation(true);
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = () => {
    if (!currentExam || !currentUser) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    currentExam.questions.forEach((q) => {
      const userAns = selectedAnswers[q.number] || [];
      const correctAns = q.correct || [];

      // Check if user choices exactly match correct choices
      const isCorrect = userAns.length === correctAns.length &&
        userAns.every(val => correctAns.includes(val));

      if (isCorrect) {
        correctCount++;
      }
    });

    // Thang điểm chuẩn hoá 0..1000, đỗ khi đúng >= 80% số câu. Công thức dùng chung
    // với backend (examScaledScore trong services/api.ts) để hai bên không lệch nhau.
    const score = examScaledScore(correctCount, currentExam.questions.length);

    // Only update best score in Exam Mode
    if (mode === 'exam') {
      // Cập nhật lạc quan để màn kết quả hiện ngay điểm vừa thi; con số chính thức
      // đến từ server ở `reloadBestScores()` bên dưới. KHÔNG ghi localStorage:
      // điểm chỉ được sống trong database, không sống trong trình duyệt.
      setBestScores((prev) => ({
        ...prev,
        [currentExam.id]: Math.max(prev[currentExam.id] || 0, score),
      }));

      // Gửi kết quả lên server để Mentor xem được và điểm không mất khi đổi máy.
      // Server tự tính lại điểm từ số câu đúng nên client không "tự cho điểm".
      if (tokenStore.isAuthenticated()) {
        setSubmitError(null);
        examAttemptsApi
          .submit({
            exam_id: currentExam.id,
            exam_title: currentExam.title,
            exam_code: currentExam.code,
            total_questions: currentExam.questions.length,
            correct_count: correctCount,
            duration_seconds: Math.max(0, currentExam.duration * 60 - timeLeft),
          })
          // Lấy lại từ server để bảng điểm khớp đúng dữ liệu đã lưu.
          .then(reloadBestScores)
          .catch(() =>
            // Không chặn màn kết quả: điểm vẫn hiện, chỉ cảnh báo là chưa đồng bộ.
            setSubmitError(
              'Không lưu được kết quả lên hệ thống (lỗi kết nối). Điểm này chỉ hiện tạm trên màn hình — Mentor sẽ không thấy, và tải lại trang là mất. Vui lòng thi lại khi có mạng.'
            )
          );
      }
    }

    // Clear saved session on exam completion
    clearSavedSession(currentExam.id);

    setExamState('result');
  };

  const handleRetakeExam = () => {
    if (currentExam) {
      handleStartExam(currentExam);
    }
  };

  const handleBackToSelect = () => {
    setExamState('select');
    setCurrentExam(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (examState === 'select') {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Banner Title */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/25 border border-blue-400/35 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-blue-300" />
                <span>Anthropic Certification Hub</span>
              </div>
              <button
                type="button"
                onClick={() => setIsScoresOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/25 border border-purple-400/35 text-xs font-bold hover:bg-purple-500/40 transition-colors cursor-pointer text-purple-200"
              >
                <History className="w-3.5 h-3.5 text-purple-300" />
                <span>Xem lịch sử thi thử</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Hệ thống Thi thử & Luyện tập Anthropic</h1>
            <p className="text-blue-100 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
              Kho đề thi thử chính thức gồm 18 đề luyện tập bao quát ba chương trình chứng chỉ Architect – Foundations, Developer – Foundations và Architect – Professional của Anthropic.
            </p>

            {/* Mode selection toggle */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 max-w-md flex flex-col sm:flex-row gap-3 items-center justify-between mt-4">
              <span className="text-xs font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Chế độ kiểm tra:</span>
              </span>
              <div className="bg-slate-900/60 p-1 rounded-xl flex gap-1 border border-white/5 w-full sm:w-auto">
                <button
                  onClick={() => setMode('practice')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'practice' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  Luyện tập (Instant check)
                </button>
                <button
                  onClick={() => setMode('exam')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${mode === 'exam' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                >
                  Thi thật (120p)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="space-y-8">
          {/* Claude Foundation Section */}
          <div className="space-y-3">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-200 border-l-4 border-blue-600 pl-3 uppercase tracking-wider">
              Claude Certified Architect – Foundations (Claude Foundation)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXAMS_DATA.filter(e => e.code === 'Claude Foundation').map((exam) => {
                const bestScore = bestScores[exam.id];
                const isPassed = bestScore >= EXAM_PASSING_SCORE;
                const savedSession = savedSessions[exam.id];

                return (
                  <div 
                    key={exam.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:border-blue-500/30"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-900/30">
                          {exam.code}
                        </span>
                        <BookOpen className="w-4 h-4 text-blue-500" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {exam.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{exam.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{exam.questions.length} câu</span>
                        </div>
                      </div>

                      {/* Saved session tag */}
                      {savedSession && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[10px] px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-center gap-1.5 font-bold">
                          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span className="truncate">
                            Lưu dở: Câu {savedSession.currentQuestionIndex + 1}/{exam.questions.length} ({savedSession.mode === 'exam' ? `còn ${formatTime(savedSession.timeLeft)}` : 'luyện tập'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 mt-4 pt-3.5 flex items-center justify-between gap-4">
                      <div>
                        {bestScore !== undefined ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold">Best Exam Score</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-black text-xs ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>
                                {bestScore}
                              </span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Chưa thi</span>
                        )}
                      </div>

                      {savedSession ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleResumeExam(exam, savedSession)}
                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                            title="Tiếp tục làm bài từ tiến độ cũ"
                          >
                            <span>Làm tiếp</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Tiến độ làm bài cũ của đề này sẽ bị xóa. Bạn có chắc muốn thi lại từ đầu?')) {
                                handleStartExam(exam);
                              }
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Thi lại
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{bestScore !== undefined ? 'Thi lại' : 'Làm đề'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claude Developer Section */}
          <div className="space-y-3 pt-4">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-200 border-l-4 border-emerald-600 pl-3 uppercase tracking-wider">
              Claude Certified Developer – Foundations (Claude Developer)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXAMS_DATA.filter(e => e.code === 'Claude Developer').map((exam) => {
                const bestScore = bestScores[exam.id];
                const isPassed = bestScore >= EXAM_PASSING_SCORE;
                const savedSession = savedSessions[exam.id];

                return (
                  <div 
                    key={exam.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-100 dark:border-emerald-900/30">
                          {exam.code}
                        </span>
                        <BookOpen className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {exam.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{exam.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{exam.questions.length} câu</span>
                        </div>
                      </div>

                      {/* Saved session tag */}
                      {savedSession && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[10px] px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-center gap-1.5 font-bold">
                          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span className="truncate">
                            Lưu dở: Câu {savedSession.currentQuestionIndex + 1}/{exam.questions.length} ({savedSession.mode === 'exam' ? `còn ${formatTime(savedSession.timeLeft)}` : 'luyện tập'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 mt-4 pt-3.5 flex items-center justify-between gap-4">
                      <div>
                        {bestScore !== undefined ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold">Best Exam Score</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-black text-xs ${isPassed ? 'text-emerald-600 dark:text-emerald-450 font-black' : 'text-amber-500'}`}>
                                {bestScore}
                              </span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Chưa thi</span>
                        )}
                      </div>

                      {savedSession ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleResumeExam(exam, savedSession)}
                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                            title="Tiếp tục làm bài từ tiến độ cũ"
                          >
                            <span>Làm tiếp</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Tiến độ làm bài cũ của đề này sẽ bị xóa. Bạn có chắc muốn thi lại từ đầu?')) {
                                handleStartExam(exam);
                              }
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Thi lại
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{bestScore !== undefined ? 'Thi lại' : 'Làm đề'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Claude Certified Architect - Professional Section */}
          <div className="space-y-3 pt-4">
            <h2 className="text-base font-black text-slate-800 dark:text-slate-200 border-l-4 border-indigo-600 pl-3 uppercase tracking-wider">
              Claude Certified Architect – Professional (Claude Professional)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EXAMS_DATA.filter(e => e.code === 'Claude Professional').map((exam) => {
                const bestScore = bestScores[exam.id];
                const isPassed = bestScore >= EXAM_PASSING_SCORE;
                const savedSession = savedSessions[exam.id];

                return (
                  <div 
                    key={exam.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:border-indigo-500/30"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-900/30">
                          {exam.code}
                        </span>
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {exam.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 pt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{exam.duration}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{exam.questions.length} câu</span>
                        </div>
                      </div>

                      {/* Saved session tag */}
                      {savedSession && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 text-[10px] px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-center gap-1.5 font-bold">
                          <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                          <span className="truncate">
                            Lưu dở: Câu {savedSession.currentQuestionIndex + 1}/{exam.questions.length} ({savedSession.mode === 'exam' ? `còn ${formatTime(savedSession.timeLeft)}` : 'luyện tập'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700/60 mt-4 pt-3.5 flex items-center justify-between gap-4">
                      <div>
                        {bestScore !== undefined ? (
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block font-bold">Best Exam Score</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-black text-xs ${isPassed ? 'text-indigo-600 dark:text-indigo-450 font-black' : 'text-amber-500'}`}>
                                {bestScore}
                              </span>
                              <span className={`text-[8px] px-1 py-0.2 rounded font-bold ${isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                                {isPassed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Chưa thi</span>
                        )}
                      </div>

                      {savedSession ? (
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleResumeExam(exam, savedSession)}
                            className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                            title="Tiếp tục làm bài từ tiến độ cũ"
                          >
                            <span>Làm tiếp</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Tiến độ làm bài cũ của đề này sẽ bị xóa. Bạn có chắc muốn thi lại từ đầu?')) {
                                handleStartExam(exam);
                              }
                            }}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Thi lại
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartExam(exam)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{bestScore !== undefined ? 'Thi lại' : 'Làm đề'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {isScoresOpen && (
          <ExamScoresModal
            currentRole={currentUser?.role || 'INTERN'}
            onClose={() => setIsScoresOpen(false)}
          />
        )}
      </div>
    );
  }

  if (examState === 'quiz' && currentExam) {
    const currentQuestion = currentExam.questions[currentQuestionIndex];
    const totalQuestions = currentExam.questions.length;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const currentAnswers = selectedAnswers[currentQuestion.number] || [];
    const isAnswerChecked = mode === 'practice' && checkedQuestions[currentQuestion.number];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12 relative">
        
        {/* Timed test pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 text-center z-50 space-y-4 min-h-[400px]">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/30">
              <Pause className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Bài thi đang tạm dừng</h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-sm">
              Nội dung câu hỏi và thời gian làm bài đã được ẩn đi. Vui lòng bấm tiếp tục để làm bài tiếp.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              <span>Tiếp tục làm bài</span>
            </button>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn thoát? Kết quả thi hiện tại sẽ bị hủy nếu không lưu.')) {
                  handleBackToSelect();
                }
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
              title="Thoát không lưu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Save & Exit Button */}
            <button
              onClick={handleSaveAndExit}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
              title="Lưu tiến độ làm bài để làm lại sau"
            >
              <Save className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Lưu & Thoát</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'exam' ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 animate-pulse' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={() => setIsPaused(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  title="Tạm dừng thời gian thi và ẩn đề bài"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
              </div>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-extrabold border border-blue-100 dark:border-blue-800/40">
                Luyện tập (Không đếm giờ)
              </span>
            )}
          </div>
        </div>

        {/* Quiz Body */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <span>Câu hỏi {currentQuestionIndex + 1} / {totalQuestions}</span>
              <span>{Math.round(progressPercent)}% Hoàn thành</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded font-black bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase border border-slate-200 dark:border-slate-600">
                {currentQuestion.multiSelect ? 'Nhiều lựa chọn (Multiple Response)' : 'Một lựa chọn (Single Choice)'}
              </span>
            </div>
            <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug whitespace-pre-line">
              {currentQuestion.question}
            </h2>

            {/* Answer Options list */}
            <div className="space-y-3 pt-2">
              {currentQuestion.choices.map((choice) => {
                const isSelected = currentAnswers.includes(choice.key);
                const isCorrect = currentQuestion.correct.includes(choice.key);

                // Option styling depending on practice mode checked answers
                let optionStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50';
                if (isSelected) {
                  optionStyle = 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 font-bold';
                }

                if (isAnswerChecked) {
                  if (isCorrect) {
                    optionStyle = 'bg-green-50/50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-300 font-bold';
                  } else if (isSelected) {
                    optionStyle = 'bg-red-50/50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-300 font-bold';
                  } else {
                    optionStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60';
                  }
                }

                return (
                  <button
                    key={choice.key}
                    disabled={isAnswerChecked}
                    onClick={() => handleSelectOption(currentQuestion.number, choice.key, currentQuestion.multiSelect)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border text-xs sm:text-sm transition-all flex items-start justify-between gap-3 cursor-pointer disabled:cursor-not-allowed ${optionStyle}`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 shrink-0">{choice.key}.</span>
                      <span className="leading-relaxed">{choice.text}</span>
                    </div>
                    <div className="pt-0.5">
                      {currentQuestion.multiSelect ? (
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && (
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                          )}
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instant check explanation */}
          {isAnswerChecked && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-5 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Đáp án đúng: {currentQuestion.correct.join(', ')}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line">
                {currentQuestion.questionExplanation}
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-6 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-2">
              {mode === 'practice' && !isAnswerChecked && (
                <button
                  disabled={currentAnswers.length === 0}
                  onClick={() => handleCheckAnswer(currentQuestion.number)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Check đáp án</span>
                </button>
              )}

              {isLastQuestion ? (
                <button
                  onClick={handleSubmitExam}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Nộp bài thi</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                    // Hide explanation for next question if not checked yet
                    setShowInstantExplanation(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'result' && currentExam) {
    let correctCount = 0;
    currentExam.questions.forEach((q) => {
      const userAns = selectedAnswers[q.number] || [];
      const correctAns = q.correct || [];
      const isCorrect = userAns.length === correctAns.length &&
        userAns.every(val => correctAns.includes(val));

      if (isCorrect) {
        correctCount++;
      }
    });

    const score = examScaledScore(correctCount, currentExam.questions.length);
    // Xét đỗ trên SỐ CÂU, không trên điểm đã làm tròn (xem examIsPassing).
    const isPassed = examIsPassing(correctCount, currentExam.questions.length);
    const percent = examPercent(score);

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Result Header Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{currentExam.code} • Kết quả {mode === 'practice' ? 'Luyện tập' : 'Thi thử'}</span>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug">{currentExam.title}</h2>
          </div>

          {/* Score display */}
          <div className="relative inline-flex flex-col items-center justify-center p-8 rounded-full border-4 border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 w-44 h-44 mx-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Kết quả</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white pt-1">{score}</span>
            <span className="text-[10px] font-bold text-slate-400 block border-t border-slate-200 dark:border-slate-700 w-16 mt-1 pt-1">/ 1000</span>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-sm uppercase shadow-3xs ${isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/40' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40'}`}>
              {isPassed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{isPassed ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 font-medium">
              Bạn làm chính xác <strong>{correctCount} / {currentExam.questions.length}</strong> câu hỏi (<strong>{percent.toFixed(1)}%</strong>). Cần đúng từ <strong>{EXAM_PASS_PERCENT}%</strong> trở lên ({EXAM_PASSING_SCORE}/{EXAM_SCORE_MAX} điểm) để đạt.
              {mode === 'practice' && <span className="block mt-1.5 text-blue-500 font-bold">Chế độ Luyện tập không ghi đè Điểm cao nhất trong hồ sơ thi thật.</span>}
            </p>

            {/* Nộp bài xong nhưng chưa đẩy được lên server: phải nói rõ, nếu không
                người dùng tưởng điểm đã được ghi nhận và Mentor sẽ thấy. */}
            {submitError && (
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-xl px-3 py-2.5 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{submitError}</span>
              </p>
            )}
          </div>

          {/* Result Options */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRetakeExam}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại</span>
            </button>
            <button
              onClick={() => setIsScoresOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử & Bảng điểm</span>
            </button>
            <button
              onClick={handleBackToSelect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <ListRestart className="w-4 h-4" />
              <span>Về danh sách</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 px-1 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <span>Xem lại câu hỏi chi tiết</span>
          </h3>

          {currentExam.questions.map((q, idx) => {
            const userAns = selectedAnswers[q.number] || [];
            const correctAns = q.correct || [];
            const isCorrect = userAns.length === correctAns.length &&
              userAns.every(val => correctAns.includes(val));

            return (
              <div 
                key={q.number}
                className={`bg-white dark:bg-slate-800 border rounded-3xl p-5 md:p-6 shadow-2xs space-y-4 ${
                  isCorrect 
                    ? 'border-green-100 dark:border-green-900/30' 
                    : userAns.length === 0 
                      ? 'border-slate-200 dark:border-slate-700' 
                      : 'border-red-100 dark:border-red-900/30'
                }`}
              >
                {/* Question Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Câu hỏi {idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold border border-green-100 dark:border-green-900/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Chính xác</span>
                      </span>
                    ) : userAns.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                        <span>Chưa làm</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/20">
                        <XCircle className="w-3 h-3" />
                        <span>Sai</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug whitespace-pre-line">
                  {q.question}
                </h4>

                {/* Options Review list */}
                <div className="space-y-2 pt-1">
                  {q.choices.map((choice) => {
                    const isOptionCorrect = correctAns.includes(choice.key);
                    const isOptionChosen = userAns.includes(choice.key);
                    
                    let cardClass = 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                    let bulletClass = 'border-slate-300 text-slate-400 dark:text-slate-600';
                    
                    if (isOptionCorrect) {
                      cardClass = 'bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 font-bold';
                      bulletClass = 'border-green-500 bg-green-500 text-white';
                    } else if (isOptionChosen) {
                      cardClass = 'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 font-bold';
                      bulletClass = 'border-red-500 bg-red-500 text-white';
                    }

                    return (
                      <div 
                        key={choice.key} 
                        className={`px-4 py-3.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${cardClass}`}
                      >
                        <div className="flex gap-2.5 items-start">
                          <span className="font-extrabold text-slate-500 shrink-0">{choice.key}.</span>
                          <span className="leading-relaxed">{choice.text}</span>
                        </div>
                        <div className="pt-0.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[8px] font-bold ${bulletClass}`}>
                            {isOptionChosen && !isOptionCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                            {isOptionCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Alert box */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-[11px] sm:text-xs leading-relaxed space-y-2">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Giải thích đáp án:</span>
                  
                  {/* Detailed explanation for choices */}
                  {q.explanations && (
                    <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-700/60">
                      {Object.entries(q.explanations).map(([key, exp]) => (
                        <div key={key} className="flex gap-2 items-start">
                          <span className="font-bold text-slate-800 dark:text-slate-300 shrink-0">{key}:</span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">{exp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-slate-600 dark:text-slate-400 font-semibold leading-relaxed pt-1 whitespace-pre-line">
                    {q.questionExplanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {isScoresOpen && (
          <ExamScoresModal
            currentRole={currentUser?.role || 'INTERN'}
            onClose={() => setIsScoresOpen(false)}
          />
        )}
      </div>
    );
  }

  return null;
};
