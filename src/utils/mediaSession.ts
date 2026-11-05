export interface MediaSessionConfig {
  title: string;
  artist: string;
  album: string;
  duration?: number;
  position?: number;
  onPlay: () => void;
  onPause: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onSeekTo?: (time: number) => void;
}

// Crisp audio book cover artwork for notification and lock screen widgets
const ARTWORK_ICONS = [
  {
    src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=512&q=80",
    sizes: "512x512",
    type: "image/jpeg",
  },
  {
    src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=256&q=80",
    sizes: "256x256",
    type: "image/jpeg",
  },
];

export function setupMediaSession(config: MediaSessionConfig) {
  if (!("mediaSession" in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: config.title,
      artist: config.artist,
      album: config.album,
      artwork: ARTWORK_ICONS,
    });

    navigator.mediaSession.setActionHandler("play", () => config.onPlay());
    navigator.mediaSession.setActionHandler("pause", () => config.onPause());

    if (config.onNextTrack) {
      navigator.mediaSession.setActionHandler("nexttrack", () => config.onNextTrack!());
    }
    if (config.onPreviousTrack) {
      navigator.mediaSession.setActionHandler("previoustrack", () => config.onPreviousTrack!());
    }
    if (config.onSeekForward) {
      navigator.mediaSession.setActionHandler("seekforward", () => config.onSeekForward!());
    }
    if (config.onSeekBackward) {
      navigator.mediaSession.setActionHandler("seekbackward", () => config.onSeekBackward!());
    }
    if (config.onSeekTo) {
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") {
          config.onSeekTo!(details.seekTime);
        }
      });
    }

    // Try setting position state if duration is provided
    if (config.duration && config.duration > 0 && "setPositionState" in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: config.duration,
        playbackRate: 1.0,
        position: Math.min(config.position || 0, config.duration),
      });
    }
  } catch (err) {
    console.warn("MediaSession API setup error:", err);
  }
}

export function updateMediaSessionPlaybackState(state: "playing" | "paused" | "none") {
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch (err) {
    // ignore
  }
}

export function updateMediaSessionPosition(position: number, duration: number, rate: number = 1.0) {
  if (!("mediaSession" in navigator) || !("setPositionState" in navigator.mediaSession)) return;
  try {
    if (duration > 0 && Number.isFinite(duration)) {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0.1, duration),
        playbackRate: rate,
        position: Math.min(Math.max(0, position), duration),
      });
    }
  } catch (err) {
    // ignore
  }
}

/**
 * System Notification API integration
 * Allows displaying and updating rich notifications directly in OS notification center
 */
let currentNotification: Notification | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  try {
    if (Notification.permission === "granted") return true;
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch (e) {
    return false;
  }
}

export function getNotificationPermissionStatus(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function showPlaybackNotification(title: string, body: string, isPlaying: boolean) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    // Re-use or replace notification seamlessly with tag
    if (currentNotification) {
      currentNotification.close();
    }

    currentNotification = new Notification(title, {
      body: body.length > 140 ? body.slice(0, 140) + "..." : body,
      icon: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=192&q=80",
      badge: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=96&q=80",
      tag: "vozpdf-reading-status",
      silent: true,
    });
  } catch (err) {
    console.warn("Notification error:", err);
  }
}

export function closePlaybackNotification() {
  if (currentNotification) {
    try {
      currentNotification.close();
      currentNotification = null;
    } catch (e) {
      // ignore
    }
  }
}
