
import { VoiceActivityDetection } from './voiceActivityDetection';

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private vad: VoiceActivityDetection | null = null;
  private isRecording = false;
  private isSpeaking = false;
  private onSpeechStart: () => void;
  private onSpeechEnd: () => void;

  constructor(
    private onAudioData: (audioData: Float32Array) => void,
    onSpeechStart: () => void,
    onSpeechEnd: () => void
  ) {
    this.onSpeechStart = onSpeechStart;
    this.onSpeechEnd = onSpeechEnd;
  }

  async start() {
    try {
      // Request microphone access with specific constraints for Gemini Live
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context at 16kHz for Gemini Live
      this.audioContext = new AudioContext({
        sampleRate: 16000,
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Set up VAD
      this.vad = new VoiceActivityDetection(
        this.audioContext,
        this.source,
        () => {
          console.log('Speech detected - starting audio transmission');
          this.isSpeaking = true;
          this.onSpeechStart();
        },
        () => {
          console.log('Speech ended - stopping audio transmission');
          this.isSpeaking = false;
          this.onSpeechEnd();
        }
      );

      this.processor.onaudioprocess = (e) => {
        if (this.isRecording && this.isSpeaking) {
          const inputData = e.inputBuffer.getChannelData(0);
          this.onAudioData(new Float32Array(inputData));
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
      
      // Start VAD
      this.vad.start();

      console.log('Audio recorder started at 16kHz with VAD');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    this.isRecording = false;
    this.isSpeaking = false;
    
    if (this.vad) {
      this.vad.stop();
      this.vad = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('Audio recorder stopped');
  }

  pause() {
    this.isRecording = false;
    console.log('Audio recorder paused');
  }

  resume() {
    this.isRecording = true;
    console.log('Audio recorder resumed');
  }

  getVolumeLevel(): number {
    return this.vad?.getVolumeLevel() || 0;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
