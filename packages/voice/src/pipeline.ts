export interface SpeechChunk {
  id: string;
  mimeType: string;
  data: ArrayBuffer;
  capturedAt: string;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  confidence?: number;
  startedAt: string;
  completedAt: string;
}

export interface VoicePipeline {
  pushChunk(chunk: SpeechChunk): Promise<void>;
  flush(): Promise<TranscriptSegment[]>;
}

