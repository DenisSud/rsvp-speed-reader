import React, { useState, useRef } from 'react';
import { Link, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { Readability } from '@mozilla/readability';

interface UrlBarProps {
  isZenMode: boolean;
  onTextReady: (text: string, title: string) => void;
}

type Status = 'idle' | 'loading' | 'loaded' | 'error';

const UrlBar: React.FC<UrlBarProps> = ({ isZenMode, onTextReady }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [inputValue, setInputValue] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const extractArticle = async (url: string): Promise<void> => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/fetch?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${response.status}`);
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Fix relative URLs in the document for Readability
      const baseUrl = new URL(url);
      const base = doc.createElement('base');
      base.href = baseUrl.origin;
      doc.head.insertBefore(base, doc.head.firstChild);

      const reader = new Readability(doc);
      const article = reader.parse();

      if (!article || !article.textContent.trim()) {
        throw new Error('No readable content found on this page');
      }

      const text = article.textContent.trim();
      const title = article.title || doc.title || url;

      setLoadedUrl(url);
      setInputValue(url);
      setStatus('loaded');
      onTextReady(text, title);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Failed to fetch this page';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputValue.trim();
    if (!url) return;

    // Auto-prefix URLs without protocol
    let normalized = url;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }

    extractArticle(normalized);
  };

  const handleClear = () => {
    setStatus('idle');
    setInputValue('');
    setLoadedUrl('');
    setErrorMessage('');
    onTextReady('', '');
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    // When clicking a loaded URL, switch to edit mode
    if (status === 'loaded') {
      setStatus('idle');
      setLoadedUrl('');
    }
  };

  const leftIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 size={16} className="animate-spin text-red-500" />;
      case 'loaded':
        return <Check size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Link size={16} className="text-zinc-500" />;
    }
  };

  const placeholder = () => {
    if (status === 'loading') return 'Fetching article…';
    if (status === 'error') return errorMessage;
    return 'Paste a URL to read — article, essay, blog post…';
  };

  return (
    <div
      className={`w-full transition-all duration-500 ${
        isZenMode
          ? 'opacity-0 -translate-y-4 pointer-events-none'
          : 'opacity-100 translate-y-0'
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl transition-colors focus-within:border-red-600/50"
      >
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900">
          {leftIcon()}
        </div>

        <input
          ref={inputRef}
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder()}
          disabled={status === 'loading'}
          className={`flex-1 bg-transparent border-none outline-none text-sm py-1 placeholder:text-zinc-600 transition-colors ${
            status === 'error' ? 'text-red-400' : 'text-zinc-300'
          }`}
        />

        {status === 'loaded' || status === 'error' ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            title="Clear"
          >
            <X size={16} />
          </button>
        ) : (
          inputValue.trim() && (
            <button
              type="submit"
              disabled={status === 'loading'}
              className="shrink-0 px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              Load
            </button>
          )
        )}
      </form>
    </div>
  );
};

export default UrlBar;
