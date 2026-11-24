/**
 * Seam between the course and a learning management system. The course calls
 * these methods; a SCORM 1.2 / 2004 or xAPI implementation can be added later
 * without touching screens or learning state. Nothing here sends data anywhere:
 * the default adapter does nothing, so the course runs as a plain static site.
 */
export interface LmsProgress {
  /** Current screen id, for resuming at the same place. */
  location: string;
  /** Compact, versioned learning state (the same JSON the course saves locally). */
  suspendData: string;
}

export interface LmsScore {
  raw: number;
  max: number;
  /** 0–1 */
  scaled: number;
  passed: boolean;
}

export interface LmsAdapter {
  readonly kind: string;
  setProgress(progress: LmsProgress): void;
  setScore(score: LmsScore): void;
  /** Called only once the course's completion rule is met. */
  setCompleted(): void;
}

export class NoopLms implements LmsAdapter {
  readonly kind = 'none';
  setProgress(): void {}
  setScore(): void {}
  setCompleted(): void {}
}

/** Records calls in memory; used by tests and visible in development for inspection. */
export class MemoryLms implements LmsAdapter {
  readonly kind = 'memory';
  progress: LmsProgress | null = null;
  scores: LmsScore[] = [];
  completed = false;
  setProgress(progress: LmsProgress) {
    this.progress = progress;
  }
  setScore(score: LmsScore) {
    this.scores.push(score);
  }
  setCompleted() {
    this.completed = true;
  }
}
