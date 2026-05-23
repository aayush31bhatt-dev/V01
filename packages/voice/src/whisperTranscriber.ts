import type { SpeechChunk, TranscriptSegment } from "./pipeline";

export interface WhisperTranscriberConfig {
  apiKey: string;
  model: "whisper-1" | string;
}

export class WhisperTranscriber {
  constructor(private readonly config: WhisperTranscriberConfig) {}

  async transcribe(_chunk: SpeechChunk): Promise<TranscriptSegment> {
    // Future: call Whisper API, normalize segments, then feed task breakdown.
    void this.config;
    throw new Error("WhisperTranscriber.transcribe is not implemented yet.");
  }
}

