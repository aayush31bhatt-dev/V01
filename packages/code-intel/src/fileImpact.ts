export interface FileImpactRange {
  path: string;
  startLine?: number;
  endLine?: number;
  reason: string;
}

export interface FileImpactReport {
  taskId: string;
  ranges: FileImpactRange[];
}

