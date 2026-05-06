import { WordData } from "../types";

/** Approximate focal character index (left-of-center, ~1/3 into the word). */
export const calculateFocalIndex = (word: string): number => {
  const length = word.length;
  if (length <= 1) return 0;
  if (length <= 3) return 1;
  if (length <= 5) return 2;
  if (length <= 9) return 3;
  return 4;
};

/** Length-based display-time factor so longer words get proportionally more time. */
const lengthFactor = (word: string): number => {
  const len = word.length;
  if (len <= 2) return 0.8;
  if (len <= 3) return 0.9;
  if (len >= 11) return 1.2;
  if (len >= 9) return 1.1;
  return 1.0;
};

/** Word-ending punctuation that triggers an intra-sentence comma-style pause. */
const COMMA_PUNCTUATION = new Set([",", ";", ":"]);

/** Sentence-ending punctuation that triggers a 300 ms blank pause. */
const SENTENCE_PUNCTUATION = new Set([".", "!", "?"]);

export const processText = (text: string): WordData[] => {
  if (!text) return [];

  // ── Normalise ────────────────────────────────────────────────
  // Fix missing spaces between concatenated sentences
  // ("something.This" → "something. This") without mangling
  // abbreviations ("U.S.A") or numbers ("3.14").
  const normalized = text.replace(/([a-z])([.!?])([A-Z])/g, "$1$2 $3");

  // ── Split into paragraphs ────────────────────────────────────
  const paragraphs = normalized.split(/\n{2,}/).filter((p) => p.trim());

  const result: WordData[] = [];

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const rawWords = paragraphs[pi].trim().split(/\s+/);

    for (let wi = 0; wi < rawWords.length; wi++) {
      const word = rawWords[wi];

      // Punctuation-style multiplier for commas / semicolons / colons
      let punctMul = 1.0;
      for (const ch of COMMA_PUNCTUATION) {
        if (word.endsWith(ch)) {
          punctMul = 1.5;
          break;
        }
      }

      // Combine length factor with punctuation multiplier
      const multiplier = Math.round(lengthFactor(word) * punctMul * 100) / 100;

      result.push({
        text: word,
        focalIndex: calculateFocalIndex(word),
        pauseMultiplier: multiplier,
      });

      // ── Intra-paragraph sentence pause ─────────────────────
      const isLast = wi === rawWords.length - 1;
      if (!isLast) {
        for (const ch of SENTENCE_PUNCTUATION) {
          if (word.endsWith(ch)) {
            result.push({
              text: "",
              focalIndex: 0,
              isPause: true,
              fixedPauseMs: 200,
            });
            break;
          }
        }
      }
    }

    // ── Inter-paragraph pause ───────────────────────────────────
    // Supersedes any sentence pause so we never stack breaks.
    // Remove any trailing sentence pause from the last word of this
    // paragraph, then insert the paragraph pause.
    if (pi < paragraphs.length - 1) {
      // Pop trailing sentence pause if present
      if (
        result.length > 0 &&
        result[result.length - 1].isPause &&
        result[result.length - 1].fixedPauseMs === 300
      ) {
        result.pop();
      }
      result.push({
        text: "",
        focalIndex: 0,
        isPause: true,
        fixedPauseMs: 600,
      });
    }
  }

  return result;
};

/**
 * Formats a word into three parts: pre-focal, focal, and post-focal.
 */
export const splitWord = (word: WordData) => {
  const text = word.text;
  const idx = word.focalIndex;

  return {
    prefix: text.substring(0, idx),
    focal: text[idx] || "",
    suffix: text.substring(idx + 1),
  };
};
