import React, { useState, useEffect } from "react";
import { X, Moon, Clock, Check } from "lucide-react";

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMinutes: number | null;
  endTime: number | null;
  onSetTimer: (minutes: number | null) => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  activeMinutes,
  endTime,
  onSetTimer,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endTime) {
      setSecondsRemaining(null);
      return;
    }

    const update = () => {
      const left = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSecondsRemaining(left);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!isOpen) return null;

  const presets = [
    { label: "5 minutos", value: 5 },
    { label: "15 minutos", value: 15 },
    { label: "30 minutos", value: 30 },
    { label: "45 minutos", value: 45 },
    { label: "60 minutos (1 hora)", value: 60 },
  ];

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Temporizador de Sono</h2>
              <p className="text-xs text-slate-400">Pausa a leitura automaticamente ao adormecer</p>
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
        <div className="p-6 space-y-4">
          {secondsRemaining !== null && secondsRemaining > 0 && (
            <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl text-center space-y-1">
              <div className="text-xs text-violet-300 font-medium">Temporizador ativo pausando em:</div>
              <div className="text-3xl font-mono font-bold text-white tracking-wider">
                {formatCountdown(secondsRemaining)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {presets.map((preset) => {
              const isSelected = activeMinutes === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    onSetTimer(preset.value);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-violet-600/20 border-violet-500/60 text-white"
                      : "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-violet-400" />
                    <span>{preset.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-violet-400" />}
                </button>
              );
            })}

            {activeMinutes !== null && (
              <button
                onClick={() => {
                  onSetTimer(null);
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm font-medium transition-all text-center mt-2"
              >
                Desativar temporizador
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
