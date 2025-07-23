
export class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    console.log(`Added audio chunk to queue. Queue size: ${this.queue.length}`);
    
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      console.log('Audio queue empty, stopping playback');
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      
      this.currentSource.onended = () => {
        console.log('Audio chunk finished playing');
        this.playNext();
      };
      
      this.currentSource.start(0);
      console.log('Playing audio chunk');
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext(); // Continue with next chunk even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;
    const fileSize = 44 + dataSize;

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // WAV header
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Combine header and data
    const wavArray = new Uint8Array(fileSize);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(pcmData, 44);

    return wavArray;
  }

  stop() {
    this.queue = [];
    this.isPlaying = false;
    
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    
    console.log('Audio queue stopped and cleared');
  }

  clear() {
    this.queue = [];
    console.log('Audio queue cleared');
  }
}
