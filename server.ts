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
const PORT = Number(process.env.PORT) || 3000;

// Proxy API requests to backend
app.use(
  "/api/v1",
  createProxyMiddleware({
    target: "http://localhost:8000",
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

// API 1: Chatbot Trợ lý AI Đào tạo & Mentor Gimasys
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, role, userContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Yêu cầu cung cấp nội dung câu hỏi (message)" });
    }

    const ai = getAIClient();
    
    const systemInstruction = `Bạn là Trợ lý Đào tạo & AI Mentor chuyên nghiệp tại Công ty Công nghệ Gimasys (Gimasys Intern Portal Assistant).
Vai trò hiện tại của người dùng: ${role || "Thực tập sinh"}.
Bối cảnh người dùng: ${userContext ? JSON.stringify(userContext) : "Chưa có"}.

Nhiệm vụ của bạn:
1. Hướng dẫn quy trình thực tập, văn hóa làm việc Gimasys, quy định báo cáo hàng ngày (Daily Standup), Git Workflow, Coding Convention.
2. Giải đáp thắc mắc chuyên môn kỹ thuật (Java, Spring Boot, React, TypeScript, Cloud AWS/GCP, Salesforce, DevOps, Docker).
3. Đưa ra lời khuyên phát triển kỹ năng mềm, phương pháp hoàn thành dự án thực tập đúng tiến độ.
4. Trả lời bằng tiếng Việt lịch sự, truyền cảm hứng, ngắn gọn, có cấu trúc rõ ràng với Markdown.`;

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

    const response = await ai.messages.create({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemInstruction,
      messages: [...priorTurns, { role: "user", content: message }],
    });

    res.json({ reply: textOf(response) });
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
