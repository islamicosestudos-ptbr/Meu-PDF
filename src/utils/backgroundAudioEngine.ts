/**
 * Background Audio Keep-Alive
 * Uses an ultra-lightweight silent audio loop to prevent browser tabs from suspending
 * or killing audio permissions when the phone screen is locked or tab is minimized.
 */

// 1-second clean PCM silent WAV data URI
const SILENT_WAV_DATA_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

class BackgroundAudioManager {
  private silentAudio: HTMLAudioElement | null = null;
  private isActive: boolean = false;

  public enableKeepAlive() {
    if (this.isActive) return;

    try {
      if (!this.silentAudio) {
        this.silentAudio = new Audio(SILENT_WAV_DATA_URI);
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.001; // virtually inaudible, but registers active hardware audio stream
        this.silentAudio.title = "VozPDF Background Engine";
      }

      const promise = this.silentAudio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            this.isActive = true;
          })
          .catch((e) => {
            // Might be prevented until user interaction
            console.warn("Silent keep-alive play deferred:", e);
          });
      }
    } catch (err) {
      console.warn("Background audio engine error:", err);
    }
  }

  public disableKeepAlive() {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
        this.silentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }
    this.isActive = false;
  }
}

export const backgroundAudioManager = new BackgroundAudioManager();
