import { useState, useEffect, useRef, useCallback } from "react";
import { PDFDocumentData, PlayerState, AmbientSoundType, VoiceModelType } from "../types";
import { 
  setupMediaSession, 
  updateMediaSessionPlaybackState, 
  updateMediaSessionPosition,
  showPlaybackNotification,
  closePlaybackNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus 
} from "../utils/mediaSession";
import { ambientSound } from "../utils/audioSynthesizer";
import { backgroundAudioManager } from "../utils/backgroundAudioEngine";
import { GEMINI_VOICES, VOICE_STYLES } from "../utils/voiceList";

export function usePDFPlayer(document: PDFDocumentData | null) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentPage: 1,
    currentParagraphIndex: 0,
    speed: 1.0,
    voice: "Kore",
    voiceStyle: VOICE_STYLES[0].style,
    engine: "gemini-tts",
    ambientSound: "none",
    ambientVolume: 0.35,
    isBuffering: false,
    sleepTimerMinutes: null,
    sleepTimerEnd: null,
  });

  const [availableBrowserVoices, setAvailableBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceURI, setSelectedBrowserVoiceURI] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  // Hidden audio element for HTML5 WAV playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Audio cache to prevent re-fetching: key = `${docId}_${page}_${para}_${voice}_${style}`
  const audioCache = useRef<Map<string, string>>(new Map());
  // Preloading lock to avoid duplicate requests
  const prefetchingRef = useRef<Set<string>>(new Set());

  // Keep a ref of state to use in event callbacks without stale closures
  const stateRef = useRef(playerState);
  stateRef.current = playerState;

  const docRef = useRef(document);
  docRef.current = document;

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    // Timeupdate handler to sync timeline in notification / lock screen
    const handleTimeUpdate = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        updateMediaSessionPosition(audio.currentTime, audio.duration, stateRef.current.speed);
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);

    // Load browser speech voices
    const loadVoices = () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableBrowserVoices(voices);
        const ptVoice = voices.find(v => v.lang.startsWith("pt") || v.lang.includes("BR"));
        if (ptVoice) {
          setSelectedBrowserVoiceURI(ptVoice.voiceURI);
        } else if (voices.length > 0) {
          setSelectedBrowserVoiceURI(voices[0].voiceURI);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    setNotificationPermission(getNotificationPermissionStatus());

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.pause();
      audio.src = "";
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      ambientSound.stop();
      backgroundAudioManager.disableKeepAlive();
      closePlaybackNotification();
    };
  }, []);

  // Sleep timer interval
  useEffect(() => {
    if (!playerState.sleepTimerEnd) return;

    const interval = setInterval(() => {
      const remaining = (playerState.sleepTimerEnd || 0) - Date.now();
      if (remaining <= 0) {
        pause();
        setPlayerState(prev => ({
          ...prev,
          sleepTimerMinutes: null,
          sleepTimerEnd: null,
        }));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playerState.sleepTimerEnd]);

  // Ambient sound sync
  useEffect(() => {
    if (playerState.isPlaying && playerState.ambientSound !== "none") {
      ambientSound.play(playerState.ambientSound, playerState.ambientVolume);
    } else {
      ambientSound.stop();
    }
  }, [playerState.isPlaying, playerState.ambientSound, playerState.ambientVolume]);

  // Fetch or retrieve base64 WAV audio from server
  const getAudioForParagraph = useCallback(
    async (pageIndex: number, paragraphIndex: number, voice: string, style: string): Promise<string> => {
      const currentDoc = docRef.current;
      if (!currentDoc) throw new Error("Nenhum documento carregado.");

      const page = currentDoc.pages.find(p => p.pageNumber === pageIndex);
      if (!page || !page.paragraphs[paragraphIndex]) {
        throw new Error("Parágrafo não encontrado.");
      }

      const text = page.paragraphs[paragraphIndex].trim();
      const cacheKey = `${currentDoc.id}_${pageIndex}_${paragraphIndex}_${voice}_${style}`;

      if (audioCache.current.has(cacheKey)) {
        return audioCache.current.get(cacheKey)!;
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice,
          style,
          language: "pt-BR",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro de geração TTS (${res.status})`);
      }

      const data = await res.json();
      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      audioCache.current.set(cacheKey, audioUrl);
      return audioUrl;
    },
    []
  );

  // Preload upcoming paragraphs in background for seamless uninterrupted continuous playback
  const preloadUpcoming = useCallback(
    (pageIndex: number, paragraphIndex: number) => {
      const currentDoc = docRef.current;
      if (!currentDoc) return;

      const currentPageData = currentDoc.pages.find(p => p.pageNumber === pageIndex);
      if (!currentPageData) return;

      // Check next 2 paragraphs ahead
      for (let offset = 1; offset <= 2; offset++) {
        let targetPg = pageIndex;
        let targetPara = paragraphIndex + offset;

        if (targetPara >= currentPageData.paragraphs.length) {
          targetPg = pageIndex + 1;
          targetPara = targetPara - currentPageData.paragraphs.length;
        }

        const targetPageData = currentDoc.pages.find(p => p.pageNumber === targetPg);
        if (!targetPageData || !targetPageData.paragraphs[targetPara]) continue;

        const cacheKey = `${currentDoc.id}_${targetPg}_${targetPara}_${stateRef.current.voice}_${stateRef.current.voiceStyle}`;
        if (audioCache.current.has(cacheKey) || prefetchingRef.current.has(cacheKey)) continue;

        prefetchingRef.current.add(cacheKey);
        getAudioForParagraph(targetPg, targetPara, stateRef.current.voice, stateRef.current.voiceStyle)
          .catch(() => {})
          .finally(() => {
            prefetchingRef.current.delete(cacheKey);
          });
      }
    },
    [getAudioForParagraph]
  );

  // Core Play function
  const playCurrent = useCallback(
    async (pageIndex: number, paragraphIndex: number) => {
      const currentDoc = docRef.current;
      if (!currentDoc) return;

      const page = currentDoc.pages.find(p => p.pageNumber === pageIndex);
      if (!page) return;

      const paragraphText = page.paragraphs[paragraphIndex];
      if (!paragraphText) return;

      setErrorMessage(null);
      setPlayerState(prev => ({
        ...prev,
        isPlaying: true,
        currentPage: pageIndex,
        currentParagraphIndex: paragraphIndex,
        isBuffering: true,
      }));

      // Enable background audio keep-alive so the browser won't pause the tab
      backgroundAudioManager.enableKeepAlive();

      // Update MediaSession with currently reading text and page info for lock screen & notifications
      const mediaTitle = `${currentDoc.title} • Pág. ${pageIndex}/${currentDoc.totalPages}`;
      const mediaArtist = `Voz: ${stateRef.current.engine === "gemini-tts" ? stateRef.current.voice : "Local"} • Parágrafo ${paragraphIndex + 1}`;
      setupMediaSession({
        title: mediaTitle,
        artist: mediaArtist,
        album: currentDoc.title,
        onPlay: () => resume(),
        onPause: () => pause(),
        onNextTrack: () => nextParagraph(),
        onPreviousTrack: () => previousParagraph(),
        onSeekForward: () => seekBy(10),
        onSeekBackward: () => seekBy(-10),
        onSeekTo: (time) => {
          if (audioRef.current) audioRef.current.currentTime = time;
        },
      });
      updateMediaSessionPlaybackState("playing");

      // Update OS Notification banner if granted
      showPlaybackNotification(
        `▶ ${currentDoc.title} (Pág. ${pageIndex})`,
        paragraphText,
        true
      );

      // Handle Gemini High-Quality TTS Engine
      if (stateRef.current.engine === "gemini-tts") {
        try {
          const audioUrl = await getAudioForParagraph(
            pageIndex,
            paragraphIndex,
            stateRef.current.voice,
            stateRef.current.voiceStyle
          );

          if (!audioRef.current) return;

          audioRef.current.src = audioUrl;
          audioRef.current.playbackRate = stateRef.current.speed;

          // Event when paragraph ends
          audioRef.current.onended = () => {
            // Check if there is another paragraph on this page
            if (paragraphIndex + 1 < page.paragraphs.length) {
              playCurrent(pageIndex, paragraphIndex + 1);
            } else if (pageIndex < currentDoc.totalPages) {
              // Move to next page!
              playCurrent(pageIndex + 1, 0);
            } else {
              // Finished entire document
              pause();
            }
          };

          audioRef.current.onerror = (e) => {
            console.warn("Erro ao reproduzir áudio:", e);
            fallbackToBrowserSpeech(paragraphText, pageIndex, paragraphIndex, page, currentDoc);
          };

          await audioRef.current.play();
          setPlayerState(prev => ({ ...prev, isBuffering: false }));

          // Automatically preload next paragraphs in background
          preloadUpcoming(pageIndex, paragraphIndex);
        } catch (err: any) {
          console.error("Falha no Gemini TTS:", err);
          setErrorMessage("Falha ao gerar voz neural. Alternando para o sintetizador do navegador...");
          fallbackToBrowserSpeech(paragraphText, pageIndex, paragraphIndex, page, currentDoc);
        }
      } else {
        // Handle Browser SpeechSynthesis Engine
        fallbackToBrowserSpeech(paragraphText, pageIndex, paragraphIndex, page, currentDoc);
      }
    },
    [getAudioForParagraph, preloadUpcoming]
  );

  // Helper for speech synthesis fallback
  const fallbackToBrowserSpeech = (
    text: string,
    pageIndex: number,
    paragraphIndex: number,
    page: any,
    currentDoc: PDFDocumentData
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setErrorMessage("Nenhum sintetizador de voz disponível neste navegador.");
      pause();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = stateRef.current.speed;
    utterance.lang = "pt-BR";

    if (selectedBrowserVoiceURI) {
      const v = availableBrowserVoices.find(voice => voice.voiceURI === selectedBrowserVoiceURI);
      if (v) utterance.voice = v;
    }

    utterance.onend = () => {
      if (paragraphIndex + 1 < page.paragraphs.length) {
        playCurrent(pageIndex, paragraphIndex + 1);
      } else if (pageIndex < currentDoc.totalPages) {
        playCurrent(pageIndex + 1, 0);
      } else {
        pause();
      }
    };

    utterance.onerror = () => {
      pause();
    };

    window.speechSynthesis.speak(utterance);
    setPlayerState(prev => ({ ...prev, isBuffering: false }));
  };

  const resume = () => {
    backgroundAudioManager.enableKeepAlive();
    if (stateRef.current.engine === "gemini-tts") {
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
        updateMediaSessionPlaybackState("playing");
        showPlaybackNotification(
          `▶ ${docRef.current?.title || "VozPDF"} (Pág. ${stateRef.current.currentPage})`,
          "Reprodução retomada",
          true
        );
      } else {
        playCurrent(stateRef.current.currentPage, stateRef.current.currentParagraphIndex);
      }
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
        updateMediaSessionPlaybackState("playing");
      } else {
        playCurrent(stateRef.current.currentPage, stateRef.current.currentParagraphIndex);
      }
    }
  };

  const pause = () => {
    backgroundAudioManager.disableKeepAlive();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    setPlayerState(prev => ({ ...prev, isPlaying: false, isBuffering: false }));
    updateMediaSessionPlaybackState("paused");
    showPlaybackNotification(
      `⏸ ${docRef.current?.title || "VozPDF"}`,
      "Leitura pausada",
      false
    );
  };

  const togglePlay = () => {
    if (playerState.isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const seekBy = (seconds: number) => {
    if (audioRef.current && stateRef.current.engine === "gemini-tts") {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
    }
  };

  const nextParagraph = () => {
    const currentDoc = docRef.current;
    if (!currentDoc) return;

    const page = currentDoc.pages.find(p => p.pageNumber === stateRef.current.currentPage);
    if (!page) return;

    if (stateRef.current.currentParagraphIndex + 1 < page.paragraphs.length) {
      playCurrent(stateRef.current.currentPage, stateRef.current.currentParagraphIndex + 1);
    } else if (stateRef.current.currentPage < currentDoc.totalPages) {
      playCurrent(stateRef.current.currentPage + 1, 0);
    }
  };

  const previousParagraph = () => {
    if (stateRef.current.currentParagraphIndex > 0) {
      playCurrent(stateRef.current.currentPage, stateRef.current.currentParagraphIndex - 1);
    } else if (stateRef.current.currentPage > 1) {
      const prevPage = docRef.current?.pages.find(p => p.pageNumber === stateRef.current.currentPage - 1);
      const lastIndex = prevPage ? Math.max(0, prevPage.paragraphs.length - 1) : 0;
      playCurrent(stateRef.current.currentPage - 1, lastIndex);
    }
  };

  const jumpToPage = (pageNum: number) => {
    const currentDoc = docRef.current;
    if (!currentDoc) return;
    const clamped = Math.max(1, Math.min(currentDoc.totalPages, pageNum));
    playCurrent(clamped, 0);
  };

  const setSpeed = (newSpeed: number) => {
    setPlayerState(prev => ({ ...prev, speed: newSpeed }));
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const setVoice = (voiceId: string) => {
    setPlayerState(prev => ({ ...prev, voice: voiceId }));
    if (playerState.isPlaying) {
      playCurrent(playerState.currentPage, playerState.currentParagraphIndex);
    }
  };

  const setVoiceStyle = (style: string) => {
    setPlayerState(prev => ({ ...prev, voiceStyle: style }));
    if (playerState.isPlaying) {
      playCurrent(playerState.currentPage, playerState.currentParagraphIndex);
    }
  };

  const setEngine = (engine: VoiceModelType) => {
    setPlayerState(prev => ({ ...prev, engine }));
    if (playerState.isPlaying) {
      pause();
      setTimeout(() => {
        playCurrent(playerState.currentPage, playerState.currentParagraphIndex);
      }, 100);
    }
  };

  const setAmbientSound = (sound: AmbientSoundType) => {
    setPlayerState(prev => ({ ...prev, ambientSound: sound }));
  };

  const setAmbientVolume = (vol: number) => {
    setPlayerState(prev => ({ ...prev, ambientVolume: vol }));
    ambientSound.setVolume(vol);
  };

  const setSleepTimer = (minutes: number | null) => {
    if (!minutes) {
      setPlayerState(prev => ({ ...prev, sleepTimerMinutes: null, sleepTimerEnd: null }));
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      setPlayerState(prev => ({ ...prev, sleepTimerMinutes: minutes, sleepTimerEnd: endTime }));
    }
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? "granted" : "denied");
    if (granted && docRef.current) {
      showPlaybackNotification(
        `VozPDF: ${docRef.current.title}`,
        "Controle de notificações ativo!",
        playerState.isPlaying
      );
    }
    return granted;
  };

  const downloadCurrentPageAudio = async () => {
    const currentDoc = docRef.current;
    if (!currentDoc) return;

    try {
      setPlayerState(prev => ({ ...prev, isBuffering: true }));
      const page = currentDoc.pages.find(p => p.pageNumber === playerState.currentPage);
      if (!page) return;

      const fullPageText = page.text || page.paragraphs.join("\n\n");
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullPageText,
          voice: playerState.voice,
          style: playerState.voiceStyle,
          language: "pt-BR",
        }),
      });

      if (!res.ok) throw new Error("Erro ao baixar áudio da página.");

      const data = await res.json();
      const a = window.document.createElement("a");
      a.href = `data:audio/wav;base64,${data.audioBase64}`;
      a.download = `${currentDoc.title}_Pagina_${playerState.currentPage}_${playerState.voice}.wav`;
      a.click();
    } catch (err: any) {
      alert("Não foi possível baixar o áudio: " + err.message);
    } finally {
      setPlayerState(prev => ({ ...prev, isBuffering: false }));
    }
  };

  return {
    playerState,
    availableBrowserVoices,
    selectedBrowserVoiceURI,
    setSelectedBrowserVoiceURI,
    errorMessage,
    notificationPermission,
    enableNotifications,
    togglePlay,
    pause,
    resume,
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
    playParagraph: (pIndex: number) => playCurrent(playerState.currentPage, pIndex),
    downloadCurrentPageAudio,
  };
}
