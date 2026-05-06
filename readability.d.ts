declare module '@mozilla/readability' {
  export interface ReadabilityOptions {
    debug?: boolean;
    maxElemsToParse?: number;
    nbTopCandidates?: number;
    charThreshold?: number;
    classesToPreserve?: string[];
    keepClasses?: boolean;
    serializer?: (el: Node) => string;
    disableJSONLD?: boolean;
    allowedVideoRegex?: RegExp;
  }

  export interface ParseResult {
    title: string;
    byline: string;
    dir: string;
    lang: string;
    content: string;
    textContent: string;
    length: number;
    excerpt: string;
    siteName: string;
    publishedTime: string;
  }

  export class Readability {
    constructor(doc: Document, options?: ReadabilityOptions);
    parse(): ParseResult | null;
  }

  export function isProbablyReaderable(
    doc: Document,
    options?: ReadabilityOptions
  ): boolean;
}
