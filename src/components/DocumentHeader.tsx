import React, { useRef } from "react";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Bookmark as BookmarkIcon, 
  Moon, 
  Sun, 
  Coffee, 
  BookOpen, 
  ChevronDown,
  Headphones,
  Bell,
  BellRing
} from "lucide-react";
import { PDFDocumentData, ReaderTheme, Bookmark } from "../types";
import { SAMPLE_DOCUMENTS } from "../utils/sampleDocuments";

interface DocumentHeaderProps {
  currentDocument: PDFDocumentData | null;
  onSelectDocument: (doc: PDFDocumentData) => void;
  onUploadPDF: (file: File) => void;
  onOpenAIDrawer: () => void;
  theme: ReaderTheme;
  onChangeTheme: (theme: ReaderTheme) => void;
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onAddBookmark: () => void;
  isBookmarked: boolean;
  notificationPermission?: string;
  onEnableNotifications?: () => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  currentDocument,
  onSelectDocument,
  onUploadPDF,
  onOpenAIDrawer,
  theme,
  onChangeTheme,
  bookmarks,
  onSelectBookmark,
  onAddBookmark,
  isBookmarked,
  notificationPermission,
  onEnableNotifications,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSamplesMenu, setShowSamplesMenu] = React.useState(false);
  const [showBookmarksMenu, setShowBookmarksMenu] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPDF(file);
    }
  };

  const themeColors = {
    dark: "bg-slate-900/95 border-slate-800 text-slate-100",
    oled: "bg-black/95 border-neutral-900 text-neutral-100",
    sepia: "bg-[#2d251e]/95 border-[#43352a] text-[#f4ecd8]",
    light: "bg-white/95 border-slate-200 text-slate-900 shadow-sm",
  };

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${themeColors[theme]}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Document Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[60%] sm:max-w-[65%] md:max-w-[70%]">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight">VozPDF</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  STUDIO
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700/50 mx-1 hidden sm:block shrink-0" />

          {/* Current Document Dropdown - strictly constrained to prevent any overlapping */}
          <div className="relative min-w-0 flex-1 max-w-[140px] xs:max-w-[190px] sm:max-w-[260px] md:max-w-[340px] lg:max-w-[420px]">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="w-full flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-800/60 transition-all border border-slate-700/60 hover:border-slate-600/70 min-w-0 overflow-hidden cursor-pointer"
              title={currentDocument?.title || "Selecionar Documento"}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
              <span className="truncate block flex-1 text-left min-w-0 text-slate-200 font-medium">
                {currentDocument?.title || "Carregar Documento..."}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0 text-slate-400 ml-auto" />
            </button>

            {/* Dropdown Menu */}
            {showSamplesMenu && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                  Biblioteca de Demonstração
                </div>
                {SAMPLE_DOCUMENTS.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectDocument(doc);
                      setShowSamplesMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-start gap-2.5 ${
                      currentDocument?.id === doc.id
                        ? "bg-indigo-600/20 text-indigo-300 font-medium"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <FileText className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{doc.title}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{doc.totalPages} páginas</span>
                        <span>•</span>
                        <span>{doc.author}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls - shrink-0 to guarantee they never get squeezed or overlapped */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Notification Control Button */}
          {onEnableNotifications && (
            <button
              onClick={onEnableNotifications}
              className={`p-2 rounded-lg text-xs transition-all border cursor-pointer ${
                notificationPermission === "granted"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-sm"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
              }`}
              title={
                notificationPermission === "granted"
                  ? "Controle por Notificações Ativo (Lock Screen & Notificações)"
                  : "Ativar controle de leitura através das notificações do sistema"
              }
            >
              {notificationPermission === "granted" ? (
                <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}

          {/* Upload PDF */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.md"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
            title="Importar arquivo PDF ou Texto do seu dispositivo"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden md:inline">Importar PDF</span>
            <span className="md:hidden">PDF</span>
          </button>

          {/* Bookmarks */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowBookmarksMenu(!showBookmarksMenu)}
              className={`p-2 rounded-lg text-xs transition-all border cursor-pointer ${
                isBookmarked 
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300" 
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
              }`}
              title="Marcadores e favoritos"
            >
              <BookmarkIcon className="w-4 h-4" />
            </button>

            {showBookmarksMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200">
                <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Marcadores ({bookmarks.length})
                  </span>
                  <button
                    onClick={() => {
                      onAddBookmark();
                      setShowBookmarksMenu(false);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Adicionar atual
                  </button>
                </div>
                {bookmarks.length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 text-center">
                    Nenhum marcador adicionado nesta leitura.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {bookmarks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onSelectBookmark(b);
                          setShowBookmarksMenu(false);
                        }}
                        className="w-full text-left p-2 rounded-lg text-xs hover:bg-slate-800 transition-colors"
                      >
                        <div className="font-medium text-indigo-300">Página {b.pageNumber}</div>
                        <div className="text-slate-400 line-clamp-2 text-[11px]">{b.snippet}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className="hidden sm:flex items-center bg-slate-800/60 border border-slate-700/60 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => onChangeTheme("dark")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${theme === "dark" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
              title="Tema Escuro (Slate)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme("oled")}
              className={`p-1.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${theme === "oled" ? "bg-neutral-800 text-white" : "text-slate-400 hover:text-slate-200"}`}
              title="Tema OLED Total Black"
            >
              0
            </button>
            <button
              onClick={() => onChangeTheme("sepia")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${theme === "sepia" ? "bg-[#43352a] text-[#f4ecd8]" : "text-slate-400 hover:text-slate-200"}`}
              title="Tema Sépia Conforto Visual"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeTheme("light")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${theme === "light" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-200"}`}
              title="Tema Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* AI Tools Trigger */}
          <button
            onClick={onOpenAIDrawer}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Funções de IA: Resumo, Pergunte ao PDF, Simplificador e Flashcards"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-amber-300 shrink-0" />
            <span className="hidden sm:inline">IA do PDF</span>
            <span className="sm:hidden">IA</span>
          </button>
        </div>
      </div>
    </header>
  );
};
