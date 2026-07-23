import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to initialize GoogleGenAI lazily and safely
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
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

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Send the prompt message
    const response = await chat.sendMessage({
      message: message,
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Error in /api/ai/chat:", err);
    res.status(500).json({ 
      error: "Không thể kết nối tới AI Assistant. Vui lòng kiểm tra GEMINI_API_KEY hoặc thử lại.",
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const evalResult = JSON.parse(response.text || "{}");
    res.json(evalResult);
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (err: any) {
    console.error("Error in /api/ai/summarize-standup:", err);
    res.status(500).json({ error: "Không thể tạo tổng hợp báo cáo bằng AI", details: err.message });
  }
});

// Start Express + Vite Dev or Production Mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
