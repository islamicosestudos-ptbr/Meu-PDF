import { AmbientSoundType } from "../types";

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = "none";
  private masterGain: GainNode | null = null;
  private nodes: (AudioNode | number)[] = [];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    this.nodes.forEach((node) => {
      if (typeof node === "number") {
        clearInterval(node);
      } else {
        try {
          if ("stop" in node && typeof (node as any).stop === "function") {
            (node as any).stop();
          }
          node.disconnect();
        } catch (e) {
          // ignore disconnect errors
        }
      }
    });
    this.nodes = [];
    this.currentType = "none";
  }

  public play(type: AmbientSoundType, volume: number = 0.3) {
    if (this.currentType === type && this.nodes.length > 0) return;

    this.stop();
    if (type === "none") return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    this.setVolume(volume);
    this.currentType = type;

    switch (type) {
      case "rain":
        this.createRainSound();
        break;
      case "whitenoise":
        this.createWhiteNoise();
        break;
      case "cafe":
        this.createCafeAtmosphere();
        break;
      case "binaural432":
        this.createBinaural432Hz();
        break;
      case "waves":
        this.createOceanWaves();
        break;
    }
  }

  private createWhiteNoise() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Pink-noise / soft filter so it is soothing rather than harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.nodes.push(noise, filter, gain);
  }

  private createRainSound() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brown/pink noise generator for rain patter
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.setValueAtTime(300, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.nodes.push(noise, filter, highpass, gain);
  }

  private createBinaural432Hz() {
    if (!this.ctx || !this.masterGain) return;
    // 432 Hz carrier frequency + 6 Hz Theta wave for deep reading focus
    const oscLeft = this.ctx.createOscillator();
    const oscRight = this.ctx.createOscillator();
    const panLeft = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    const panRight = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

    oscLeft.type = "sine";
    oscRight.type = "sine";
    oscLeft.frequency.setValueAtTime(216, this.ctx.currentTime); // subharmonic 432
    oscRight.frequency.setValueAtTime(222, this.ctx.currentTime); // 6Hz binaural beat (Alpha/Theta)

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    if (panLeft && panRight) {
      panLeft.pan.setValueAtTime(-0.8, this.ctx.currentTime);
      panRight.pan.setValueAtTime(0.8, this.ctx.currentTime);
      oscLeft.connect(panLeft);
      oscRight.connect(panRight);
      panLeft.connect(gain);
      panRight.connect(gain);
    } else {
      oscLeft.connect(gain);
      oscRight.connect(gain);
    }

    gain.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();
    this.nodes.push(oscLeft, oscRight, gain);
  }

  private createOceanWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO to simulate rolling ocean swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second waves
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(400, this.ctx.currentTime);

    lfo.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.nodes.push(noise, lfo, lfoGain, filter, gain);
  }

  private createCafeAtmosphere() {
    if (!this.ctx || !this.masterGain) return;
    // Layered soft murmur and muffled room tone
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(550, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.nodes.push(noise, filter, gain);
  }
}

export const ambientSound = new AmbientSoundEngine();
