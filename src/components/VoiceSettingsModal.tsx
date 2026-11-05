import React from "react";
import { X, Sparkles, Volume2, Mic, CheckCircle2, Sliders } from "lucide-react";
import { VoiceModelType } from "../types";
import { GEMINI_VOICES, VOICE_STYLES } from "../utils/voiceList";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoice: string;
  onSelectVoice: (voice: string) => void;
  currentStyle: string;
  onSelectStyle: (style: string) => void;
  currentEngine: VoiceModelType;
  onSelectEngine: (engine: VoiceModelType) => void;
  availableBrowserVoices: SpeechSynthesisVoice[];
  selectedBrowserVoiceURI: string;
  onSelectBrowserVoice: (uri: string) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  currentVoice,
  onSelectVoice,
  currentStyle,
  onSelectStyle,
  currentEngine,
  onSelectEngine,
  availableBrowserVoices,
  selectedBrowserVoiceURI,
  onSelectBrowserVoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Configuração de Voz e Entonação
              </h2>
              <p className="text-xs text-slate-400">Personalize o timbre neural e a cadência da leitura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Engine Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
              Motor de Síntese de Voz
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSelectEngine("gemini-tts")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  currentEngine === "gemini-tts"
                    ? "bg-indigo-600/15 border-indigo-500/60 text-white shadow-sm"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Vozes de Estúdio AI</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Altíssima fidelidade neural com respiração natural, entonação humana e expressividade realista.
                </p>
                {currentEngine === "gemini-tts" && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 absolute top-3 right-3" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelectEngine("browser-tts")}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  currentEngine === "browser-tts"
                    ? "bg-indigo-600/15 border-indigo-500/60 text-white shadow-sm"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Sintetizador Local</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vozes instaladas no seu sistema operacional (offline e resposta instantânea).
                </p>
                {currentEngine === "browser-tts" && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 absolute top-3 right-3" />
                )}
              </button>
            </div>
          </div>

          {/* Gemini Voices List */}
          {currentEngine === "gemini-tts" ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Vozes Neurais de Alta Qualidade
                </label>
                <div className="space-y-2.5">
                  {GEMINI_VOICES.map((v) => {
                    const isSelected = currentVoice === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectVoice(v.id)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-500/60 text-white ring-1 ring-indigo-500/40"
                            : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{v.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                              {v.gender === "female" ? "Feminina" : "Masculina"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{v.description}</p>
                        </div>
                        <div className="shrink-0 mt-1">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-600"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Narrator Style */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">
                  Estilo e Entonação da Narrativa
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectStyle(st.style)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        currentStyle === st.style
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium"
                          : "bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-semibold mb-0.5">{st.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{st.style}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Vozes do Sistema Operacional
              </label>
              {availableBrowserVoices.length === 0 ? (
                <div className="p-4 bg-slate-800/40 rounded-xl text-xs text-slate-400">
                  Carregando vozes locais do seu dispositivo...
                </div>
              ) : (
                <select
                  value={selectedBrowserVoiceURI}
                  onChange={(e) => onSelectBrowserVoice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {availableBrowserVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {v.default ? "★ Padrão" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
