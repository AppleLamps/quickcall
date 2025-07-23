
export class AudioEncoder {
  // Convert Float32Array to 16-bit PCM for Gemini Live API (16kHz input)
  static encodeForGemini(float32Array: Float32Array): string {
    // Convert to 16-bit PCM
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Convert to base64 in chunks to prevent memory issues
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  // Convert base64 PCM from Gemini to playable audio (24kHz output)
  static decodeFromGemini(base64Audio: string): Uint8Array {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.error('Error decoding audio from Gemini:', error);
      return new Uint8Array(0);
    }
  }

  // Create WAV header for audio playback (24kHz output)
  static createWavFromPCM(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
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
}
