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
  ChevronRight
} from 'lucide-react';
import { AuthUser } from '../types';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: number; // minutes
  questions: Question[];
}

interface ExamResult {
  examId: string;
  score: number; // out of 1000
  correctCount: number;
  totalQuestions: number;
  date: string;
  answers: Record<number, number>; // questionId -> selectedIndex
}

const EXAMS_DATA: Exam[] = [
  {
    id: 'ccao-f',
    title: 'Claude Certified Associate – Foundations',
    code: 'CCAO-F',
    description: 'Đánh giá kiến thức nền tảng về hệ sinh thái mô hình Claude, các đặc trưng dòng Claude 3 & 3.5, nguyên lý thiết kế Prompt cơ bản (sử dụng thẻ XML, Few-shot prompting, vị trí tài liệu) và các cam kết bảo mật dữ liệu của Anthropic.',
    duration: 10, // 10 minutes for practice
    questions: [
      {
        id: 1,
        text: 'Đâu là độ dài cửa sổ ngữ cảnh (Context Window) tối đa của mô hình Claude 3.5 Sonnet hiện tại?',
        options: [
          'A. 100,000 tokens',
          'B. 200,000 tokens',
          'C. 500,000 tokens',
          'D. 1,000,000 tokens'
        ],
        correctIndex: 1,
        explanation: 'Claude 3.5 Sonnet hỗ trợ cửa sổ ngữ cảnh chuẩn lên tới 200,000 tokens (tương đương khoảng 150,000 từ), cho phép xử lý một lượng lớn tài liệu trong một lượt truy vấn.'
      },
      {
        id: 2,
        text: 'Trong thiết kế Prompt Engineering cho Claude, các thẻ XML (ví dụ: <context>, </context>) có công dụng chính là gì?',
        options: [
          'A. Dùng để sinh mã nguồn HTML hiển thị giao diện',
          'B. Dùng để in đậm hoặc thay đổi màu sắc văn bản',
          'C. Dùng để phân tách rõ ràng cấu trúc dữ liệu, tài liệu tham khảo và các chỉ dẫn nhiệm vụ',
          'D. Dùng để nén prompt nhằm tiết kiệm chi phí gọi API'
        ],
        correctIndex: 2,
        explanation: 'Anthropic khuyên dùng các thẻ XML để đóng gói tài liệu, dữ liệu và hướng dẫn khác nhau. Điều này giúp Claude xác định rõ biên giới của từng phần thông tin, hạn chế tối đa việc nhầm lẫn chỉ thị.'
      },
      {
        id: 3,
        text: 'Theo tài liệu hướng dẫn của Anthropic, khi cung cấp tài liệu dài (Long Context) kèm theo chỉ thị làm bài cho Claude, bạn nên đặt chỉ thị/câu hỏi ở vị trí nào?',
        options: [
          'A. Đặt ngay ở đầu prompt, trước các tài liệu tham khảo',
          'B. Đặt xen kẽ vào giữa các trang tài liệu tham khảo',
          'C. Đặt ở cuối prompt, sau các tài liệu tham khảo và dữ liệu',
          'D. Đặt ở đâu cũng được vì Claude xử lý toàn diện như nhau'
        ],
        correctIndex: 2,
        explanation: 'Claude chịu ảnh hưởng bởi Recency Bias (thiên vị thông tin cuối cùng). Do đó, đặt hướng dẫn cụ thể ở cuối prompt - sau khi mô hình đã đọc hết tài liệu ngữ cảnh - sẽ mang lại độ chính xác cao nhất.'
      },
      {
        id: 4,
        text: 'Khái niệm "System Prompt" (Chỉ dẫn hệ thống) được sử dụng nhằm mục đích gì?',
        options: [
          'A. Cấu hình phần cứng và CPU hoạt động cho API',
          'B. Đặt vai trò, giọng điệu, quy tắc bảo mật và các chỉ dẫn vận hành lâu dài cho mô hình trước khi bắt đầu hội thoại',
          'C. Tối ưu hóa bộ nhớ đệm (caching) của trình duyệt web',
          'D. Ép buộc mô hình chỉ được trả lời bằng mã Python'
        ],
        correctIndex: 1,
        explanation: 'System prompt giúp thiết lập các quy tắc nền tảng, tính cách nhân vật (persona), giới hạn hành vi và cấu trúc hoạt động xuyên suốt phiên làm việc cho Claude.'
      },
      {
        id: 5,
        text: 'Đâu là mô hình nhỏ nhất, có tốc độ xử lý nhanh nhất và tối ưu hóa chi phí tốt nhất trong gia đình Claude 3 & 3.5?',
        options: [
          'A. Claude 3.5 Sonnet',
          'B. Claude 3 Opus',
          'C. Claude 3.5 Haiku',
          'D. Claude 3.5 Solo'
        ],
        correctIndex: 2,
        explanation: 'Dòng Haiku (như Claude 3.5 Haiku) được Anthropic thiết kế dành riêng cho các tác vụ thời gian thực đòi hỏi độ trễ cực thấp và hiệu quả chi phí tối đa.'
      },
      {
        id: 6,
        text: 'Tham số "Temperature" trong API điều khiển thuộc tính nào của mô hình Claude?',
        options: [
          'A. Số lượng token đầu vào tối đa được gửi lên',
          'B. Thời gian chờ (Timeout) tối đa của một kết nối API',
          'C. Độ ngẫu nhiên, sáng tạo và tính nhất quán của câu trả lời',
          'D. Giới hạn số từ trong câu trả lời'
        ],
        correctIndex: 2,
        explanation: 'Temperature điều khiển phân phối xác suất của token tiếp theo. Giá trị thấp (gần 0) giúp câu trả lời logic, tập trung và lặp lại giống nhau. Giá trị cao (gần 1) tăng sự đa dạng và sáng tạo.'
      },
      {
        id: 7,
        text: 'Khi cần trích xuất dữ liệu có định dạng cấu trúc chuẩn (ví dụ: JSON) từ Claude, phương pháp nào được Anthropic khuyến nghị mạnh mẽ nhất?',
        options: [
          'A. Viết hoa toàn bộ từ khóa JSON trong câu lệnh',
          'B. Sử dụng tính năng Tool Use (Function Calling) hoặc kỹ thuật Prefilling phản hồi (ví dụ điền trước dấu {)',
          'C. Yêu cầu mô hình tự động chuyển sang chế độ HTML',
          'D. Không có cách nào, Claude chỉ trả về văn bản tự do'
        ],
        correctIndex: 1,
        explanation: 'Sử dụng Tool Use bắt buộc mô hình trả về schema JSON mong muốn, hoặc prefill tin nhắn của Assistant bằng dấu `{` để gợi ý Claude tiếp tục viết đúng cú pháp JSON.'
      },
      {
        id: 8,
        text: 'Dòng mô hình Claude 3 và 3.5 có khả năng xử lý hình ảnh (Vision/Multimodal) hay không?',
        options: [
          'A. Không, mô hình chỉ nhận diện và xử lý văn bản thuần túy',
          'B. Có, có thể phân tích, đọc biểu đồ, sơ đồ, bản vẽ kỹ thuật và văn bản quét từ hình ảnh',
          'C. Chỉ hỗ trợ trên ứng dụng web, không hỗ trợ qua API',
          'D. Chỉ xử lý được ảnh động (GIF)'
        ],
        correctIndex: 1,
        explanation: 'Mọi mô hình thuộc dòng Claude 3 và 3.5 đều tích hợp khả năng thị giác máy tính cao cấp (multimodal), giúp xử lý tốt cả văn bản và hình ảnh trong cùng một phiên.'
      },
      {
        id: 9,
        text: 'Khái niệm "Few-shot Prompting" đại diện cho kỹ thuật nào sau đây?',
        options: [
          'A. Gửi tối thiểu số lượng token để tiết kiệm tài nguyên',
          'B. Đưa một hoặc nhiều cặp ví dụ minh họa (đầu vào -> đầu ra) vào trong prompt để định hình câu trả lời',
          'C. Cài đặt mô hình chạy song song nhiều luồng xử lý',
          'D. Thiết kế giao diện chatbot tối giản'
        ],
        correctIndex: 1,
        explanation: 'Few-shot prompting cung cấp các ví dụ cụ thể về cách xử lý nhiệm vụ ngay trong prompt để mô hình học theo và xuất ra định dạng tương tự.'
      },
      {
        id: 10,
        text: 'Chính sách bảo mật dữ liệu của Anthropic quy định thế nào về các dữ liệu gửi qua API thương mại?',
        options: [
          'A. Anthropic tự động công khai toàn bộ dữ liệu này lên các diễn đàn',
          'B. Mặc định, Anthropic không sử dụng dữ liệu khách hàng gửi qua API để huấn luyện các mô hình thế hệ sau',
          'C. Dữ liệu bị xóa ngay lập tức sau 1 giây và không thể xử lý tiếp',
          'D. Chỉ bảo mật nếu khách hàng trả thêm phí đặc biệt'
        ],
        correctIndex: 1,
        explanation: 'Để bảo vệ tính riêng tư và bí mật kinh doanh của doanh nghiệp, Anthropic cam kết không sử dụng bất kỳ dữ liệu prompt hoặc completion nào từ API thương mại để huấn luyện mô hình của họ.'
      }
    ]
  },
  {
    id: 'ccdv-f',
    title: 'Claude Certified Developer – Foundations',
    code: 'CCDV-F',
    description: 'Đánh giá kỹ năng lập trình tích hợp API của Anthropic: cấu trúc Messages API, định nghĩa và sử dụng Tools (Function Calling), kỹ thuật prefill phản hồi, cơ chế kiểm soát rate limit (429), tích hợp luồng hình ảnh (Base64) và giao thức kết nối dữ liệu Model Context Protocol (MCP).',
    duration: 12, // 12 minutes
    questions: [
      {
        id: 1,
        text: 'Trong giao thức Model Context Protocol (MCP) do Anthropic phát triển, vai trò chính của giao thức này là gì?',
        options: [
          'A. Thay thế hoàn toàn giao thức HTTP và HTTPS trên internet',
          'B. Định nghĩa một tiêu chuẩn chung giúp các ứng dụng AI kết nối an toàn với máy chủ lưu trữ dữ liệu và các công cụ bên ngoài',
          'C. Nén mã nguồn Python để tăng hiệu năng xử lý của GPU',
          'D. Mã hóa các token truy cập API'
        ],
        correctIndex: 1,
        explanation: 'MCP là một giao thức mã nguồn mở tiêu chuẩn giúp các ứng dụng AI kết nối an toàn, dễ dàng với các nguồn dữ liệu (như cơ sở dữ liệu, file system) và các dịch vụ API bên ngoài thông qua một API chung.'
      },
      {
        id: 2,
        text: 'Trong API Messages của Anthropic, tham số nào được sử dụng để truyền chỉ thị hệ thống (system instructions)?',
        options: [
          'A. Tạo một tin nhắn với role: "system" đặt vào mảng messages',
          'B. Sử dụng tham số "system" ở cấp cao nhất của đối tượng yêu cầu (request payload)',
          'C. Đưa chỉ thị vào tham số "system_prompt"',
          'D. Gắn chỉ thị hệ thống vào header HTTP'
        ],
        correctIndex: 1,
        explanation: 'Khác với một số API khác, Anthropic Messages API yêu cầu truyền chỉ dẫn hệ thống vào tham số "system" ở cấu hình gốc của request, không được lồng vào mảng tin nhắn "messages".'
      },
      {
        id: 3,
        text: 'Khi cấu hình tính năng Tool Use (Function Calling), mô hình Claude sẽ làm nhiệm vụ gì trong chu trình xử lý?',
        options: [
          'A. Trực tiếp thực thi mã JavaScript/Python trên trình duyệt của người dùng',
          'B. Tự động tìm kiếm và tải mã nguồn từ GitHub về máy chủ',
          'C. Quyết định khi nào cần gọi công cụ và trả về tên công cụ cùng các tham số tương ứng dưới dạng JSON để phía client tự thực thi',
          'D. Gọi trực tiếp vào cơ sở dữ liệu PostgreSQL của khách hàng'
        ],
        correctIndex: 2,
        explanation: 'Claude không tự chạy mã của công cụ. Nhiệm vụ của mô hình là hiểu ý định của người dùng, chọn công cụ phù hợp từ danh sách được cung cấp, trích xuất tham số cần thiết và trả về định dạng JSON cấu trúc để ứng dụng máy khách tự chạy.'
      },
      {
        id: 4,
        text: 'Kỹ thuật "Prefilling Claude\'s Response" (Điền trước câu trả lời của mô hình) được lập trình viên triển khai thế nào qua API?',
        options: [
          'A. Sử dụng thuộc tính "prefill": true trong request body',
          'B. Đưa văn bản bắt đầu mong muốn vào một tin nhắn cuối cùng với role: "assistant" trong mảng messages',
          'C. Sử dụng thẻ XML <prefill> đặt ở cuối user prompt',
          'D. Chỉ cấu hình được trong phần system prompt'
        ],
        correctIndex: 1,
        explanation: 'Để điền trước phản hồi, bạn thêm một phần tử tin nhắn có `role: "assistant"` vào cuối danh sách messages. Claude sẽ nhận thức được phần chữ này là đầu ra đã bắt đầu viết của mình và tiếp tục hoàn thành từ đó.'
      },
      {
        id: 5,
        text: 'Tham số "max_tokens" trong yêu cầu gọi API Messages đại diện cho điều gì?',
        options: [
          'A. Số lượng token tối đa mà prompt đầu vào được phép chứa',
          'B. Tổng lượng token (prompt + completion) tối đa cho phép',
          'C. Giới hạn số token đầu ra (completion) tối đa mà mô hình được phép tạo ra',
          'D. Số lượng token tối đa được lưu trữ trong bộ nhớ đệm cache'
        ],
        correctIndex: 2,
        explanation: '"max_tokens" chỉ định giới hạn cứng cho số lượng token mà mô hình có thể sinh ra trong câu trả lời hiện tại.'
      },
      {
        id: 6,
        text: 'Mã lỗi HTTP 429 trả về từ máy chủ API của Anthropic đại diện cho vấn đề gì?',
        options: [
          'A. Sai thông tin API Key hoặc tài khoản bị khóa',
          'B. Mô hình bạn yêu cầu không tồn tại hoặc đã lỗi thời',
          'C. Bạn đã vượt quá giới hạn tần suất gọi API (Rate Limit - số yêu cầu hoặc số token trên phút)',
          'D. Dữ liệu JSON gửi lên bị sai cấu trúc cú pháp'
        ],
        correctIndex: 2,
        explanation: 'Mã lỗi 429 chỉ ra Rate Limit Exceeded. Người dùng cần giảm tốc độ gửi yêu cầu hoặc yêu cầu tăng hạn mức (quota) từ Anthropic.'
      },
      {
        id: 7,
        text: 'Để xử lý lỗi Rate Limit (429) một cách hiệu quả trong ứng dụng thực tế, cơ chế nào được khuyến nghị áp dụng?',
        options: [
          'A. Ngay lập tức gửi lại liên tục trong một vòng lặp kín',
          'B. Sử dụng cơ chế thử lại trễ tăng dần theo hàm mũ kèm dao động ngẫu nhiên (Exponential Backoff with Jitter)',
          'C. Hủy bỏ phiên làm việc và hiển thị lỗi sập hệ thống cho khách hàng',
          'D. Chuyển đổi ngẫu nhiên API Key giữa các tài khoản khác nhau'
        ],
        correctIndex: 1,
        explanation: 'Exponential backoff giúp tăng thời gian chờ giữa các lần thử lại sau mỗi lần lỗi. Jitter (nhiễu ngẫu nhiên) ngăn chặn việc tất cả các client bị lỗi cùng gửi lại request tại một thời điểm, giảm tải cho server.'
      },
      {
        id: 8,
        text: 'Đâu là cách chính xác để truyền dữ liệu hình ảnh vào nội dung tin nhắn trong Messages API?',
        options: [
          'A. Gửi trực tiếp đường dẫn URL của hình ảnh trên web dưới dạng string',
          'B. Chuyển đổi ảnh sang chuỗi Base64 và truyền cấu trúc đối tượng có type: "image", source: { type: "base64", media_type, data }',
          'C. Đính kèm file ảnh nhị phân trong payload multipart/form-data',
          'D. Không hỗ trợ gửi ảnh qua API, chỉ hỗ trợ file văn bản'
        ],
        correctIndex: 1,
        explanation: 'Anthropic API nhận diện ảnh đầu vào dưới dạng đối tượng có cấu trúc chứa chuỗi mã hóa base64 cùng thuộc tính định dạng ảnh phù hợp (như image/jpeg, image/png, image/webp, image/gif).'
      },
      {
        id: 9,
        text: 'Khi định nghĩa danh sách tools trong API, thuộc tính "input_schema" yêu cầu khai báo cấu trúc theo chuẩn nào?',
        options: [
          'A. Khai báo theo định dạng XML DTD',
          'B. Sử dụng đối tượng mô tả theo chuẩn JSON Schema',
          'C. Viết chuỗi interface của TypeScript',
          'D. Sử dụng cú pháp ProtoBuf'
        ],
        correctIndex: 1,
        explanation: 'Anthropic yêu cầu tham số đầu vào của tools phải được mô tả thông qua định dạng JSON Schema tiêu chuẩn để mô hình nắm được tên trường, kiểu dữ liệu và các thuộc tính bắt buộc.'
      },
      {
        id: 10,
        text: 'Công cụ CLI "Claude Code" do Anthropic cung cấp hoạt động như thế nào?',
        options: [
          'A. Là một trình soạn thảo giao diện đồ họa giống VS Code chạy online',
          'B. Là một công cụ dòng lệnh (CLI) chạy trực tiếp trong terminal, có thể hiểu cấu trúc repo, chỉnh sửa file, chạy lệnh và thực thi kiểm thử',
          'C. Là một plugin dịch chuyển ngôn ngữ từ Python sang Java',
          'D. Là hệ điều hành tùy chỉnh dành cho các máy chủ GPU'
        ],
        correctIndex: 1,
        explanation: 'Claude Code là trợ lý AI dạng agent hoạt động trực tiếp trong terminal của lập trình viên. Nó có thể đọc/viết code, chạy lệnh kiểm thử, sửa lỗi, và tương tác với git một cách tự động.'
      }
    ]
  }
];

interface MockExamViewProps {
  currentUser: AuthUser | null;
}

export const MockExamView: React.FC<MockExamViewProps> = ({ currentUser }) => {
  const [examState, setExamState] = useState<'select' | 'quiz' | 'result'>('select');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load best scores for this user from localStorage on mount/user change
  useEffect(() => {
    if (currentUser) {
      const storageKey = `gimasys_exam_scores_${currentUser.email}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setBestScores(JSON.parse(saved));
        } catch {
          setBestScores({});
        }
      } else {
        setBestScores({});
      }
    }
  }, [currentUser]);

  // Timer countdown hook
  useEffect(() => {
    if (examState === 'quiz' && timeLeft > 0) {
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
  }, [examState, timeLeft]);

  const handleStartExam = (exam: Exam) => {
    setCurrentExam(exam);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(exam.duration * 60);
    setExamState('quiz');
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
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
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / currentExam.questions.length) * 1000);

    // Persist best score in localStorage
    const storageKey = `gimasys_exam_scores_${currentUser.email}`;
    const newBestScores = {
      ...bestScores,
      [currentExam.id]: Math.max(bestScores[currentExam.id] || 0, score)
    };
    
    setBestScores(newBestScores);
    localStorage.setItem(storageKey, JSON.stringify(newBestScores));

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
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/25 border border-blue-400/35 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-blue-300" />
              <span>Anthropic Partner Certification Practice</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Thi thử Chứng chỉ Anthropic</h1>
            <p className="text-blue-100 text-xs md:text-sm leading-relaxed">
              Trải nghiệm các bộ câu hỏi ôn luyện được mô phỏng sát với cấu trúc đề thi chính thức của Anthropic để chuẩn bị cho các kỳ thi cấp chứng chỉ Claude Certified Associate & Developer.
            </p>
          </div>
        </div>

        {/* Exams List Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {EXAMS_DATA.map((exam) => {
            const bestScore = bestScores[exam.id];
            const isPassed = bestScore >= 720;
            return (
              <div 
                key={exam.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:border-blue-500/30"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold border border-blue-100 dark:border-blue-900/30 uppercase">
                        {exam.code}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 pt-1 leading-snug">
                        {exam.title}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-4">
                    {exam.description}
                  </p>

                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.questions.length} câu hỏi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Điểm đạt: 720 / 1000</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700/60 mt-5 pt-4 flex items-center justify-between gap-4">
                  <div>
                    {bestScore !== undefined ? (
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold">Điểm cao nhất</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-extrabold text-sm ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>
                            {bestScore} / 1000
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${isPassed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                            {isPassed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-bold block">Chưa thi</span>
                    )}
                  </div>

                  <button 
                    onClick={() => handleStartExam(exam)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{bestScore !== undefined ? 'Thi lại' : 'Bắt đầu thi'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (examState === 'quiz' && currentExam) {
    const currentQuestion = currentExam.questions[currentQuestionIndex];
    const totalQuestions = currentExam.questions.length;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    
    const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
    const currentAnswer = selectedAnswers[currentQuestion.id];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Status Bar: Time & Progress */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn thoát? Kết quả thi hiện tại sẽ không được lưu.')) {
                  handleBackToSelect();
                }
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase tracking-wider">{currentExam.code} Practice</span>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">{currentExam.title}</h3>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-sm ${timeLeft < 60 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 animate-pulse' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
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
            <h2 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
              {currentQuestion.text}
            </h2>

            {/* Answer Options list */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(currentQuestion.id, idx)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs' 
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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

            {isLastQuestion ? (
              <button
                onClick={handleSubmitExam}
                disabled={Object.keys(selectedAnswers).length < totalQuestions && !window.confirm('Bạn vẫn chưa trả lời hết câu hỏi. Có chắc chắn muốn nộp bài?')}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Nộp bài thi</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'result' && currentExam) {
    let correctCount = 0;
    currentExam.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / currentExam.questions.length) * 1000);
    const isPassed = score >= 720;

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
        {/* Result Header Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{currentExam.code} Results</span>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100">{currentExam.title}</h2>
          </div>

          {/* Radial score card */}
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
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
              Bạn trả lời chính xác <strong>{correctCount} / {currentExam.questions.length}</strong> câu hỏi. Điểm thi yêu cầu để đạt chứng chỉ Anthropic là từ <strong>720 điểm</strong> trở lên.
            </p>
          </div>

          {/* Result Options */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRetakeExam}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi lại</span>
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
            <span>Xem lại kết quả câu hỏi</span>
          </h3>

          {currentExam.questions.map((q, idx) => {
            const chosenAnswer = selectedAnswers[q.id];
            const isCorrect = chosenAnswer === q.correctIndex;

            return (
              <div 
                key={q.id}
                className={`bg-white dark:bg-slate-800 border rounded-3xl p-5 md:p-6 shadow-2xs space-y-4 ${
                  isCorrect 
                    ? 'border-green-100 dark:border-green-900/30' 
                    : chosenAnswer === undefined 
                      ? 'border-slate-200 dark:border-slate-700' 
                      : 'border-red-100 dark:border-red-900/30'
                }`}
              >
                {/* Question Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase">Câu hỏi {idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold border border-green-100 dark:border-green-900/30">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Chính xác</span>
                      </span>
                    ) : chosenAnswer === undefined ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                        <span>Bỏ qua</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/20">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Sai</span>
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                  {q.text}
                </h4>

                {/* Options Review list */}
                <div className="space-y-2 pt-1">
                  {q.options.map((option, oIdx) => {
                    const isOptionCorrect = oIdx === q.correctIndex;
                    const isOptionChosen = chosenAnswer === oIdx;
                    
                    let cardClass = 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                    let bulletClass = 'border-slate-300';
                    
                    if (isOptionCorrect) {
                      cardClass = 'bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 font-bold';
                      bulletClass = 'border-green-500 bg-green-500 text-white';
                    } else if (isOptionChosen) {
                      cardClass = 'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-300 font-bold';
                      bulletClass = 'border-red-500 bg-red-500 text-white';
                    }

                    return (
                      <div 
                        key={oIdx} 
                        className={`px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${cardClass}`}
                      >
                        <span>{option}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 text-[8px] font-bold ${bulletClass}`}>
                          {isOptionChosen && !isOptionCorrect && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          {isOptionCorrect && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Alert box */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 text-[11px] sm:text-xs leading-relaxed space-y-1">
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Giải thích đáp án:</span>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
