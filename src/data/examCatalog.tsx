import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';

/**
 * Danh mục đề thi thử Anthropic Mock Exam + phần hiển thị một câu hỏi.
 *
 * Tách khỏi `MockExamView.tsx` để CẮT IMPORT VÒNG: `ExamAttemptReviewModal` cần
 * `EXAMS_DATA` và `ScenarioQuestionBlock` để dựng lại đề khi xem lại một lần thi
 * cũ, nhưng `MockExamView` lại cần mở chính modal đó — hai file import lẫn nhau
 * thì có nguy cơ một bên nhận `undefined` lúc module khởi tạo. Dữ liệu đề là
 * hằng số dùng chung, không thuộc riêng màn nào, nên chỗ đúng của nó là ở đây.
 *
 * Đề nằm ở FRONTEND (các file JSON trong `src/data/CF.tests/exams/`), server
 * không có đáp án — xem ghi chú ở `internPortal/app/models/exam_attempt.py`.
 */

// Import Claude Developer (dev)
import dev1 from './CF.tests/exams/exam_dev_1.json';
import dev2 from './CF.tests/exams/exam_dev_2.json';
import dev3 from './CF.tests/exams/exam_dev_3.json';
import dev4 from './CF.tests/exams/exam_dev_4.json';
import dev5 from './CF.tests/exams/exam_dev_5.json';
import dev6 from './CF.tests/exams/exam_dev_6.json';

// Import Claude Foundation (foundation)
import fd1 from './CF.tests/exams/exam_foundation_1.json';
import fd2 from './CF.tests/exams/exam_foundation_2.json';
import fd3 from './CF.tests/exams/exam_foundation_3.json';
import fd4 from './CF.tests/exams/exam_foundation_4.json';
import fd5 from './CF.tests/exams/exam_foundation_5.json';
import fd6 from './CF.tests/exams/exam_foundation_6.json';

// Import Claude Architect Professional (pro)
import pro1 from './CF.tests/exams/exam_pro_1.json';
import pro2 from './CF.tests/exams/exam_pro_2.json';
import pro3 from './CF.tests/exams/exam_pro_3.json';
import pro4 from './CF.tests/exams/exam_pro_4.json';
import pro5 from './CF.tests/exams/exam_pro_5.json';
import pro6 from './CF.tests/exams/exam_pro_6.json';

export interface Choice {
  key: string;
  text: string;
}

export interface Question {
  number: number;
  question: string;
  multiSelect: boolean;
  choices: Choice[];
  correct: string[];
  explanations: Record<string, string>;
  questionExplanation: string;
  /** Chỉ đề Claude Foundation có sẵn: bối cảnh DÙNG CHUNG cho một nhóm câu hỏi
   * (nhiều câu cùng `scenarioId` share đúng một đoạn này). Đề Developer/Professional
   * không có trường này — bối cảnh của chúng nằm lẫn trong `question`, xem
   * `splitScenarioAndQuestion()`. */
  scenario?: string;
  scenarioTitle?: string;
}

/**
 * Tách một câu hỏi thành phần "bối cảnh" (Scenario) và phần "câu hỏi thật" (Question)
 * để hiển thị riêng — gộp chung một đoạn văn dài rất khó theo dõi khi bối cảnh có
 * 3-4 câu mô tả tình huống trước khi mới tới câu hỏi thật.
 *
 * Có 2 nguồn dữ liệu khác nhau tuỳ bộ đề:
 *  - Claude Foundation: có sẵn field `scenario` riêng (bối cảnh CHUNG cho cả nhóm
 *    câu hỏi) — dùng thẳng, không cần đoán.
 *  - Claude Developer / Professional: KHÔNG có field riêng, bối cảnh nằm lẫn ngay
 *    trong `question` dưới dạng vài câu mô tả tình huống rồi mới tới câu hỏi thật
 *    (luôn có dấu "?"). Tách bằng cách tìm CÂU cuối cùng có chứa "?" — mọi câu
 *    trước nó là bối cảnh, từ đó trở đi (kể cả câu phụ "Choose 2." nếu có) là câu
 *    hỏi. Đã kiểm tra trên toàn bộ 1056 câu hỏi trong `src/data/CF.tests/exams/`:
 *    100% có ít nhất một dấu "?". Nếu câu hỏi chỉ có một câu duy nhất (không có
 *    bối cảnh dẫn dắt) thì để `scenario` rỗng — giao diện tự ẩn khối bối cảnh.
 */
export function splitScenarioAndQuestion(
  q: Question
): { scenarioTitle?: string; scenario: string; question: string } {
  if (q.scenario) {
    return { scenarioTitle: q.scenarioTitle, scenario: q.scenario, question: q.question };
  }

  const sentences = q.question
    .trim()
    .split(/(?<=[.?!])\s+/)
    .filter((s) => s.trim());

  const lastQuestionIdx = sentences.reduce(
    (found, s, i) => (s.includes('?') ? i : found),
    -1
  );

  if (lastQuestionIdx <= 0) {
    return { scenario: '', question: q.question };
  }

  return {
    scenario: sentences.slice(0, lastQuestionIdx).join(' '),
    question: sentences.slice(lastQuestionIdx).join(' '),
  };
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: number; // minutes
  questions: Question[];
}

/**
 * Hiển thị một câu hỏi tách thành 2 khối rõ ràng: "Tình huống" (bối cảnh, có thể
 * không có) và "Câu hỏi" (điều thực sự được hỏi) — thay cho một đoạn văn dài gộp
 * cả hai, dễ đọc lướt mà bỏ sót câu hỏi thật nằm ở cuối.
 *
 * `compact`: dùng ở màn xem lại kết quả (nhiều câu liệt kê liên tiếp) — cỡ chữ và
 * khoảng cách nhỏ hơn so với màn làm bài (chỉ hiện 1 câu, cần nổi bật).
 */
export const ScenarioQuestionBlock: React.FC<{ question: Question; compact?: boolean }> = ({
  question,
  compact = false,
}) => {
  const { scenarioTitle, scenario, question: questionText } = splitScenarioAndQuestion(question);

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {scenario && (
        <div
          className={`rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 ${
            compact ? 'p-3' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen className={compact ? 'w-3.5 h-3.5 text-amber-600 dark:text-amber-400' : 'w-4 h-4 text-amber-600 dark:text-amber-400'} />
            <span className={`font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
              Tình huống{scenarioTitle ? ` — ${scenarioTitle}` : ''}
            </span>
          </div>
          <p
            className={`text-amber-900/90 dark:text-amber-100/80 leading-relaxed whitespace-pre-line ${
              compact ? 'text-[11px]' : 'text-sm'
            }`}
          >
            {scenario}
          </p>
        </div>
      )}

      <div className={`rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <HelpCircle className={compact ? 'w-3.5 h-3.5 text-blue-600 dark:text-blue-400' : 'w-4 h-4 text-blue-600 dark:text-blue-400'} />
          <span className={`font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
            Câu hỏi
          </span>
        </div>
        {/* Cùng cỡ chữ/độ đậm/độ giãn dòng với đoạn "Tình huống" ở trên — chỉ khác
            màu chữ (xanh dương thay vì hổ phách) để vẫn phân biệt được hai khối
            mà không lệch kiểu chữ giữa hai phần của cùng một câu hỏi. */}
        <p
          className={`text-blue-900/90 dark:text-blue-100/80 leading-relaxed whitespace-pre-line ${
            compact ? 'text-[11px]' : 'text-sm'
          }`}
        >
          {questionText}
        </p>
      </div>
    </div>
  );
};


export const EXAMS_DATA: Exam[] = [
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
