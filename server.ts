import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI client according to instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// TTS Endpoint using gemini-3.8-flash-lite-tts
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore", style = "Clear, natural, professional reading", language = "pt-BR" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "O texto para leitura é obrigatório." });
    }

    // Clean text and limit chunk length to prevent timeouts
    const trimmedText = text.trim();
    if (!trimmedText) {
      return res.status(400).json({ error: "Texto vazio fornecido." });
    }

    const styleDescription = style
      ? `${style}, in natural Brazilian Portuguese`
      : "Natural Brazilian Portuguese reader, crystal clear diction, expressive and fluid";

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: styleDescription,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice || "Kore",
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Nenhum áudio foi gerado pelo modelo." });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      voiceUsed: voice,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/tts:", error);
    res.status(500).json({
      error: error.message || "Erro ao gerar áudio com voz neural de alta fidelidade.",
    });
  }
});

// AI Document Summarizer
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { text, type = "overview", title = "Documento" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Texto do documento necessário para resumo." });
    }

    let instruction = "Você é um assistente especialista em síntese e leitura de PDFs. Crie um resumo elegante, claro e bem estruturado em Markdown.";
    let prompt = "";

    if (type === "executive") {
      prompt = `Forneça um Resumo Executivo conciso em tópicos essenciais deste trecho do documento "${title}":\n\n${text.slice(0, 15000)}`;
    } else if (type === "study") {
      prompt = `Gere um Guia de Estudos detalhado com pontos-chave, conceitos centrais e conclusões deste trecho de "${title}":\n\n${text.slice(0, 15000)}`;
    } else {
      prompt = `Resuma os principais pontos e ideias centrais deste texto de "${title}":\n\n${text.slice(0, 15000)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: instruction,
      },
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Erro em /api/ai/summarize:", error);
    res.status(500).json({ error: error.message || "Erro ao processar resumo." });
  }
});

// AI Q&A on PDF
app.post("/api/ai/ask", async (req, res) => {
  try {
    const { question, context, history = [] } = req.body;

    if (!question || !context) {
      return res.status(400).json({ error: "Pergunta e contexto do documento são necessários." });
    }

    const systemInstruction = `Você é o assistente inteligente do leitor VozPDF Studio.
Sua missão é responder à dúvida do usuário com base no conteúdo fornecido do PDF.
Seja direto, didático, cite termos e trechos relevantes do documento quando útil, e use formatação Markdown limpa e amigável.
Se a resposta não estiver no texto, avise com gentileza e complemente com conhecimento geral útil.`;

    const prompt = `Contexto do PDF:\n"""\n${context.slice(0, 18000)}\n"""\n\nPergunta do usuário:\n${question}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ answer: response.text });
  } catch (error: any) {
    console.error("Erro em /api/ai/ask:", error);
    res.status(500).json({ error: error.message || "Erro ao responder pergunta." });
  }
});

// AI Concept Simplifier ("Explique como se eu tivesse 10 anos")
app.post("/api/ai/simplify", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto necessário." });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Explique a essência e os conceitos deste texto de forma extremamente simples, intuitiva e cativante, como se estivesse explicando para alguém iniciante ou curioso de 10 anos (técnica Feynman). Use analogias da vida real:\n\n${text.slice(0, 8000)}`,
      config: {
        systemInstruction: "Você é um mestre da simplificação e didática, especialista em tornar assuntos densos fáceis e memoráveis.",
      },
    });

    res.json({ explanation: response.text });
  } catch (error: any) {
    console.error("Erro em /api/ai/simplify:", error);
    res.status(500).json({ error: error.message || "Erro ao simplificar texto." });
  }
});

// AI Flashcards Generator
app.post("/api/ai/flashcards", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto necessário." });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Crie entre 4 e 6 flashcards de fixação e estudo com base neste texto do documento. Retorne em formato JSON válido:\n[{"question": "...", "answer": "..."}]\n\nTexto:\n${text.slice(0, 10000)}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "[]");
    res.json({ flashcards: parsed });
  } catch (error: any) {
    console.error("Erro em /api/ai/flashcards:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar flashcards." });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 VozPDF Studio rodando em http://localhost:${PORT}`);
  });
}

startServer();
