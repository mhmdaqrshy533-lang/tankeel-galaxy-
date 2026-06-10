/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private settingsVolume: number = 70; // 0 to 100
  private ambientOsc: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime((this.settingsVolume / 100) * 0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  setVolume(volume: number) {
    this.settingsVolume = volume;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime((volume / 100) * 0.5, this.ctx.currentTime, 0.1);
    }
  }

  private resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesis methods
  playClick() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playHover() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.setValueAtTime(450, this.ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playLaser(pitchType: 'high' | 'plasma' | 'laser' = 'laser') {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    if (pitchType === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.18);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (pitchType === 'plasma') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.26);
    } else {
      // high power laser
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.linearRampToValueAtTime(600, t + 0.3);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.32);
    }
  }

  playRocket() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // synthesize explosive friction with white noise
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  playExplosion() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const dur = 0.8;

    // noise source
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // sub oscillator for bass
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(100, t);
    subOsc.frequency.linearRampToValueAtTime(10, t + dur);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1000, t);
    lowpass.frequency.exponentialRampToValueAtTime(40, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    noise.start(t);
    subOsc.start(t);
    noise.stop(t + dur);
    subOsc.stop(t + dur);
  }

  playFootstep() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.setValueAtTime(40, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  playMissionCompleted() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Major C chord arpeggio
    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, noteTime);
      filter.frequency.exponentialRampToValueAtTime(300, noteTime + 0.35);

      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.38);
    });
  }

  playLevelUp() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    scale.forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.1, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  playAchievementUnlock() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // Low epic sub bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(80, t);
    subOsc.frequency.linearRampToValueAtTime(30, t + 1.2);
    subGain.gain.setValueAtTime(0.25, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 1.3);

    // Majestic ascending brass chords (C4 -> F4 -> G4 -> C5 triumph)
    const chords = [
      [261.63, 329.63, 392.00],        // C4, E4, G4
      [293.66, 369.99, 440.00],        // D4, F#4, A4
      [392.00, 493.88, 587.33],        // G4, B4, D5
      [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (Ascending high chimes)
    ];

    chords.forEach((chord, chordIdx) => {
      const chordTime = t + chordIdx * 0.16;
      chord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = chordIdx === 3 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, chordTime);
        osc.detune.setValueAtTime((idx - 1) * 6, chordTime); // detuning for warm space vibe

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, chordTime);
        filter.frequency.exponentialRampToValueAtTime(600, chordTime + 0.6);

        gain.gain.setValueAtTime(0.06, chordTime);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.65);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(chordTime);
        osc.stop(chordTime + 0.7);
      });
    });
  }

  startAmbient() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    if (this.ambientOsc) return;

    const t = this.ctx.currentTime;

    // Synthesize background sci-fi hum
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.setValueAtTime(55, t); // low A

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.setValueAtTime(110, t); // Octave

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(180, t);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.2, t);

    this.ambientOsc.connect(lowpass);
    this.ambientOsc2.connect(lowpass);
    lowpass.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc.start(t);
    this.ambientOsc2.start(t);
  }

  stopAmbient() {
    if (this.ambientOsc) {
      this.ambientOsc.stop();
      this.ambientOsc = null;
    }
    if (this.ambientOsc2) {
      this.ambientOsc2.stop();
      this.ambientOsc2 = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  updateEngineHum(speedPercent: number) {
    if (!this.ctx || !this.ambientOsc || !this.ambientOsc2) return;
    const baseFreq = 55 + speedPercent * 60; // frequency goes from 55 up to 115
    this.ambientOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.2);
    this.ambientOsc2.frequency.setTargetAtTime(baseFreq * 2, this.ctx.currentTime, 0.2);
  }

  // Native wired headphones audio session sensing
  async checkWiredHeadphones(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasHeadphones = devices.some(device => 
        device.kind === 'audiooutput' && 
        (device.label.toLowerCase().includes('headphone') || 
         device.label.toLowerCase().includes('headset') || 
         device.label.toLowerCase().includes('wired') ||
         device.label.toLowerCase().includes('jack') ||
         device.label.toLowerCase().includes('earphone'))
      );

      // Node frequency destination configuration matrix
      if (this.ctx && this.ctx.destination) {
        const dest = this.ctx.destination;
        if (dest.maxChannelCount > 2 || hasHeadphones) {
          return true;
        }
      }
      return hasHeadphones;
    } catch (e) {
      return false;
    }
  }

  // ISSA AL-LAITH ZAMIL TRIBAL STEP-SEQUENCER & STREAMER
  private tribalInterval: any = null;
  private tribalStep: number = 0;
  private zamilAudio: HTMLAudioElement | null = null;
  public isUsingSynthFallback = false;

  playZamilKick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, time); // Exactly 55Hz sub-bass as requested
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.16);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, time);
    
    osc.disconnect(gain);
    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
    
    osc.start(time);
    osc.stop(time + 0.18);
  }

  playZamilSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.08);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(time);
    noise.stop(time + 0.12);
  }

  playReplicaMelody(time: number, step: number) {
    if (!this.ctx || !this.masterGain) return;
    // Classic driving epic war-march minor key cadences (Zamil style) at 135 BPM
    const zamilScale = [220.00, 220.00, 246.94, 261.63, 293.66, 261.63, 246.94, 220.00]; 
    const freq = zamilScale[step % 8];

    // Dual-Oscillator Synth Circuit (combining Sawtooth + Square)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 0.5, time); // sub-octave layer for grit

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + 0.25);

    gain1.gain.setValueAtTime(0.1, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    gain2.gain.setValueAtTime(0.05, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.26);
    osc2.stop(time + 0.26);
  }

  startTribalZamilSynth() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    if (this.tribalInterval) return;

    this.isUsingSynthFallback = true;
    this.tribalStep = 0;
    const stepDuration = 60 / 135 / 2; // 135 BPM 8th notes ~0.222s

    this.tribalInterval = setInterval(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Heavy 1st and 3rd / driver drum kick march
      const isKickStep = this.tribalStep % 2 === 0;
      if (isKickStep) {
        this.playZamilKick(t);
      }

      // Syncopated military metallic drone snare burst
      const isSnareStep = this.tribalStep % 8 === 3 || this.tribalStep % 8 === 6 || this.tribalStep % 8 === 7;
      if (isSnareStep) {
        this.playZamilSnare(t);
      }

      // Melodic driving brass synthesizer note
      if (this.tribalStep % 2 === 1) {
        this.playReplicaMelody(t, this.tribalStep);
      }

      this.tribalStep = (this.tribalStep + 1) % 64;
    }, stepDuration * 1000);
  }

  stopTribalZamilSynth() {
    if (this.tribalInterval) {
      clearInterval(this.tribalInterval);
      this.tribalInterval = null;
    }
    this.isUsingSynthFallback = false;
  }

  startTribalZamilStream() {
    this.resume();
    this.stopTribalZamilSynth();

    if (this.zamilAudio) {
      try {
        this.zamilAudio.pause();
      } catch (e) {}
      this.zamilAudio = null;
    }

    try {
      this.zamilAudio = new Audio('/assets/audio/zamil.mp3');
      this.zamilAudio.volume = (this.settingsVolume / 100) * 0.5;
      this.zamilAudio.loop = true;

      const playPromise = this.zamilAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isUsingSynthFallback = false;
          console.log("Stream successfully initiated for zamil.mp3.");
        }).catch(err => {
          console.warn("Could not play zamil.mp3 stream, launching high-energy synth fallback:", err);
          this.startTribalZamilSynth();
        });
      }
    } catch (e) {
      console.warn("Failed to instantiate HTML5 Audio, launching synthetic oscillators:", e);
      this.startTribalZamilSynth();
    }
  }

  stopTribalZamilStream() {
    this.stopTribalZamilSynth();
    if (this.zamilAudio) {
      try {
        this.zamilAudio.pause();
      } catch (e) {}
      this.zamilAudio = null;
    }
  }

  // Screen shake sub-bass explosion decay envelope
  triggerTankeelExplosion() {
    this.resume();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Sub-bass heavy decay
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(95, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 1.8);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 2.0);

    // Deep heavy noise burst
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(30, t + 1.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 1.6);
  }
}

export const sound = new SoundEngine();
