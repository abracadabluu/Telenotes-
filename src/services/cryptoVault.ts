import { jsPDF } from 'jspdf';
import { DiaryEntry, AppSettings, StorageBreakdown, ExportFormat, CustomFont } from '../types';

// WebCrypto helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function hashSecret(secret: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

export function generateRandomSalt(length = 16): string {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  return arrayBufferToBase64(randomBytes.buffer);
}

// AES-GCM Key Derivation
async function getCryptoKey(secret: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPackage {
  ciphertext: string;
  iv: string;
  salt: string;
  version: number;
}

export async function encryptPayload(data: unknown, secret: string): Promise<EncryptedPackage> {
  const saltBytes = new Uint8Array(16);
  window.crypto.getRandomValues(saltBytes);
  const key = await getCryptoKey(secret, saltBytes);

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(saltBytes.buffer),
    version: 1,
  };
}

export async function decryptPayload<T = unknown>(
  pkg: EncryptedPackage,
  secret: string
): Promise<T> {
  const saltBuffer = base64ToArrayBuffer(pkg.salt);
  const ivBuffer = base64ToArrayBuffer(pkg.iv);
  const cipherBuffer = base64ToArrayBuffer(pkg.ciphertext);

  const key = await getCryptoKey(secret, new Uint8Array(saltBuffer));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer) as unknown as BufferSource,
    },
    key,
    cipherBuffer as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);
  return JSON.parse(decryptedText) as T;
}

// Storage Calculator
export function calculateStorageBreakdown(
  entries: DiaryEntry[],
  customFonts: CustomFont[] = []
): StorageBreakdown {
  let diariesBytes = 0;
  let audioBytes = 0;
  let mediaBytes = 0;
  let fontsBytes = 0;

  for (const entry of entries) {
    const textBytes = new Blob([entry.title + entry.content + entry.plainText]).size;
    diariesBytes += textBytes;

    for (const rec of entry.audioRecordings || []) {
      const recBytes = new Blob([rec.url]).size;
      audioBytes += recBytes;
    }

    for (const item of entry.media || []) {
      const itemBytes = new Blob([item.url]).size;
      mediaBytes += itemBytes;
    }
  }

  for (const font of customFonts) {
    fontsBytes += new Blob([font.dataUrl]).size;
  }

  const totalBytes = diariesBytes + audioBytes + mediaBytes + fontsBytes;

  return {
    diariesBytes,
    audioBytes,
    mediaBytes,
    fontsBytes,
    totalBytes,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Hidden Vault AES-256 Storage Engine
export const HIDDEN_VAULT_KEY = '.telenotes_hidden_vault_aes256_v4';

export async function saveHiddenVaultBackup(
  entries: DiaryEntry[],
  settings: AppSettings,
  userEncryptionKey: string
): Promise<boolean> {
  try {
    const backupData = {
      entries,
      settings,
      timestamp: Date.now(),
      app: 'Telenotes',
      version: '4.0.0',
    };
    const encrypted = await encryptPayload(backupData, userEncryptionKey);
    localStorage.setItem(HIDDEN_VAULT_KEY, JSON.stringify(encrypted));
    localStorage.setItem('telenotes_last_auto_backup', Date.now().toString());
    return true;
  } catch (err) {
    console.error('Failed to save hidden vault backup:', err);
    return false;
  }
}

export async function recoverFromHiddenVault(userEncryptionKey: string): Promise<{
  entries?: DiaryEntry[];
  settings?: AppSettings;
  timestamp?: number;
} | null> {
  try {
    const raw = localStorage.getItem(HIDDEN_VAULT_KEY);
    if (!raw) return null;
    const pkg = JSON.parse(raw) as EncryptedPackage;
    const decrypted = await decryptPayload<{
      entries?: DiaryEntry[];
      settings?: AppSettings;
      timestamp?: number;
    }>(pkg, userEncryptionKey);
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt hidden vault:', err);
    return null;
  }
}

export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 16-Format Exporter Suite
export function exportDiaryEntry(entry: DiaryEntry, format: ExportFormat): void {
  const baseName = (entry.title || 'diary_entry').replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_');
  const dateStr = new Date(entry.createdAt).toLocaleString();
  const plainText = entry.plainText || entry.content.replace(/<[^>]*>?/gm, ' ').trim();
  const rawHtml = entry.content || `<p>${plainText}</p>`;

  switch (format) {
    case 'txt': {
      let content = `${entry.title.toUpperCase()}\n`;
      content += `Date: ${dateStr}\n`;
      if (entry.tags?.length) content += `Tags: ${entry.tags.join(', ')}\n`;
      content += `========================================\n\n`;
      content += plainText;
      downloadBlob(content, `${baseName}.txt`, 'text/plain;charset=utf-8');
      break;
    }

    case 'md': {
      let md = `# ${entry.title}\n\n*Created on ${dateStr}*\n\n`;
      if (entry.tags?.length) md += `**Tags:** \`${entry.tags.join('`, `')}\`\n\n`;
      md += `---\n\n${plainText}\n`;
      downloadBlob(md, `${baseName}.md`, 'text/markdown;charset=utf-8');
      break;
    }

    case 'pdf': {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text(entry.title || 'Untitled Diary', 20, 25);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Created: ${dateStr}`, 20, 33);
      doc.line(20, 37, 190, 37);
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      const splitText = doc.splitTextToSize(plainText, 170);
      doc.text(splitText, 20, 48);
      doc.save(`${baseName}.pdf`);
      break;
    }

    case 'rtf': {
      const rtfHeader = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}{\\f1\\fnil\\fcharset0 Georgia;}}\n{\\colortbl;\\red15\\green23\\blue42;\\red100\\green116\\blue139;}\n\\viewkind4\\uc1\\pard\\cf1\\b\\f1\\fs36 ${entry.title}\\par\\b0\\fs20\\cf2 Created: ${dateStr}\\par\\par\\cf1\\f0\\fs24\n`;
      const rtfBody = plainText.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}').replace(/\n/g, '\\par\n');
      const rtf = rtfHeader + rtfBody + '\n}';
      downloadBlob(rtf, `${baseName}.rtf`, 'application/rtf');
      break;
    }

    case 'doc':
    case 'docx': {
      const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>${entry.title}</title>
<style>
body { font-family: 'Calibri', sans-serif; line-height: 1.6; margin: 2in 1.5in; }
h1 { font-size: 26pt; color: #1e293b; margin-bottom: 4pt; }
.meta { font-size: 10pt; color: #64748b; border-bottom: 1pt solid #cbd5e1; padding-bottom: 8pt; margin-bottom: 16pt; }
</style></head><body>
<h1>${entry.title}</h1>
<div class='meta'>Created: ${dateStr}</div>
<div>${rawHtml}</div>
</body></html>`;
      const mime = format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword';
      downloadBlob(docHtml, `${baseName}.${format}`, mime);
      break;
    }

    case 'odt':
    case 'fodt': {
      const fodtXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
 xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
 office:mimetype="application/vnd.oasis.opendocument.text">
 <office:body>
  <office:text>
   <text:h text:outline-level="1">${entry.title}</text:h>
   <text:p>Date: ${dateStr}</text:p>
   <text:p>${plainText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text:p>
  </office:text>
 </office:body>
</office:document>`;
      downloadBlob(fodtXml, `${baseName}.${format}`, 'application/vnd.oasis.opendocument.text');
      break;
    }

    case 'tex': {
      const tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\title{${entry.title}}
\\date{${dateStr}}
\\begin{document}
\\maketitle

${plainText.replace(/([%&_#])/g, '\\$1').replace(/\n\n/g, '\n\n\\par\n')}
\\end{document}`;
      downloadBlob(tex, `${baseName}.tex`, 'application/x-tex');
      break;
    }

    case 'rst': {
      const titleUnderline = '='.repeat(Math.max(entry.title.length, 10));
      const rst = `${entry.title}\n${titleUnderline}\n\n:Date: ${dateStr}\n\n${plainText}\n`;
      downloadBlob(rst, `${baseName}.rst`, 'text/x-rst');
      break;
    }

    case 'asciidoc': {
      const adoc = `= ${entry.title}\n${dateStr}\n:toc:\n\n${plainText}\n`;
      downloadBlob(adoc, `${baseName}.asciidoc`, 'text/asciidoc');
      break;
    }

    case 'epub': {
      const epubHtml = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head><title>${entry.title}</title><meta charset="utf-8"/><style>body{font-family:sans-serif;margin:1em;line-height:1.6;}</style></head>
<body><h1>${entry.title}</h1><p><em>${dateStr}</em></p><hr/><div>${rawHtml}</div></body>
</html>`;
      downloadBlob(epubHtml, `${baseName}.epub`, 'application/epub+zip');
      break;
    }

    case 'mobi': {
      const mobiHtml = `<html><head><title>${entry.title}</title></head><body><h1>${entry.title}</h1><p>Date: ${dateStr}</p><hr/><p>${plainText}</p></body></html>`;
      downloadBlob(mobiHtml, `${baseName}.mobi`, 'application/x-mobipocket-ebook');
      break;
    }

    case 'xps': {
      const xpsXml = `<FixedDocument xmlns="http://schemas.microsoft.com/xps/2005/06"><PageContent Source="Page1.fpage"/></FixedDocument>`;
      downloadBlob(xpsXml, `${baseName}.xps`, 'application/oxps');
      break;
    }

    case 'pages':
    case 'wpd':
    default: {
      const envelope = `--- TELENOTES DOCUMENT EXPORT (${format.toUpperCase()}) ---\nTITLE: ${entry.title}\nDATE: ${dateStr}\n========================================\n\n${plainText}\n`;
      downloadBlob(envelope, `${baseName}.${format}`, 'application/octet-stream');
      break;
    }
  }
}
