import React, { useState, useRef } from 'react';
import { FileText, Loader2, Check, X, AlertCircle, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Readability } from '@mozilla/readability';

// Use CDN worker to avoid bundling ~2 MB worker file
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileUploadProps {
  onTextReady: (text: string, title: string) => void;
}

type Status = 'idle' | 'loading' | 'loaded' | 'error';

const ACCEPTED_TYPES = '.pdf,.epub';

/** Extract text from a PDF using pdfjs-dist */
async function extractPdf(arrayBuf: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
  const parts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    parts.push(pageText);
  }

  return parts.join('\n\n');
}

/** Extract text from an EPUB (ZIP of HTML files) */
async function extractEpub(arrayBuf: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuf);

  // EPUB content files are usually in OEBPS/ or similar
  // Find the container.xml to locate the rootfile, or just iterate
  const textFiles: { name: string; text: string }[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    // Content documents: .xhtml, .html, .htm
    if (!/\.(x?html?|xml)$/i.test(name)) continue;

    const html = await entry.async('string');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const reader = new Readability(doc);
    const article = reader.parse();

    if (article && article.textContent.trim()) {
      textFiles.push({ name, text: article.textContent.trim() });
    }
  }

  // Sort by filename for natural chapter order, then concatenate
  textFiles.sort((a, b) => a.name.localeCompare(b.name));
  return textFiles.map((f) => f.text).join('\n\n');
}

const FileUpload: React.FC<FileUploadProps> = ({ onTextReady }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [filename, setFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus('loading');
    setFilename(file.name);
    setErrorMessage('');

    try {
      const arrayBuf = await file.arrayBuffer();
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const text = isPdf
        ? await extractPdf(arrayBuf)
        : await extractEpub(arrayBuf);

      if (!text.trim()) {
        throw new Error('No readable text found in this file');
      }

      // Use filename (without extension) as the title
      const title = file.name.replace(/\.(pdf|epub)$/i, '');
      setStatus('loaded');
      onTextReady(text, title);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Failed to extract text';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so re-selecting the same file triggers onChange
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClear = () => {
    setStatus('idle');
    setFilename('');
    setErrorMessage('');
    onTextReady('', '');
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
        return <FileText size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleChange}
        className="hidden"
      />

      {status === 'loaded' || status === 'error' ? (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
          {leftIcon()}
          <span
            className={`text-xs truncate max-w-[200px] ${
              status === 'error' ? 'text-red-400' : 'text-zinc-300'
            }`}
          >
            {status === 'error' ? errorMessage : filename}
          </span>
          <button
            onClick={handleClear}
            className="shrink-0 p-0.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            title="Clear"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={status === 'loading'}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {leftIcon()}
          <Upload size={14} />
          <span>
            {status === 'loading' ? 'Extracting…' : 'Upload PDF or EPUB'}
          </span>
        </button>
      )}
    </div>
  );
};

export default FileUpload;
