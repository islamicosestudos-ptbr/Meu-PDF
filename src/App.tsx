import React, { useState, useEffect } from "react";
import { PDFDocumentData, ReaderTheme, Bookmark } from "./types";
import { SAMPLE_DOCUMENTS } from "./utils/sampleDocuments";
import { parsePDFFile } from "./utils/pdfParser";
import { usePDFPlayer } from "./hooks/usePDFPlayer";
import { DocumentHeader } from "./components/DocumentHeader";
import { ReaderView } from "./components/ReaderView";
import { AudioPlayerBar } from "./components/AudioPlayerBar";
import { VoiceSettingsModal } from "./components/VoiceSettingsModal";
import { AmbientSoundModal } from "./components/AmbientSoundModal";
import { SleepTimerModal } from "./components/SleepTimerModal";
import { AIAssistantDrawer } from "./components/AIAssistantDrawer";
import { AlertCircle, X, Sparkles, Headphones } from "lucide-react";

export default function App() {
  const [currentDocument, setCurrentDocument] = useState<PDFDocumentData | null>(
    SAMPLE_DOCUMENTS[0]
  );
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [theme, setTheme] = useState<ReaderTheme>("dark");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAmbientModalOpen, setIsAmbientModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // PDF Player Engine
  const {
    playerState,
    availableBrowserVoices,
    selectedBrowserVoiceURI,
    setSelectedBrowserVoiceURI,
    notificationPermission,
    enableNotifications,
    togglePlay,
    nextParagraph,
    previousParagraph,
    jumpToPage,
    setSpeed,
    setVoice,
    setVoiceStyle,
    setEngine,
    setAmbientSound,
    setAmbientVolume,
    setSleepTimer,
    playParagraph,
    downloadCurrentPageAudio,
  } = usePDFPlayer(currentDocument);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("vozpdf_bookmarks");
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem("vozpdf_bookmarks", JSON.stringify(newBookmarks));
    } catch (e) {
      // ignore
    }
  };

  const handleAddBookmark = () => {
    if (!currentDocument) return;
    const page = currentDocument.pages.find(p => p.pageNumber === playerState.currentPage);
    const snippet = page?.paragraphs[playerState.currentParagraphIndex] || "Marcador de página";

    const newBookmark: Bookmark = {
      id: "bm_" + Date.now(),
      documentId: currentDocument.id,
      pageNumber: playerState.currentPage,
      paragraphIndex: playerState.currentParagraphIndex,
      snippet: snippet.slice(0, 100) + "...",
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };

    saveBookmarks([newBookmark, ...bookmarks]);
  };

  const handleSelectBookmark = (b: Bookmark) => {
    jumpToPage(b.pageNumber);
    setTimeout(() => {
      playParagraph(b.paragraphIndex);
    }, 150);
  };

  const isCurrentBookmarked = bookmarks.some(
    b =>
      b.documentId === currentDocument?.id &&
      b.pageNumber === playerState.currentPage &&
      b.paragraphIndex === playerState.currentParagraphIndex
  );

  // Handle uploaded PDF file
  const handleUploadPDF = async (file: File) => {
    try {
      const parsed = await parsePDFFile(file);
      setCurrentDocument(parsed);
      setOriginalFile(file);
      jumpToPage(1);
    } catch (err: any) {
      alert("Erro ao ler o arquivo PDF: " + err.message);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes("pdf") || file.name.endsWith(".pdf"))) {
      await handleUploadPDF(file);
    }
  };

  // Speak arbitrary text (e.g. from AI drawer)
  const handleSpeakArbitraryText = async (text: string) => {
    if (currentDocument) {
      // Temporarily inject or synthesize
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.slice(0, 2000),
          voice: playerState.voice,
          style: playerState.voiceStyle,
          language: "pt-BR",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const snd = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        snd.playbackRate = playerState.speed;
        snd.play();
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200"
    >
      {/* Drag & drop overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-indigo-950/80 border-4 border-dashed border-indigo-500 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center mb-4">
            <Headphones className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Solte o seu arquivo PDF aqui</h2>
          <p className="text-indigo-200 text-sm">Pronto para extrair páginas e ler em segundo plano com voz neural</p>
        </div>
      )}

      {/* Top Header */}
      <DocumentHeader
        currentDocument={currentDocument}
        onSelectDocument={(doc) => {
          setCurrentDocument(doc);
          setOriginalFile(null);
          jumpToPage(1);
        }}
        onUploadPDF={handleUploadPDF}
        onOpenAIDrawer={() => setIsAIDrawerOpen(true)}
        theme={theme}
        onChangeTheme={setTheme}
        bookmarks={bookmarks}
        onSelectBookmark={handleSelectBookmark}
        onAddBookmark={handleAddBookmark}
        isBookmarked={isCurrentBookmarked}
        notificationPermission={notificationPermission}
        onEnableNotifications={enableNotifications}
      />

      {/* Main Reader View */}
      <ReaderView
        document={currentDocument}
        currentPage={playerState.currentPage}
        currentParagraphIndex={playerState.currentParagraphIndex}
        isPlaying={playerState.isPlaying}
        theme={theme}
        originalFile={originalFile}
        onPageChange={jumpToPage}
        onParagraphClick={playParagraph}
      />

      {/* Master Bottom Player Bar */}
      <AudioPlayerBar
        playerState={playerState}
        document={currentDocument}
        onTogglePlay={togglePlay}
        onNextParagraph={nextParagraph}
        onPreviousParagraph={previousParagraph}
        onSpeedChange={setSpeed}
        onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
        onOpenAmbientSettings={() => setIsAmbientModalOpen(true)}
        onOpenSleepTimer={() => setIsSleepModalOpen(true)}
        onDownloadPageAudio={downloadCurrentPageAudio}
        notificationPermission={notificationPermission}
        onEnableNotifications={enableNotifications}
      />

      {/* Modals & Drawers */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentVoice={playerState.voice}
        onSelectVoice={setVoice}
        currentStyle={playerState.voiceStyle}
        onSelectStyle={setVoiceStyle}
        currentEngine={playerState.engine}
        onSelectEngine={setEngine}
        availableBrowserVoices={availableBrowserVoices}
        selectedBrowserVoiceURI={selectedBrowserVoiceURI}
        onSelectBrowserVoice={setSelectedBrowserVoiceURI}
      />

      <AmbientSoundModal
        isOpen={isAmbientModalOpen}
        onClose={() => setIsAmbientModalOpen(false)}
        currentSound={playerState.ambientSound}
        onSelectSound={setAmbientSound}
        volume={playerState.ambientVolume}
        onVolumeChange={setAmbientVolume}
        isPlaying={playerState.isPlaying}
      />

      <SleepTimerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        activeMinutes={playerState.sleepTimerMinutes}
        endTime={playerState.sleepTimerEnd}
        onSetTimer={setSleepTimer}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        document={currentDocument}
        currentPage={playerState.currentPage}
        onSpeakText={handleSpeakArbitraryText}
      />
    </div>
  );
}
