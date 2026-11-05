import React, { useState, useRef, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Volume2, 
  Type, 
  Eye, 
  Sliders, 
  FileText,
  Sparkles,
  Maximize2
} from "lucide-react";
import { PDFDocumentData, ReaderTheme, ReaderFont } from "../types";
import { renderPDFPageToCanvas } from "../utils/pdfParser";

interface ReaderViewProps {
  document: PDFDocumentData | null;
  currentPage: number;
  currentParagraphIndex: number;
  isPlaying: boolean;
  theme: ReaderTheme;
  originalFile: File | null;
  onPageChange: (page: number) => void;
  onParagraphClick: (paragraphIndex: number) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  document,
  currentPage,
  currentParagraphIndex,
  isPlaying,
  theme,
  originalFile,
  onPageChange,
  onParagraphClick,
}) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<ReaderFont>("sans");
  const [bionicReading, setBionicReading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"text" | "canvas">("text");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeParagraphRef = useRef<HTMLDivElement | null>(null);

  const pageData = document?.pages.find(p => p.pageNumber === currentPage);

  // Auto-scroll to active paragraph smoothly
  useEffect(() => {
    if (isPlaying && activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentParagraphIndex, isPlaying]);

  // Render canvas when in canvas mode and originalFile exists
  useEffect(() => {
    if (viewMode === "canvas" && originalFile && canvasRef.current) {
      renderPDFPageToCanvas(originalFile, currentPage, canvasRef.current);
    }
  }, [viewMode, originalFile, currentPage]);

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Nenhum documento aberto</h3>
        <p className="text-slate-400 max-w-md text-sm">
          Selecione um dos documentos de demonstração no menu superior ou faça upload de um arquivo PDF próprio.
        </p>
      </div>
    );
  }

  // Bionic reading helper: bold the first 40-50% of each word
  const renderBionicText = (text: string) => {
    const words = text.split(" ");
    return words.map((word, i) => {
      const mid = Math.ceil(word.length * 0.45);
      const boldPart = word.slice(0, mid);
      const rest = word.slice(mid);
      return (
        <span key={i} className="inline-block mr-1.5">
          <strong className="font-extrabold opacity-100">{boldPart}</strong>
          <span className="opacity-90">{rest}</span>
        </span>
      );
    });
  };

  const themeStyles = {
    dark: {
      bg: "bg-slate-950",
      card: "bg-slate-900/60 border-slate-800/80 text-slate-200",
      activePara: "bg-indigo-950/40 border-indigo-500/50 text-indigo-100 ring-1 ring-indigo-500/30",
      meta: "text-slate-400",
      hover: "hover:bg-slate-800/40",
    },
    oled: {
      bg: "bg-black",
      card: "bg-neutral-950 border-neutral-900 text-neutral-200",
      activePara: "bg-indigo-950/50 border-indigo-600/70 text-indigo-100 ring-1 ring-indigo-500/40",
      meta: "text-neutral-500",
      hover: "hover:bg-neutral-900/50",
    },
    sepia: {
      bg: "bg-[#1f1914]",
      card: "bg-[#2d251e] border-[#43352a] text-[#f4ecd8]",
      activePara: "bg-[#3e3227] border-amber-600/60 text-amber-100 ring-1 ring-amber-600/40",
      meta: "text-[#b09e8f]",
      hover: "hover:bg-[#382d23]",
    },
    light: {
      bg: "bg-slate-50",
      card: "bg-white border-slate-200 text-slate-800 shadow-sm",
      activePara: "bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400/40",
      meta: "text-slate-500",
      hover: "hover:bg-slate-100/60",
    },
  };

  const currentTheme = themeStyles[theme];

  const fontClass =
    fontFamily === "serif"
      ? "font-serif-reading"
      : fontFamily === "mono"
      ? "font-mono-code"
      : "font-sans";

  return (
    <main className={`flex-1 transition-colors pb-32 pt-6 px-4 ${currentTheme.bg}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Reader Customization Toolbar */}
        <div className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border ${currentTheme.card}`}>
          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-700/60 hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold px-2">
              Página <span className="text-indigo-400 font-bold">{currentPage}</span> de {document.totalPages}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= document.totalPages}
              className="p-1.5 rounded-lg border border-slate-700/60 hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Reader Preferences (Font, Size, Bionic, View mode) */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {/* Font Family */}
            <div className="flex items-center border border-slate-700/60 rounded-lg p-0.5">
              <button
                onClick={() => setFontFamily("sans")}
                className={`px-2 py-1 rounded text-xs font-sans ${fontFamily === "sans" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                Sans
              </button>
              <button
                onClick={() => setFontFamily("serif")}
                className={`px-2 py-1 rounded text-xs font-serif ${fontFamily === "serif" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                Serif
              </button>
              <button
                onClick={() => setFontFamily("mono")}
                className={`px-2 py-1 rounded text-xs font-mono ${fontFamily === "mono" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
              >
                Mono
              </button>
            </div>

            {/* Font Size A- / A+ */}
            <div className="flex items-center border border-slate-700/60 rounded-lg p-0.5">
              <button
                onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                className="px-2 py-1 text-xs hover:text-white"
                title="Diminuir tamanho da fonte"
              >
                A-
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize(prev => Math.min(28, prev + 2))}
                className="px-2 py-1 text-xs hover:text-white"
                title="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>

            {/* Bionic Reading Toggle */}
            <button
              onClick={() => setBionicReading(!bionicReading)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                bionicReading
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "border-slate-700/60 text-slate-400 hover:text-slate-200"
              }`}
              title="Leitura Biônica (destaca início de palavras para acelerar a leitura)"
            >
              Leitura Biônica
            </button>

            {/* Canvas Preview toggle if original PDF exists */}
            {originalFile && (
              <button
                onClick={() => setViewMode(viewMode === "text" ? "canvas" : "text")}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === "canvas"
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "border-slate-700/60 text-slate-400 hover:text-slate-200"
                }`}
                title="Alternar entre Leitor Formatado e Visualização Original do PDF"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{viewMode === "canvas" ? "Texto" : "PDF Original"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {viewMode === "canvas" && originalFile ? (
          <div className="flex justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-auto">
            <canvas ref={canvasRef} className="max-w-full rounded-lg shadow-2xl" />
          </div>
        ) : (
          <article
            className={`p-6 sm:p-10 rounded-3xl border shadow-xl transition-all space-y-6 ${currentTheme.card} ${fontClass}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {/* Header info inside reader card */}
            <div className="border-b border-slate-700/40 pb-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 break-words line-clamp-2">
                {document.title}
              </h1>
              <div className="flex items-center gap-3 text-xs opacity-75">
                <span>{document.author}</span>
                <span>•</span>
                <span>Página {currentPage} de {document.totalPages}</span>
              </div>
            </div>

            {/* Paragraphs with interactive click-to-speak */}
            {pageData && pageData.paragraphs.length > 0 ? (
              pageData.paragraphs.map((paragraph, index) => {
                const isActive = index === currentParagraphIndex;
                return (
                  <div
                    key={index}
                    ref={isActive ? activeParagraphRef : null}
                    onClick={() => onParagraphClick(index)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? currentTheme.activePara
                        : `${currentTheme.hover} border-transparent`
                    }`}
                  >
                    {/* Active playing indicator badge */}
                    {isActive && isPlaying && (
                      <div className="absolute -left-2 top-4 w-1.5 h-8 bg-indigo-500 rounded-full animate-pulse shadow-md shadow-indigo-500" />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {bionicReading ? renderBionicText(paragraph) : paragraph}
                      </div>

                      {/* Hover play icon */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                        <button
                          className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                          title="Ler a partir deste parágrafo"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm opacity-60">
                Nenhum texto extraído desta página.
              </div>
            )}
          </article>
        )}
      </div>
    </main>
  );
};
