import { VoiceOption } from "../types";

export const GEMINI_VOICES: VoiceOption[] = [
  {
    id: "Kore",
    name: "Kore (Studio Neural)",
    gender: "female",
    description: "Voz feminina serena, articulada, calorosa e fluida. O padrão ouro para audiobooks e literatura.",
    recommendedStyle: "Narradora clássica, expressiva, calma e com dicção perfeita em português",
    model: "gemini-tts",
  },
  {
    id: "Puck",
    name: "Puck (Vibrante & Dinâmico)",
    gender: "male",
    description: "Voz jovem, ágil e envolvente. Excelente para artigos científicos, produtividade e podcasts.",
    recommendedStyle: "Tom entusiasmado, claro, moderno e conversacional",
    model: "gemini-tts",
  },
  {
    id: "Charon",
    name: "Charon (Grave & Autoritativo)",
    gender: "male",
    description: "Timbre grave, profundo e imponente. Ideal para ensaios filosóficos, história e relatórios executivos.",
    recommendedStyle: "Voz profunda, solene, pausada e reflexiva",
    model: "gemini-tts",
  },
  {
    id: "Fenrir",
    name: "Fenrir (Firme & Confiante)",
    gender: "male",
    description: "Dicção firme, motivacional e segura. Perfeito para desenvolvimento pessoal e manuais estratégicos.",
    recommendedStyle: "Voz firme, confiante, enérgica e assertiva",
    model: "gemini-tts",
  },
  {
    id: "Zephyr",
    name: "Zephyr (Suave & Noturno)",
    gender: "female",
    description: "Voz aveludada, suave e relaxante. Ideal para leitura relaxante antes de dormir ou reflexões.",
    recommendedStyle: "Tom suave, sussurrado e acolhedor",
    model: "gemini-tts",
  },
];

export const VOICE_STYLES = [
  { id: "audiobook", label: "Audiobook Expressivo", style: "Narrador clássico de audiobook, expressivo, pausado e com ótima entonação dramática" },
  { id: "podcast", label: "Podcast Conversacional", style: "Tom de podcast natural, descontraído e próximo ao ouvinte" },
  { id: "didactic", label: "Professor Didático", style: "Didático, calmo, com clareza cristalina para estudo e memorização" },
  { id: "executive", label: "Executivo / Formal", style: "Profissional, direto, seguro e conciso" },
  { id: "calm", label: "Relaxante & Leitura Noturna", style: "Suave, compassado, meditativo e repousante" },
];
