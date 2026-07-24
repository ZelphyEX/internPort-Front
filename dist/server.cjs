var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = Number(process.env.PORT) || 3e3;
app.use(import_express.default.json({ limit: "10mb" }));
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Gimasys Intern Portal API", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, role, userContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Y\xEAu c\u1EA7u cung c\u1EA5p n\u1ED9i dung c\xE2u h\u1ECFi (message)" });
    }
    const ai = getAIClient();
    const systemInstruction = `B\u1EA1n l\xE0 Tr\u1EE3 l\xFD \u0110\xE0o t\u1EA1o & AI Mentor chuy\xEAn nghi\u1EC7p t\u1EA1i C\xF4ng ty C\xF4ng ngh\u1EC7 Gimasys (Gimasys Intern Portal Assistant).
Vai tr\xF2 hi\u1EC7n t\u1EA1i c\u1EE7a ng\u01B0\u1EDDi d\xF9ng: ${role || "Th\u1EF1c t\u1EADp sinh"}.
B\u1ED1i c\u1EA3nh ng\u01B0\u1EDDi d\xF9ng: ${userContext ? JSON.stringify(userContext) : "Ch\u01B0a c\xF3"}.

Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n:
1. H\u01B0\u1EDBng d\u1EABn quy tr\xECnh th\u1EF1c t\u1EADp, v\u0103n h\xF3a l\xE0m vi\u1EC7c Gimasys, quy \u0111\u1ECBnh b\xE1o c\xE1o h\xE0ng ng\xE0y (Daily Standup), Git Workflow, Coding Convention.
2. Gi\u1EA3i \u0111\xE1p th\u1EAFc m\u1EAFc chuy\xEAn m\xF4n k\u1EF9 thu\u1EADt (Java, Spring Boot, React, TypeScript, Cloud AWS/GCP, Salesforce, DevOps, Docker).
3. \u0110\u01B0a ra l\u1EDDi khuy\xEAn ph\xE1t tri\u1EC3n k\u1EF9 n\u0103ng m\u1EC1m, ph\u01B0\u01A1ng ph\xE1p ho\xE0n th\xE0nh d\u1EF1 \xE1n th\u1EF1c t\u1EADp \u0111\xFAng ti\u1EBFn \u0111\u1ED9.
4. Tr\u1EA3 l\u1EDDi b\u1EB1ng ti\u1EBFng Vi\u1EC7t l\u1ECBch s\u1EF1, truy\u1EC1n c\u1EA3m h\u1EE9ng, ng\u1EAFn g\u1ECDn, c\xF3 c\u1EA5u tr\xFAc r\xF5 r\xE0ng v\u1EDBi Markdown.`;
    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const response = await chat.sendMessage({
      message
    });
    res.json({ reply: response.text });
  } catch (err) {
    console.error("Error in /api/ai/chat:", err);
    res.status(500).json({
      error: "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi AI Assistant. Vui l\xF2ng ki\u1EC3m tra GEMINI_API_KEY ho\u1EB7c th\u1EED l\u1EA1i.",
      details: err.message
    });
  }
});
app.post("/api/ai/evaluate", async (req, res) => {
  try {
    const { internData } = req.body;
    if (!internData) {
      return res.status(400).json({ error: "Thi\u1EBFu th\xF4ng tin th\u1EF1c t\u1EADp sinh" });
    }
    const ai = getAIClient();
    const prompt = `H\xE3y \u0111\xF3ng vai l\xE0 Tr\u01B0\u1EDFng ph\xF2ng \u0110\xE0o t\u1EA1o & Qu\u1EA3n l\xFD Th\u1EF1c t\u1EADp sinh t\u1EA1i Gimasys.
Ph\xE2n t\xEDch h\u1ED3 s\u01A1 v\xE0 qu\xE1 tr\xECnh th\u1EF1c t\u1EADp c\u1EE7a Th\u1EF1c t\u1EADp sinh sau \u0111\xE2y:
Name: ${internData.name}
Role/Specialty: ${internData.department} (${internData.role})
Mentor: ${internData.mentor}
Score / Attendance: ${internData.score}/10 | Chuy\xEAn c\u1EA7n: ${internData.attendanceRate}%
Project: ${internData.project}
Tasks completed: ${internData.completedTasksCount || 0} / ${internData.totalTasksCount || 0}
Skills: ${JSON.stringify(internData.skills)}
Daily Logs Summary: ${JSON.stringify(internData.recentDailyLogs || [])}

H\xE3y xu\u1EA5t ra b\xE1o c\xE1o \u0111\xE1nh gi\xE1 to\xE0n di\u1EC7n d\u01B0\u1EDBi d\u1EA1ng JSON c\xF3 c\u1EA5u tr\xFAc ch\xEDnh x\xE1c nh\u01B0 sau:
{
  "overallScore": number (t\u1EEB 1.0 \u0111\u1EBFn 10.0),
  "strengths": ["\u0111i\u1EC3m m\u1EA1nh 1", "\u0111i\u1EC3m m\u1EA1nh 2", "\u0111i\u1EC3m m\u1EA1nh 3"],
  "areasForImprovement": ["\u0111i\u1EC3m c\u1EA7n c\u1EA3i thi\u1EC7n 1", "\u0111i\u1EC3m c\u1EA7n c\u1EA3i thi\u1EC7n 2"],
  "technicalAssessment": "Nh\u1EADn x\xE9t chi ti\u1EBFt v\u1EC1 k\u1EF9 n\u0103ng k\u1EF9 thu\u1EADt, ch\u1EA5t l\u01B0\u1EE3ng code, kh\u1EA3 n\u0103ng gi\u1EA3i quy\u1EBFt v\u1EA5n \u0111\u1EC1",
  "attitudeAssessment": "Nh\u1EADn x\xE9t v\u1EC1 th\xE1i \u0111\u1ED9 l\xE0m vi\u1EC7c, l\xE0m vi\u1EC7c nh\xF3m, t\xEDnh ch\u1EE7 \u0111\u1ED9ng, b\xE1o c\xE1o h\u1EB1ng ng\xE0y",
  "hiringRecommendation": "R\u1EA5t khuy\u1EBFn ngh\u1ECB nh\u1EADn ch\xEDnh th\u1EE9c" | "Khuy\u1EBFn ngh\u1ECB nh\u1EADn ch\xEDnh th\u1EE9c" | "C\u1EA7n theo d\xF5i th\xEAm 1 th\xE1ng" | "Ch\u01B0a \u0111\u1EA1t y\xEAu c\u1EA7u",
  "actionPlan": ["B\u01B0\u1EDBc 1 trong 2 tu\u1EA7n t\u1EDBi", "B\u01B0\u1EDBc 2 trong 2 tu\u1EA7n t\u1EDBi"]
}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const evalResult = JSON.parse(response.text || "{}");
    res.json(evalResult);
  } catch (err) {
    console.error("Error in /api/ai/evaluate:", err);
    res.status(500).json({
      error: "Kh\xF4ng th\u1EC3 t\u1EA1o \u0111\xE1nh gi\xE1 AI t\u1EF1 \u0111\u1ED9ng.",
      details: err.message
    });
  }
});
app.post("/api/ai/summarize-standup", async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ error: "Danh s\xE1ch b\xE1o c\xE1o kh\xF4ng h\u1EE3p l\u1EC7" });
    }
    const ai = getAIClient();
    const prompt = `D\u01B0\u1EDBi \u0111\xE2y l\xE0 danh s\xE1ch B\xE1o c\xE1o c\xF4ng vi\u1EC7c h\u1EB1ng ng\xE0y (Daily Standup) c\u1EE7a c\xE1c th\u1EF1c t\u1EADp sinh Gimasys h\xF4m nay:
${JSON.stringify(reports)}

H\xE3y \u0111\xF3ng vai Project Lead / Mentor Gimasys v\xE0 t\u1EA1o ra b\u1EA3n T\u1ED5ng h\u1EE3p Nhanh (Standup Executive Summary) ng\u1EAFn g\u1ECDn g\u1ED3m:
1. **T\u1ED5ng quan ti\u1EBFn \u0111\u1ED9 nh\xF3m**: M\u1EE9c \u0111\u1ED9 ho\xE0n th\xE0nh c\xF4ng vi\u1EC7c chung.
2. **C\xE1c kh\xF3 kh\u0103n / Blockers \u0111ang g\u1EB7p ph\u1EA3i**: Ai \u0111ang b\u1ECB t\u1EAFc ngh\u1EBDn v\xE0 c\u1EA7n h\u1ED7 tr\u1EE3 g\u1EA5p.
3. **L\u1EDDi khuy\xEAn / Ch\u1EC9 \u0111\u1EA1o cho ng\xE0y ti\u1EBFp theo**: 2-3 \u0111i\u1EC3m c\u1EA7n l\u01B0u \xFD.
Vi\u1EBFt b\u1EB1ng ti\u1EBFng Vi\u1EC7t chuy\xEAn nghi\u1EC7p, ng\u1EAFn g\u1ECDn d\u1EA1ng danh s\xE1ch g\u1EA1ch \u0111\u1EA7u d\xF2ng Markdown.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });
    res.json({ summary: response.text });
  } catch (err) {
    console.error("Error in /api/ai/summarize-standup:", err);
    res.status(500).json({ error: "Kh\xF4ng th\u1EC3 t\u1EA1o t\u1ED5ng h\u1EE3p b\xE1o c\xE1o b\u1EB1ng AI", details: err.message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Cho phép truy cập qua các host ngoài localhost (vd: link ngrok, domain tạm) khi demo
        allowedHosts: true
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gimasys Intern Portal Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
