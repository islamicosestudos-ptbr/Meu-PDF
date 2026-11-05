import React, { useState } from "react";
import { 
  X, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  BrainCircuit, 
  Layers, 
  Send, 
  Loader2, 
  Copy, 
  Check, 
  Volume2,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { PDFDocumentData, Flashcard } from "../types";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: PDFDocumentData | null;
  currentPage: number;
  onSpeakText: (text: string) => void;
}

type TabType = "summary" | "ask" | "simplify" | "flashcards";

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  document,
  currentPage,
  onSpeakText,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  // Summarizer states
  const [summaryScope, setSummaryScope] = useState<"page" | "doc">("page");
  const [summaryType, setSummaryType] = useState<"overview" | "executive" | "study">("overview");
  const [summaryResult, setSummaryResult] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Q&A states
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: "Olá! Posso responder qualquer dúvida ou analisar trechos deste PDF para você. O que gostaria de saber?",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Simplify states
  const [simplifiedResult, setSimplifiedResult] = useState<string>("");
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);

  // Flashcards states
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);

  if (!isOpen) return null;

  const currentPageData = document?.pages.find(p => p.pageNumber === currentPage);
  const targetText =
    summaryScope === "page"
      ? currentPageData?.text || ""
      : document?.pages.map(p => p.text).join("\n\n") || "";

  // Handle Generate Summary
  const handleGenerateSummary = async () => {
    if (!targetText) return;
    setIsSummarizing(true);
    setSummaryResult("");

    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: targetText,
          type: summaryType,
          title: document?.title || "Documento",
        }),
      });

      const data = await res.json();
      if (data.summary) {
        setSummaryResult(data.summary);
      } else {
        setSummaryResult("Não foi possível gerar o resumo. Tente novamente.");
      }
    } catch (e: any) {
      setSummaryResult("Erro ao conectar com o serviço de IA: " + e.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle Q&A
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAsking) return;

    const query = inputQuery.trim();
    setInputQuery("");
    setMessages(prev => [...prev, { role: "user", text: query }]);
    setIsAsking(true);

    try {
      const allText = document?.pages.map(p => `[Página ${p.pageNumber}]: ${p.text}`).join("\n\n") || "";
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          context: allText,
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.answer || "Desculpe, não consegui analisar este trecho." }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "ai", text: "Erro ao consultar IA: " + err.message }]);
    } finally {
      setIsAsking(false);
    }
  };

  // Handle Simplify (Feynman)
  const handleSimplifyConcept = async () => {
    if (!targetText) return;
    setIsSimplifying(true);
    setSimplifiedResult("");

    try {
      const res = await fetch("/api/ai/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetText }),
      });
      const data = await res.json();
      setSimplifiedResult(data.explanation || "Não foi possível simplificar.");
    } catch (err: any) {
      setSimplifiedResult("Erro: " + err.message);
    } finally {
      setIsSimplifying(false);
    }
  };

  // Handle Flashcards
  const handleGenerateFlashcards = async () => {
    if (!targetText) return;
    setIsGeneratingCards(true);
    setFlashcards([]);
    setFlippedCards({});

    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: targetText }),
      });
      const data = await res.json();
      setFlashcards(data.flashcards || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Assistente de IA do PDF
              </h2>
              <p className="text-xs text-slate-400">Síntese, diálogo e memorização em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "summary"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab("ask")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "ask"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pergunte</span>
          </button>

          <button
            onClick={() => setActiveTab("simplify")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "simplify"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Simplificar</span>
          </button>

          <button
            onClick={() => setActiveTab("flashcards")}
            className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "flashcards"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RESUMO */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Escopo da Análise:</span>
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700/60">
                  <button
                    onClick={() => setSummaryScope("page")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      summaryScope === "page" ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Página Atual ({currentPage})
                  </button>
                  <button
                    onClick={() => setSummaryScope("doc")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      summaryScope === "doc" ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Documento Completo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSummaryType("overview")}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    summaryType === "overview"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-slate-800/40 border-slate-700 text-slate-400"
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setSummaryType("executive")}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    summaryType === "executive"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-slate-800/40 border-slate-700 text-slate-400"
                  }`}
                >
                  Executivo (Tópicos)
                </button>
                <button
                  onClick={() => setSummaryType("study")}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    summaryType === "study"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                      : "bg-slate-800/40 border-slate-700 text-slate-400"
                  }`}
                >
                  Guia de Estudo
                </button>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sintetizando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Gerar Resumo Inteligente</span>
                  </>
                )}
              </button>

              {summaryResult && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                      Resumo Gerado
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSpeakText(summaryResult)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Ouvir este resumo com voz neural"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(summaryResult)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Copiar texto"
                      >
                        {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {summaryResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERGUNTE AO PDF */}
          {activeTab === "ask" && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 space-y-3 min-h-[300px] max-h-[460px] overflow-y-auto pr-1">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 border border-slate-700/60 text-slate-200"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                      {m.role === "ai" && (
                        <div className="flex justify-end mt-1 pt-1 border-t border-slate-700/40">
                          <button
                            onClick={() => onSpeakText(m.text)}
                            className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Ouvir resposta</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Consultando conteúdo do PDF...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Pergunte sobre qualquer tópico deste PDF..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isAsking}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: SIMPLIFICADOR FEYNMAN */}
          {activeTab === "simplify" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 leading-relaxed">
                Transforme passagens complexas ou acadêmicas em explicações simples, intuitivas e fáceis de memorizar usando analogias da vida real.
              </div>

              <button
                onClick={handleSimplifyConcept}
                disabled={isSimplifying}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSimplifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Simplificando com analogias...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Explicar de Forma Simples (Página Atual)</span>
                  </>
                )}
              </button>

              {simplifiedResult && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Explicação Descomplicada
                    </span>
                    <button
                      onClick={() => onSpeakText(simplifiedResult)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Ouvir explicação com voz neural"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {simplifiedResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === "flashcards" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Gere cartões de perguntas e respostas para testar sua retenção da leitura. Clique no cartão para revelar a resposta!
              </div>

              <button
                onClick={handleGenerateFlashcards}
                disabled={isGeneratingCards}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isGeneratingCards ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando flashcards...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Gerar Flashcards de Estudo</span>
                  </>
                )}
              </button>

              {flashcards.length > 0 && (
                <div className="space-y-3">
                  {flashcards.map((card, idx) => {
                    const isFlipped = !!flippedCards[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isFlipped
                            ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10"
                            : "bg-slate-800/50 border-slate-700/60 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                          <span>CARTÃO {idx + 1} DE {flashcards.length}</span>
                          <span className="text-indigo-400">{isFlipped ? "Resposta" : "Clique para virar"}</span>
                        </div>
                        <div className="text-sm text-slate-100 font-medium">
                          {isFlipped ? card.answer : card.question}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
