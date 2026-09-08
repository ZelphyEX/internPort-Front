import express from "express";
import path from "path";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

import { createProxyMiddleware } from "http-proxy-middleware";

// dotenv.config() mặc định chỉ đọc ".env" — dự án này dùng ".env.local" (xem README),
// nên phải chỉ định rõ path, không thì ANTHROPIC_API_KEY sẽ luôn "chưa được cấu hình".
dotenv.config({ path: [".env.local", ".env"] });

const app = express();
// Cloud Run tiêm biến môi trường PORT (mặc định 8080). Local dev dùng 3000.
const PORT = Number(process.env.PORT)  || 3000;

/**
 * Gốc API backend mà chatbot dùng để tra cứu dữ liệu portal (xem `PORTAL_ENDPOINTS`).
 *
 * Backend KHÔNG nằm cùng service với server này: bản deploy đặt nó ở host riêng và
 * client gọi thẳng qua `VITE_API_BASE_URL` (xem .github/workflows/deploy.yml), còn
 * `localhost:8000` chỉ đúng khi chạy local. Trước đây hằng số này bị đặt cứng thành
 * localhost nên trên production mọi lượt tra cứu đều chết với "fetch failed".
 *
 * Thứ tự ưu tiên:
 *   1. BACKEND_BASE_URL — biến chuyên dụng, ưu tiên cao nhất.
 *   2. VITE_API_BASE_URL — đúng địa chỉ backend mà client đang gọi, khỏi phải khai
 *      báo thêm biến mới ở nơi đã cấu hình sẵn giá trị này.
 *   3. http://localhost:8000/api/v1 — mặc định cho môi trường dev.
 */
const BACKEND_BASE_URL = (
  process.env.BACKEND_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/$/, "");

// Cảnh báo sớm ngay lúc khởi động, thay vì đợi người dùng đầu tiên hỏi chatbot rồi
// mới thấy lỗi mạng khó hiểu trong log.
if (!process.env.BACKEND_BASE_URL && !process.env.VITE_API_BASE_URL) {
  console.warn(
    `[chatbot] BACKEND_BASE_URL chưa được đặt — đang dùng mặc định ${BACKEND_BASE_URL}. ` +
      "Nếu backend không chạy ở đây, chatbot sẽ không tra cứu được dữ liệu portal."
  );
}

// Proxy API requests to backend. Dùng chung gốc với chatbot để hai đường không lệch
// nhau; bỏ hậu tố /api/v1 vì client đã tự gắn tiền tố đó vào từng đường dẫn.
const BACKEND_PROXY_TARGET = BACKEND_BASE_URL.replace(/\/api\/v1$/, "");
app.use(
  "/api/v1",
  createProxyMiddleware({
    target: BACKEND_PROXY_TARGET,
    changeOrigin: true,
  })
);

app.use(express.json({ limit: "10mb" }));

/**
 * Model dùng cho mọi endpoint AI — đặt một chỗ để đổi model không phải sửa 4 nơi.
 *
 * `AI_MODEL_LABEL` được TRẢ VỀ cho client (xem `/api/ai/summarize-activity`) thay vì
 * để giao diện hard-code tên model: đổi model ở đây là nhãn trên giao diện tự đổi
 * theo, không còn cảnh nhãn ghi một model mà thực tế đang chạy model khác.
 */
const AI_MODEL = "claude-haiku-4-5-20251001";
const AI_MODEL_LABEL = "Claude Haiku 4.5";

// Khởi tạo client Anthropic muộn (lazy) để server vẫn chạy được khi chưa có API key —
// chỉ endpoint AI mới báo lỗi, các route khác (proxy /api/v1, serve dist) không liên quan.
function getAIClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY chưa được cấu hình.");
  }
  return new Anthropic({ apiKey });
}

/**
 * Lấy phần văn bản trong câu trả lời của Claude.
 *
 * `response.content` là MẢNG các block (text / thinking / tool_use...), không phải
 * chuỗi như `response.text` của Gemini — nên phải lọc đúng block `type === "text"`
 * rồi mới nối lại. Đọc thẳng `content[0].text` sẽ vỡ khi block đầu không phải text.
 */
function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Gimasys Intern Portal API", timestamp: new Date().toISOString() });
});

// ============================================================================
// Truy xuất dữ liệu Portal cho chatbot (tool use)
// ============================================================================

interface PortalEndpoint {
  /** Đường dẫn dưới `/api/v1`, có thể chứa placeholder dạng `{user_id}`. */
  path: string;
  desc: string;
  /** Query param được phép — tham số ngoài danh sách này bị bỏ trước khi gọi backend. */
  query?: string[];
}

/** Phân trang dùng chung ở mọi endpoint danh sách. */
const PAGING = ["page", "size"];

/**
 * Danh mục endpoint ĐỌC mà chatbot được phép gọi.
 *
 * Vì sao cần: trước đây `/api/ai/chat` chỉ nhận `message` + `role`, nên trợ lý không
 * nhìn thấy một dòng dữ liệu thật nào của portal — hỏi "em còn task nào chưa xong?"
 * hay "điểm thi của em bao nhiêu?" thì nó chỉ trả lời chung chung hoặc bịa số. Giờ
 * nó tự tra cứu qua ĐÚNG các API mà giao diện đang dùng.
 *
 * Ba lớp an toàn:
 * 1. Chỉ GET — không endpoint nào ghi/sửa/xóa dữ liệu.
 * 2. Allowlist — model chỉ chọn được tên trong bảng này, không tự bịa URL.
 * 3. Gọi kèm ĐÚNG access token của người đang chat, nên backend vẫn chặn theo vai
 *    trò: Intern hỏi dữ liệu người khác vẫn nhận 403/404 y như khi bấm trên giao diện.
 *    Server KHÔNG giữ token đặc quyền nào của riêng nó.
 */
const PORTAL_ENDPOINTS: Record<string, PortalEndpoint> = {
  // --- Người dùng & tổng quan ---
  me: {
    path: "/auth/me",
    desc: "Hồ sơ người đang đăng nhập: id, họ tên, email, vai trò, điểm, tỉ lệ chuyên cần, github",
  },
  dashboard_me: {
    path: "/dashboard/me",
    desc: "Tổng quan của chính người dùng: lộ trình đang học, % tiến độ, số bài đã hoàn thành",
  },
  dashboard_overview: {
    path: "/dashboard/overview",
    desc: "Tổng quan toàn hệ thống: số lượng intern, tiến độ trung bình, thống kê chung (chỉ MENTOR/ADMIN)",
  },
  dashboard_roadmap: {
    path: "/dashboard/roadmaps/{roadmap_id}",
    desc: "Thống kê tiến độ của một lộ trình: ai đang học, ai đã xong (chỉ MENTOR/ADMIN)",
  },
  users: {
    path: "/users",
    desc: "Danh sách người dùng (chỉ MENTOR/ADMIN). Dùng để tìm id theo tên/email trước khi tra cứu chi tiết",
    query: [...PAGING, "search", "role", "status"],
  },
  user: {
    path: "/users/{user_id}",
    desc: "Hồ sơ chi tiết một người dùng (chỉ MENTOR/ADMIN)",
  },
  groups: {
    path: "/groups",
    desc: "Danh sách nhóm/khóa thực tập (chỉ MENTOR/ADMIN)",
    query: [...PAGING, "search", "cohort"],
  },
  group: {
    path: "/groups/{group_id}",
    desc: "Chi tiết một nhóm kèm danh sách thành viên (chỉ MENTOR/ADMIN)",
  },
  role_requests: {
    path: "/role-requests",
    desc: "Hàng đợi yêu cầu đổi vai trò (chỉ ADMIN)",
    query: [...PAGING, "status"],
  },
  my_role_request: {
    path: "/role-requests/me",
    desc: "Yêu cầu đổi vai trò đang chờ duyệt của chính người dùng",
  },

  // --- Lộ trình đào tạo & bài học ---
  roadmaps: {
    path: "/roadmaps",
    desc: "Danh sách lộ trình đào tạo",
    query: [...PAGING, "search"],
  },
  roadmap: {
    path: "/roadmaps/{roadmap_id}",
    desc: "Chi tiết lộ trình: các chặng (module) và bài học trong từng chặng",
  },
  my_roadmaps: {
    path: "/me/roadmaps",
    desc: "Các lộ trình đã gán cho chính người dùng kèm % tiến độ và assignment_id",
  },
  my_roadmap_detail: {
    path: "/me/roadmaps/{assignment_id}",
    desc: "Chi tiết một lộ trình của chính người dùng: từng bài học và bài nào đã hoàn thành",
  },
  user_roadmaps: {
    path: "/users/{user_id}/roadmaps",
    desc: "Các lộ trình của một người khác kèm % tiến độ (chỉ MENTOR/ADMIN)",
  },
  user_roadmap_detail: {
    path: "/users/{user_id}/roadmaps/{assignment_id}",
    desc: "Chi tiết tiến độ từng bài của một người khác (chỉ MENTOR/ADMIN)",
  },
  roadmap_assignments: {
    path: "/roadmap-assignments",
    desc: "Danh sách lượt gán lộ trình (ai được gán lộ trình nào, trạng thái) (chỉ MENTOR/ADMIN)",
    query: [...PAGING, "roadmap_id", "user_id", "group_id", "status"],
  },
  documents: {
    path: "/documents",
    desc: "Thư viện tài liệu học (VIDEO/PDF/LINK/ARTICLE)",
    query: [...PAGING, "search", "tag", "type"],
  },
  document: { path: "/documents/{document_id}", desc: "Chi tiết một tài liệu" },
  tags: { path: "/tags", desc: "Danh sách thẻ (tag) dùng cho tài liệu và dự án" },
  lesson_comments: {
    path: "/lessons/{module_document_id}/comments",
    desc: "Thảo luận/hỏi đáp trong một bài học",
  },

  // --- Dự án & công việc ---
  projects: {
    path: "/projects",
    desc: "Danh sách dự án kèm tiến độ, deadline, khối kỹ thuật",
    query: [...PAGING, "search", "department", "status", "member_user_id"],
  },
  project: {
    path: "/projects/{project_id}",
    desc: "Chi tiết một dự án kèm thành viên và tag",
  },
  tasks: {
    path: "/tasks",
    desc: "Danh sách task Kanban. Intern chỉ thấy task của mình; Mentor lọc được theo assigned_intern_id",
    query: [...PAGING, "project_id", "assigned_intern_id", "status", "priority"],
  },
  task: { path: "/tasks/{task_id}", desc: "Chi tiết một task kèm feedback của mentor" },

  // --- Báo cáo hằng ngày ---
  daily_reports: {
    path: "/daily-reports",
    desc: "Báo cáo công việc hằng ngày. Intern chỉ thấy của mình; Mentor lọc được theo intern_id và khoảng ngày (YYYY-MM-DD)",
    query: [...PAGING, "intern_id", "date_from", "date_to", "status"],
  },
  daily_report: {
    path: "/daily-reports/{report_id}",
    desc: "Chi tiết một báo cáo hằng ngày",
  },

  // --- Điểm thi Anthropic Mock Exam (thang 0–1000, đạt từ 800) ---
  my_exam_summary: {
    path: "/exam-attempts/me/summary",
    desc: "Tổng hợp điểm thi thử của chính người dùng: điểm cao nhất từng đề, số đề đã đạt",
  },
  my_exam_attempts: {
    path: "/exam-attempts/me",
    desc: "Lịch sử từng lượt thi thử của chính người dùng",
    query: [...PAGING],
  },
  exam_overview: {
    path: "/exam-attempts/overview",
    desc: "Bảng điểm thi thử của toàn bộ thành viên (chỉ MENTOR/ADMIN)",
  },
  user_exam_summary: {
    path: "/users/{user_id}/exam-attempts/summary",
    desc: "Tổng hợp điểm thi thử của một người khác (chỉ MENTOR/ADMIN)",
  },
  user_exam_attempts: {
    path: "/users/{user_id}/exam-attempts",
    desc: "Lịch sử thi thử của một người khác (chỉ MENTOR/ADMIN)",
    query: [...PAGING],
  },
};

/** Bảng danh mục dán vào mô tả tool để model biết chọn endpoint và tham số nào. */
const PORTAL_ENDPOINT_CATALOG = Object.entries(PORTAL_ENDPOINTS)
  .map(([name, ep]) => {
    const pathParams = (ep.path.match(/\{(\w+)\}/g) ?? []).map(
      (token) => `${token.slice(1, -1)} (path_params)`
    );
    const params = [...pathParams, ...(ep.query ?? [])];
    return `- ${name}: ${ep.desc}${params.length ? ` — tham số: ${params.join(", ")}` : ""}`;
  })
  .join("\n");

const PORTAL_TOOL: Anthropic.Tool = {
  name: "portal_data",
  description: `Đọc dữ liệu THẬT từ hệ thống Gimasys Intern Portal (chỉ đọc, không ghi).

Gọi tool này mỗi khi câu hỏi liên quan tới dữ liệu cụ thể của portal: người dùng, nhóm,
lộ trình đào tạo, tiến độ học, tài liệu, dự án, task Kanban, báo cáo hằng ngày, điểm thi
thử. TUYỆT ĐỐI không đoán số liệu — chưa tra cứu thì chưa nêu con số nào.

Mọi lời gọi đều chạy dưới quyền của chính người đang chat, nên có thể nhận lỗi 403/404
nếu họ không được xem dữ liệu đó; khi ấy hãy nói rõ là không có quyền, đừng suy đoán.

Mẹo: cần dữ liệu của một người cụ thể thì tra "users" với tham số search để lấy id trước.
Có thể gọi nhiều endpoint trong cùng một lượt.

Các endpoint dùng được:
${PORTAL_ENDPOINT_CATALOG}`,
  input_schema: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        enum: Object.keys(PORTAL_ENDPOINTS),
        description: "Tên endpoint trong danh mục ở trên",
      },
      path_params: {
        type: "object",
        description:
          'Giá trị thay cho placeholder trong đường dẫn, ví dụ {"user_id": 12}. Chỉ dùng chuỗi hoặc số.',
      },
      query: {
        type: "object",
        description:
          'Query param, ví dụ {"status": "Blocked", "size": 100}. Tham số ngoài danh mục sẽ bị bỏ qua.',
      },
    },
    required: ["endpoint"],
  },
};

/**
 * Trần ký tự cho một kết quả tra cứu. Danh sách 100 bản ghi kèm mô tả dài có thể lên
 * tới hàng chục nghìn token; cắt ở đây để một câu hỏi không đốt sạch cửa sổ ngữ cảnh.
 */
const PORTAL_RESULT_MAX_CHARS = 24_000;

/** Số lượt tra cứu tối đa trong một câu hỏi, chặn vòng lặp tool vô hạn. */
const MAX_TOOL_ROUNDS = 6;

/**
 * Gọi một endpoint trong allowlist.
 *
 * `body` luôn là chuỗi để nhét thẳng vào `tool_result`; `ok` cho biết có thật sự đọc
 * được dữ liệu hay không (403/404/tham số sai đều là `false`) — giao diện chỉ khoe
 * "nguồn dữ liệu" cho những lượt tra cứu thành công.
 */
async function callPortalEndpoint(
  input: unknown,
  authorization: string
): Promise<{ ok: boolean; body: string }> {
  const args = (input ?? {}) as {
    endpoint?: string;
    path_params?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };

  const endpoint = PORTAL_ENDPOINTS[args.endpoint ?? ""];
  if (!endpoint) {
    return {
      ok: false,
      body: JSON.stringify({
        error: `Không có endpoint "${args.endpoint}". Chỉ dùng đúng tên trong danh mục.`,
      }),
    };
  }

  // Thay placeholder. Thiếu tham số thì báo lại cho model thay vì gọi backend với
  // URL còn nguyên dấu ngoặc (backend sẽ trả 404 khó hiểu).
  let path = endpoint.path;
  for (const token of endpoint.path.match(/\{(\w+)\}/g) ?? []) {
    const key = token.slice(1, -1);
    const value = args.path_params?.[key];
    if (value === undefined || value === null || value === "") {
      return {
        ok: false,
        body: JSON.stringify({
          error: `Thiếu path_params.${key} cho endpoint "${args.endpoint}".`,
        }),
      };
    }
    path = path.replace(token, encodeURIComponent(String(value)));
  }

  const allowed = endpoint.query ?? [];
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(args.query ?? {})) {
    if (!allowed.includes(key)) continue; // tham số lạ: bỏ, không đẩy sang backend
    if (value === undefined || value === null || value === "") continue;
    qs.append(key, String(value));
  }
  // Mặc định của backend là 20 bản ghi/trang — quá ít để trả lời "cả nhóm còn bao
  // nhiêu task", và model dễ kết luận thiếu. Lấy tối đa (MAX_SIZE = 100) ngay lượt đầu.
  if (allowed.includes("size") && !qs.has("size")) qs.append("size", "100");

  const url = `${BACKEND_BASE_URL}${path}${qs.toString() ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: authorization, Accept: "application/json" },
  });
  const body = await res.text();

  if (!res.ok) {
    return {
      ok: false,
      body: JSON.stringify({
        error: `Intern Portal API trả về ${res.status}`,
        detail: body.slice(0, 500),
        hint:
          res.status === 401 || res.status === 403
            ? "Người dùng hiện tại không có quyền xem dữ liệu này — hãy nói thẳng với họ, không suy đoán thay."
            : undefined,
      }),
    };
  }

  return {
    ok: true,
    body:
      body.length > PORTAL_RESULT_MAX_CHARS
        ? `${body.slice(0, PORTAL_RESULT_MAX_CHARS)}\n…[đã cắt bớt vì quá dài — hãy lọc hẹp lại hoặc phân trang để lấy đúng phần cần]`
        : body,
  };
}

/**
 * Phần system prompt ỔN ĐỊNH (không đổi giữa các lượt chat) — tách riêng và đánh dấu
 * `cache_control` nên nó cùng với `tools` được cache; phần biến thiên theo người dùng
 * nằm ở khối sau, đổi cũng không làm hỏng cache.
 */
const CHAT_SYSTEM_BASE = `Bạn là Trợ lý Đào tạo & AI Mentor chuyên nghiệp tại Công ty Công nghệ Gimasys (Gimasys Intern Portal Assistant).

Nhiệm vụ của bạn:
1. Tra cứu và giải thích dữ liệu thật trên portal: tiến độ học, lộ trình, tài liệu, dự án, task Kanban, báo cáo hằng ngày, điểm thi thử, thành viên và nhóm.
2. Hướng dẫn quy trình thực tập, văn hóa làm việc Gimasys, quy định báo cáo hằng ngày (Daily Standup), Git Workflow, Coding Convention.
3. Giải đáp thắc mắc chuyên môn kỹ thuật (Java, Spring Boot, React, TypeScript, Cloud AWS/GCP, Salesforce, DevOps, Docker).
4. Đưa ra lời khuyên phát triển kỹ năng mềm, phương pháp hoàn thành dự án thực tập đúng tiến độ.

Cách trả lời: tiếng Việt lịch sự, truyền cảm hứng, ngắn gọn, có cấu trúc rõ ràng bằng Markdown.`;

/** Phần thêm vào khi phiên chat có token hợp lệ (tra cứu được dữ liệu thật). */
const CHAT_SYSTEM_WITH_DATA = `

QUY TẮC DỮ LIỆU (bắt buộc):
- Mọi câu hỏi chạm tới dữ liệu portal đều phải gọi tool \`portal_data\` trước khi trả lời. Không có số liệu trong tay thì không được nêu con số, tên người, tên dự án hay ngày tháng nào.
- Cần dữ liệu của một người cụ thể: tra \`users\` với \`search\` để lấy \`id\`, rồi mới gọi endpoint chi tiết.
- Câu hỏi bao quát (ví dụ "em đang thế nào?"): gọi song song nhiều endpoint trong cùng một lượt (\`dashboard_me\`, \`my_roadmaps\`, \`tasks\`, \`my_exam_summary\`, \`daily_reports\`).
- Tool trả về lỗi 403/404: nói rõ người dùng không có quyền xem hoặc dữ liệu không tồn tại. Không bịa để lấp chỗ trống.
- Tra cứu xong mà thật sự không có dữ liệu: ghi rõ "chưa có dữ liệu", đừng suy đoán.
- Luôn ưu tiên con số cụ thể lấy từ tool hơn nhận xét chung chung, và nêu rõ số liệu lấy từ đâu (ví dụ "theo Kanban của dự án X").`;

/** Phần thêm vào khi request không kèm token (chưa đăng nhập / token hết hạn). */
const CHAT_SYSTEM_NO_DATA = `

LƯU Ý: phiên chat này KHÔNG truy cập được dữ liệu portal (thiếu token đăng nhập). Chỉ trả lời kiến thức chung và quy trình; nếu người dùng hỏi số liệu cụ thể của họ, hãy nói rõ rằng cần đăng nhập lại để trợ lý tra cứu được.`;

// API 1: Chatbot Trợ lý AI Đào tạo & Mentor Gimasys
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, role, userContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Yêu cầu cung cấp nội dung câu hỏi (message)" });
    }

    const ai = getAIClient();

    // Token của CHÍNH người đang chat, do client chuyển tiếp lên. Server không giữ
    // token riêng nên không đọc vượt quyền người dùng được — backend vẫn là nơi
    // quyết định ai được xem gì.
    const authorization = req.headers.authorization;
    const canReadPortal =
      typeof authorization === "string" && authorization.startsWith("Bearer ");

    const systemInstruction: Anthropic.TextBlockParam[] = [
      {
        type: "text",
        text: CHAT_SYSTEM_BASE + (canReadPortal ? CHAT_SYSTEM_WITH_DATA : CHAT_SYSTEM_NO_DATA),
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: `Hôm nay là ${new Date().toISOString().slice(0, 10)}.
Vai trò hiện tại của người dùng: ${role || "Thực tập sinh"}.
Bối cảnh người dùng: ${userContext ? JSON.stringify(userContext) : "Chưa có"}.`,
      },
    ];

    // `history` do client gửi lên là các lượt trước của cùng cuộc hội thoại. Bản cũ
    // (Gemini) nhận field này nhưng KHÔNG dùng — mỗi lần đều tạo chat mới nên trợ lý
    // luôn "mất trí nhớ" ngay câu thứ hai. Ở đây nối lại thành messages thật.
    const priorTurns: Anthropic.MessageParam[] = Array.isArray(history)
      ? history
          .filter(
            (h: any) =>
              h && typeof h.content === "string" && h.content.trim() &&
              (h.role === "user" || h.role === "assistant")
          )
          .map((h: any) => ({ role: h.role as "user" | "assistant", content: h.content }))
      : [];

    const messages: Anthropic.MessageParam[] = [
      ...priorTurns,
      { role: "user", content: message },
    ];
    const tools = canReadPortal ? [PORTAL_TOOL] : undefined;

    /** Endpoint đã tra cứu, trả về cho client để hiện "đã đọc dữ liệu gì". */
    const lookups: string[] = [];

    let response = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemInstruction,
      tools,
      messages,
    });

    // Vòng lặp tool: chạy tới khi Claude thôi đòi tra cứu, hoặc hết ngân sách lượt.
    for (let round = 0; response.stop_reason === "tool_use"; round++) {
      const outOfBudget = round >= MAX_TOOL_ROUNDS;
      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      messages.push({
        role: "assistant",
        content: response.content as Anthropic.ContentBlockParam[],
      });

      // Claude có thể gọi nhiều tool trong CÙNG một lượt. Chạy song song rồi trả
      // TẤT CẢ `tool_result` trong MỘT message user — tách ra nhiều message sẽ dạy
      // model thôi gọi song song ở các lượt sau.
      const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (block) => {
          if (outOfBudget) {
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content:
                "Đã đạt giới hạn số lần tra cứu cho một câu hỏi. Hãy trả lời bằng dữ liệu đã có và nói rõ phần nào còn thiếu.",
              is_error: true,
            };
          }
          const endpointName = (block.input as { endpoint?: string })?.endpoint;
          try {
            const result = await callPortalEndpoint(block.input, authorization as string);
            // Chỉ tính là "nguồn dữ liệu" khi backend thật sự trả dữ liệu — lượt bị
            // 403/404 mà vẫn hiện chip nguồn sẽ khiến người dùng tưởng câu trả lời
            // dựa trên dữ liệu họ không hề được xem.
            if (result.ok && endpointName) lookups.push(endpointName);
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: result.body,
              is_error: !result.ok,
            };
          } catch (err: any) {
            // Backend sập / sai BACKEND_BASE_URL: báo lại cho model để nó nói thật
            // với người dùng, thay vì để cả request 500 và mất luôn câu trả lời.
            //
            // `fetch` của Node chỉ ném vỏn vẹn "fetch failed" và giấu nguyên nhân
            // trong `err.cause`, nên phải tự ghép URL + mã lỗi vào — không thì log
            // production chẳng nói được là đang gọi nhầm địa chỉ nào.
            const cause = err?.cause?.code ? ` (${err.cause.code})` : "";
            const detail = `Không gọi được Intern Portal API tại ${BACKEND_BASE_URL}: ${
              err?.message ?? err
            }${cause}`;
            console.error(`[chatbot] ${detail}`);
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: detail,
              is_error: true,
            };
          }
        })
      );

      messages.push({ role: "user", content: results });

      response = await ai.messages.create({
        model: AI_MODEL,
        max_tokens: 4096,
        system: systemInstruction,
        tools,
        // Hết ngân sách: khoá tool lại để lượt này chắc chắn ra câu trả lời bằng chữ.
        tool_choice: outOfBudget ? { type: "none" } : undefined,
        messages,
      });
    }

    res.json({
      reply: textOf(response),
      // Danh sách endpoint đã đọc — giao diện dùng để hiện nguồn dữ liệu.
      lookups: [...new Set(lookups)],
    });
  } catch (err: any) {
    console.error("Error in /api/ai/chat:", err);
    res.status(500).json({
      error: "Không thể kết nối tới AI Assistant. Vui lòng kiểm tra ANTHROPIC_API_KEY hoặc thử lại.",
      details: err.message
    });
  }
});

// API 2: Đánh giá Thực tập sinh bằng AI (AI Intern Performance Evaluator)
app.post("/api/ai/evaluate", async (req, res) => {
  try {
    const { internData } = req.body;
    if (!internData) {
      return res.status(400).json({ error: "Thiếu thông tin thực tập sinh" });
    }

    const ai = getAIClient();
    
    const prompt = `Hãy đóng vai là Trưởng phòng Đào tạo & Quản lý Thực tập sinh tại Gimasys.
Phân tích hồ sơ và quá trình thực tập của Thực tập sinh sau đây:
Name: ${internData.name}
Role/Specialty: ${internData.department} (${internData.role})
Mentor: ${internData.mentor}
Score / Attendance: ${internData.score}/10 | Chuyên cần: ${internData.attendanceRate}%
Project: ${internData.project}
Tasks completed: ${internData.completedTasksCount || 0} / ${internData.totalTasksCount || 0}
Skills: ${JSON.stringify(internData.skills)}
Daily Logs Summary: ${JSON.stringify(internData.recentDailyLogs || [])}

Hãy xuất ra báo cáo đánh giá toàn diện dưới dạng JSON có cấu trúc chính xác như sau:
{
  "overallScore": number (từ 1.0 đến 10.0),
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "areasForImprovement": ["điểm cần cải thiện 1", "điểm cần cải thiện 2"],
  "technicalAssessment": "Nhận xét chi tiết về kỹ năng kỹ thuật, chất lượng code, khả năng giải quyết vấn đề",
  "attitudeAssessment": "Nhận xét về thái độ làm việc, làm việc nhóm, tính chủ động, báo cáo hằng ngày",
  "hiringRecommendation": "Rất khuyến nghị nhận chính thức" | "Khuyến nghị nhận chính thức" | "Cần theo dõi thêm 1 tháng" | "Chưa đạt yêu cầu",
  "actionPlan": ["Bước 1 trong 2 tuần tới", "Bước 2 trong 2 tuần tới"]
}`;

    // Structured outputs: server ràng buộc Claude trả về đúng schema này, thay cho
    // `responseMimeType: "application/json"` của Gemini (chỉ *gợi ý* JSON rồi client
    // tự `JSON.parse` và vỡ khi model kèm thêm chữ ngoài JSON).
    const response = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "number", description: "Điểm tổng từ 1.0 đến 10.0" },
              strengths: { type: "array", items: { type: "string" } },
              areasForImprovement: { type: "array", items: { type: "string" } },
              technicalAssessment: { type: "string" },
              attitudeAssessment: { type: "string" },
              hiringRecommendation: {
                type: "string",
                enum: [
                  "Rất khuyến nghị nhận chính thức",
                  "Khuyến nghị nhận chính thức",
                  "Cần theo dõi thêm 1 tháng",
                  "Chưa đạt yêu cầu",
                ],
              },
              actionPlan: { type: "array", items: { type: "string" } },
            },
            required: [
              "overallScore",
              "strengths",
              "areasForImprovement",
              "technicalAssessment",
              "attitudeAssessment",
              "hiringRecommendation",
              "actionPlan",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    res.json(JSON.parse(textOf(response) || "{}"));
  } catch (err: any) {
    console.error("Error in /api/ai/evaluate:", err);
    res.status(500).json({
      error: "Không thể tạo đánh giá AI tự động.",
      details: err.message
    });
  }
});

// API 3: Tổng hợp Standup Báo cáo hằng ngày bằng AI
app.post("/api/ai/summarize-standup", async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ error: "Danh sách báo cáo không hợp lệ" });
    }

    const ai = getAIClient();

    const prompt = `Dưới đây là danh sách Báo cáo công việc hằng ngày (Daily Standup) của các thực tập sinh Gimasys hôm nay:
${JSON.stringify(reports)}

Hãy đóng vai Project Lead / Mentor Gimasys và tạo ra bản Tổng hợp Nhanh (Standup Executive Summary) ngắn gọn gồm:
1. **Tổng quan tiến độ nhóm**: Mức độ hoàn thành công việc chung.
2. **Các khó khăn / Blockers đang gặp phải**: Ai đang bị tắc nghẽn và cần hỗ trợ gấp.
3. **Lời khuyên / Chỉ đạo cho ngày tiếp theo**: 2-3 điểm cần lưu ý.
Viết bằng tiếng Việt chuyên nghiệp, ngắn gọn dạng danh sách gạch đầu dòng Markdown.`;

    const response = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ summary: textOf(response) });
  } catch (err: any) {
    console.error("Error in /api/ai/summarize-standup:", err);
    res.status(500).json({ error: "Không thể tạo tổng hợp báo cáo bằng AI", details: err.message });
  }
});

// API 4: Tóm tắt Hoạt động (dùng ở trang Tổng quan)
//
// Khác API 3 (`/summarize-standup`, chỉ đọc báo cáo hằng ngày ở tab Báo cáo): endpoint
// này tóm tắt BA mảng dữ liệu thật của portal — điểm thi Mock Exam, tiến độ Lộ trình
// Đào tạo & Skills, và tiến độ Dự án/Kanban. Client gửi lên dữ liệu đã lọc sẵn theo
// quyền: Mentor/Admin gửi của toàn bộ thành viên, Intern chỉ gửi của chính mình —
// server KHÔNG tự truy vấn database nên không có đường lộ dữ liệu người khác.
app.post("/api/ai/summarize-activity", async (req, res) => {
  try {
    const { scope, exams, roadmaps, projects } = req.body ?? {};
    if (!exams && !roadmaps && !projects) {
      return res.status(400).json({ error: "Không có dữ liệu để tóm tắt" });
    }

    const ai = getAIClient();
    const isPersonal = scope === "self";

    const prompt = `Bạn là Trưởng phòng Đào tạo tại Gimasys. Dưới đây là dữ liệu hoạt động thật lấy từ hệ thống Intern Portal${
      isPersonal ? " của MỘT thực tập sinh (người đang đăng nhập)" : " của TOÀN BỘ thành viên"
    }.

## 1. Điểm thi Anthropic Mock Exam (thang 0–1000, đạt từ 800)
${JSON.stringify(exams ?? null)}

## 2. Lộ trình Đào tạo & Skills (tiến độ học theo từng lượt gán lộ trình)
${JSON.stringify(roadmaps ?? null)}

## 3. Dự án & Kanban Worklog (dự án kèm task theo trạng thái)
${JSON.stringify(projects ?? null)}

Hãy viết bản tóm tắt hoạt động bằng tiếng Việt, dùng Markdown, gồm ĐÚNG ba mục theo thứ tự sau:

### 1. Thống kê điểm số
${
  isPersonal
    ? "Điểm trung bình và điểm cao nhất của bạn, số đề đã đạt / đã thi, và đề nào cần thi lại."
    : "Điểm trung bình toàn bộ, có bao nhiêu người đã thi / chưa thi, ai đang dẫn đầu và ai cần hỗ trợ (nêu tên cụ thể)."
}

### 2. Lộ trình Đào tạo & Skills
${
  isPersonal
    ? "Bạn đang học những lộ trình nào, tiến độ bao nhiêu %, lộ trình nào đã xong và lộ trình nào đang chậm."
    : "Tổng quan tiến độ học của các thành viên: ai đã hoàn thành, ai đang chậm tiến độ (nêu tên và % cụ thể), lộ trình nào có tiến độ thấp nhất."
}

### 3. Dự án & Kanban Worklog
${
  isPersonal
    ? "Bạn đang tham gia dự án nào, còn bao nhiêu task chưa xong, task nào đang bị tắc (Blocked) hoặc quá hạn."
    : "Tiến độ hoàn thành các dự án, tỉ lệ task đã xong, task đang bị tắc (Blocked) và ai đang gánh nhiều việc nhất (nêu tên cụ thể)."
}

Quy tắc:
- Chỉ dựa trên số liệu ở trên, KHÔNG bịa thêm tên người, tên dự án hay con số nào không có trong dữ liệu.
- Mục nào không có dữ liệu thì ghi rõ "Chưa có dữ liệu" thay vì suy đoán.
- Ngắn gọn: mỗi mục 2–4 gạch đầu dòng, ưu tiên con số cụ thể hơn nhận xét chung.`;

    const response = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ summary: textOf(response), model: AI_MODEL_LABEL });
  } catch (err: any) {
    console.error("Error in /api/ai/summarize-activity:", err);
    res.status(500).json({
      error: "Không thể tạo tóm tắt hoạt động bằng AI. Vui lòng kiểm tra ANTHROPIC_API_KEY hoặc thử lại.",
      details: err.message,
    });
  }
});

// Start Express + Vite Dev or Production Mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Chỉ import vite ở chế độ dev. Bản production (Docker) không cài devDependencies
    // nên tránh require("vite") ở top-level để server không crash khi khởi động.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Cho phép truy cập qua các host ngoài localhost (vd: link ngrok, domain tạm) khi demo
        allowedHosts: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gimasys Intern Portal Server running on http://localhost:${PORT}`);
  });
}

startServer();
