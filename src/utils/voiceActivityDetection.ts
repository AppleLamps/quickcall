
export class VoiceActivityDetection {
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;
  private isActive = false;
  private silenceThreshold = 0.01; // Adjust based on environment
  private minSpeechDuration = 300; // ms
  private maxSilenceDuration = 1500; // ms
  private speechStartTime = 0;
  private lastSpeechTime = 0;
  private onSpeechStart: () => void;
  private onSpeechEnd: () => void;
  private animationFrame: number | null = null;

  constructor(
    audioContext: AudioContext,
    source: MediaStreamAudioSourceNode,
    onSpeechStart: () => void,
    onSpeechEnd: () => void
  ) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    source.connect(this.analyser);
    
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
  }

  start() {
    this.isActive = true;
    this.detectVoiceActivity();
  }

  stop() {
    this.isActive = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private detectVoiceActivity() {
    if (!this.isActive) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length) / 255;
    
    const currentTime = Date.now();
    const isSpeaking = rms > this.silenceThreshold;
    
    if (isSpeaking) {
      if (this.speechStartTime === 0) {
        this.speechStartTime = currentTime;
      }
      this.lastSpeechTime = currentTime;
      
      // Check if we've been speaking long enough to trigger speech start
      if (currentTime - this.speechStartTime > this.minSpeechDuration) {
        this.onSpeechStart();
      }
    } else {
      // Check if we've been silent long enough to trigger speech end
      if (this.lastSpeechTime > 0 && 
          currentTime - this.lastSpeechTime > this.maxSilenceDuration) {
        this.onSpeechEnd();
        this.speechStartTime = 0;
        this.lastSpeechTime = 0;
      }
    }
    
    this.animationFrame = requestAnimationFrame(() => this.detectVoiceActivity());
  }

  // Get current volume level for UI feedback
  getVolumeLevel(): number {
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    return Math.sqrt(sum / this.dataArray.length) / 255;
  }
}
