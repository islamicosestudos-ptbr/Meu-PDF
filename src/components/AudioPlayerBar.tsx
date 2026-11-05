import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  Sparkles, 
  Moon, 
  CloudRain, 
  Download, 
  Gauge, 
  Loader2,
  Radio,
  SlidersHorizontal,
  ChevronUp
} from "lucide-react";
import { PlayerState, PDFDocumentData } from "../types";

interface AudioPlayerBarProps {
  playerState: PlayerState;
  document: PDFDocumentData | null;
  onTogglePlay: () => void;
  onNextParagraph: () => void;
  onPreviousParagraph: () => void;
  onSpeedChange: (speed: number) => void;
  onOpenVoiceSettings: () => void;
  onOpenAmbientSettings: () => void;
  onOpenSleepTimer: () => void;
  onDownloadPageAudio: () => void;
  notificationPermission?: string;
  onEnableNotifications?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  playerState,
  document,
  onTogglePlay,
  onNextParagraph,
  onPreviousParagraph,
  onSpeedChange,
  onOpenVoiceSettings,
  onOpenAmbientSettings,
  onOpenSleepTimer,
  onDownloadPageAudio,
  notificationPermission,
  onEnableNotifications,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const currentPageData = document?.pages.find(p => p.pageNumber === playerState.currentPage);
  const totalParagraphsOnPage = currentPageData?.paragraphs.length || 1;
  const currentParagraphText = currentPageData?.paragraphs[playerState.currentParagraphIndex] || "";

  const speeds = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Upper mini-strip: Currently reading preview & Background mode status */}
        <div className="flex items-center justify-between gap-4 pb-2 text-xs border-b border-slate-800/60 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {playerState.isPlaying && (
              <div className="flex items-center gap-0.5 h-4 shrink-0 px-1 text-indigo-400">
                <span className="w-1 bg-indigo-500 rounded-full animate-wave-1 inline-block" />
                <span className="w-1 bg-indigo-400 rounded-full animate-wave-2 inline-block" />
                <span className="w-1 bg-indigo-500 rounded-full animate-wave-3 inline-block" />
                <span className="w-1 bg-indigo-400 rounded-full animate-wave-4 inline-block" />
                <span className="w-1 bg-indigo-500 rounded-full animate-wave-5 inline-block" />
              </div>
            )}
            <span className="font-semibold text-slate-300 shrink-0">
              Pág. {playerState.currentPage}/{document?.totalPages || 1} • § {playerState.currentParagraphIndex + 1}/{totalParagraphsOnPage}:
            </span>
            <span className="text-slate-400 truncate italic">
              "{currentParagraphText.slice(0, 90)}..."
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Background Play badge & Notification Status */}
            {onEnableNotifications ? (
              <button
                onClick={onEnableNotifications}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
                title="Segundo plano ativo. Clique para ativar/gerenciar controle por notificações na tela de bloqueio"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">2º Plano & Notificações Ativos</span>
                <span className="sm:hidden">2º Plano Ativo</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Segundo Plano Ativo (MediaSession)
              </span>
            )}
          </div>
        </div>

        {/* Master Controls Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left section: Voice & Engine tag */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenVoiceSettings}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition-all text-xs font-medium cursor-pointer shadow-sm group"
              title="Mudar voz neural ou entonação"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 leading-tight">Voz Atual</div>
                <div className="font-bold text-indigo-300">
                  {playerState.engine === "gemini-tts" ? playerState.voice : "Voz Local"}
                </div>
              </div>
            </button>
          </div>

          {/* Center section: Main transport playback controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Previous paragraph */}
            <button
              onClick={onPreviousParagraph}
              disabled={playerState.currentPage === 1 && playerState.currentParagraphIndex === 0}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Parágrafo anterior"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Master Play / Pause Button */}
            <button
              onClick={onTogglePlay}
              disabled={!document}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 active:scale-95 transition-all cursor-pointer relative"
              title={playerState.isPlaying ? "Pausar leitura" : "Iniciar leitura com voz neural"}
            >
              {playerState.isBuffering ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : playerState.isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            {/* Next paragraph */}
            <button
              onClick={onNextParagraph}
              disabled={
                playerState.currentPage === (document?.totalPages || 1) &&
                playerState.currentParagraphIndex === totalParagraphsOnPage - 1
              }
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-full transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              title="Próximo parágrafo"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Right section: Speed, Ambient, Sleep, Download */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-mono font-bold transition-all"
                title="Velocidade de leitura"
              >
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>{playerState.speed}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-28 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1.5 z-50">
                  <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase">
                    Velocidade
                  </div>
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onSpeedChange(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-mono transition-colors flex items-center justify-between ${
                        playerState.speed === s
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{s}x</span>
                      {playerState.speed === s && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ambient Sound Button */}
            <button
              onClick={onOpenAmbientSettings}
              className={`p-2 rounded-lg text-xs transition-all border ${
                playerState.ambientSound !== "none"
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-sm"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
              }`}
              title={
                playerState.ambientSound !== "none"
                  ? `Som Ambiente Ativo: ${playerState.ambientSound}`
                  : "Adicionar som ambiente de fundo"
              }
            >
              <CloudRain className="w-4 h-4" />
            </button>

            {/* Sleep Timer Button */}
            <button
              onClick={onOpenSleepTimer}
              className={`p-2 rounded-lg text-xs transition-all border ${
                playerState.sleepTimerEnd
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-sm"
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
              }`}
              title={
                playerState.sleepTimerMinutes
                  ? `Timer Ativo (${playerState.sleepTimerMinutes} min)`
                  : "Configurar temporizador de sono"
              }
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* Download Page Audio WAV */}
            <button
              onClick={onDownloadPageAudio}
              className="p-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all"
              title="Baixar áudio da página atual em arquivo .WAV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
