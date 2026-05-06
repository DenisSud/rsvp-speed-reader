export interface WordData {
  text: string;
  focalIndex: number;
  pauseMultiplier?: number;
  /** Fixed-duration blank pause in ms (sentence/paragraph breaks).
   *  Overrides WPM-based timing. */
  fixedPauseMs?: number;
  /** When true, RSVP player shows blank screen instead of text. */
  isPause?: boolean;
}

export type AppFont = 'mono' | 'sans' | 'serif';
export type AppFontWeight = 'normal' | 'bold';

export interface ReaderSettings {
  wpm: number;
  initialWpm: number;
  targetWpm: number;
  enableGradualIncrease: boolean;
  wpmJumpStep: number;
  font: AppFont;
  fontWeight: AppFontWeight;
  sideOpacity: number;
  audioSrc: string;
}

export interface RSVPState extends ReaderSettings {
  isPlaying: boolean;
  currentWordIndex: number;
  text: string;
}
