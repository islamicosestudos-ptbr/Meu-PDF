import React from "react";
import { X, CloudRain, Wind, Coffee, Waves, Volume2, Sparkles, VolumeX } from "lucide-react";
import { AmbientSoundType } from "../types";

interface AmbientSoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSound: AmbientSoundType;
  onSelectSound: (sound: AmbientSoundType) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
}

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({
  isOpen,
  onClose,
  currentSound,
  onSelectSound,
  volume,
  onVolumeChange,
  isPlaying,
}) => {
  if (!isOpen) return null;

  const soundOptions = [
    {
      id: "none" as AmbientSoundType,
      title: "Desativado",
      desc: "Apenas a voz da leitura",
      icon: VolumeX,
    },
    {
      id: "rain" as AmbientSoundType,
      title: "Chuva Suave",
      desc: "Gotas relaxantes de chuva contínua",
      icon: CloudRain,
    },
    {
      id: "binaural432" as AmbientSoundType,
      title: "Frequência 432 Hz",
      desc: "Ondas binaurais de foco e concentração",
      icon: Sparkles,
    },
    {
      id: "cafe" as AmbientSoundType,
      title: "Cafeteria Aconchegante",
      desc: "Ambiente caloroso e imersivo",
      icon: Coffee,
    },
    {
      id: "waves" as AmbientSoundType,
      title: "Ondas do Oceano",
      desc: "Cadência natural das marés",
      icon: Waves,
    },
    {
      id: "whitenoise" as AmbientSoundType,
      title: "Ruído Branco Suave",
      desc: "Isolamento acústico contra distrações",
      icon: Wind,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sons Ambientes de Fundo</h2>
              <p className="text-xs text-slate-400">Toque em segundo plano para máxima imersão na leitura</p>
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
        <div className="p-6 space-y-6">
          {/* Sounds Grid */}
          <div className="grid grid-cols-2 gap-3">
            {soundOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = currentSound === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectSound(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? "bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm ring-1 ring-cyan-500/40"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${isSelected ? "text-cyan-400" : "text-slate-400"}`}
                  />
                  <div className="font-semibold text-sm mb-0.5">{opt.title}</div>
                  <div className="text-[11px] text-slate-400 leading-tight">{opt.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          {currentSound !== "none" && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  Volume do Som Ambiente
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-slate-400">
                O som é sintetizado diretamente no seu navegador e não consome dados de rede.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
};
