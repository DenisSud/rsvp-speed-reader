export interface WordData {
  text: string;
  focalIndex: number;
  pauseMultiplier?: number;
  /** Adaptive blank pause: 'sentence' (after .!?) or 'paragraph' (after \n\n).
   *  Duration scales with WPM — slower reading = longer pause (clamped). */
  pauseType?: 'sentence' | 'paragraph';
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
