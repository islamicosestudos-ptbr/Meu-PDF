export interface PDFPageData {
  pageNumber: number;
  text: string;
  paragraphs: string[];
}

export interface PDFDocumentData {
  id: string;
  title: string;
  author?: string;
  totalPages: number;
  pages: PDFPageData[];
  fileSize?: string;
  uploadedAt: string;
}

export type VoiceModelType = "gemini-tts" | "browser-tts";

export interface VoiceOption {
  id: string;
  name: string;
  gender: "female" | "male" | "neutral";
  description: string;
  recommendedStyle: string;
  model: VoiceModelType;
}

export type AmbientSoundType = "none" | "rain" | "whitenoise" | "cafe" | "binaural432" | "waves";

export interface PlayerState {
  isPlaying: boolean;
  currentPage: number;
  currentParagraphIndex: number;
  speed: number;
  voice: string;
  voiceStyle: string;
  engine: VoiceModelType;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isBuffering: boolean;
  sleepTimerMinutes: number | null;
  sleepTimerEnd: number | null;
  continuousBackgroundMode: boolean;
}

export interface Bookmark {
  id: string;
  documentId: string;
  pageNumber: number;
  paragraphIndex: number;
  snippet: string;
  note?: string;
  createdAt: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export type ReaderTheme = "dark" | "oled" | "sepia" | "light";
export type ReaderFont = "sans" | "serif" | "mono";
