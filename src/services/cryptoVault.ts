import { jsPDF } from 'jspdf';
import { DiaryEntry, BookProject, AppSettings, StorageBreakdown } from '../types';

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
  books: BookProject[]
): StorageBreakdown {
  let diariesBytes = 0;
  let booksBytes = 0;
  let audioBytes = 0;
  let imagesBytes = 0;
  let stickersBytes = 0;

  for (const entry of entries) {
    const textBytes = new Blob([entry.title + entry.content + entry.plainText]).size;
    diariesBytes += textBytes;

    for (const rec of entry.audioRecordings || []) {
      const recBytes = new Blob([rec.url]).size;
      audioBytes += recBytes;
    }

    for (const st of entry.stickers || []) {
      const stBytes = new Blob([st.stickerUrl]).size;
      stickersBytes += stBytes;
    }

    for (const att of entry.attachments || []) {
      const attBytes = att.size || new Blob([att.url]).size;
      if (att.type.startsWith('image/')) {
        imagesBytes += attBytes;
      } else if (att.type.startsWith('audio/')) {
        audioBytes += attBytes;
      } else {
        diariesBytes += attBytes;
      }
    }
  }

  for (const book of books) {
    let bookText = book.title + (book.subtitle || '') + book.author + book.genre + book.outlineNotes;
    for (const chap of book.chapters) {
      bookText += chap.title + chap.content + (chap.notes || '');
    }
    for (const char of book.characters) {
      bookText += char.name + char.role + char.notes;
    }
    const bBytes = new Blob([bookText]).size;
    booksBytes += bBytes;

    if (book.coverStyle?.customCoverUrl) {
      imagesBytes += new Blob([book.coverStyle.customCoverUrl]).size;
    }
  }

  const totalBytes = diariesBytes + booksBytes + audioBytes + imagesBytes + stickersBytes;

  return {
    diariesBytes,
    booksBytes,
    audioBytes,
    imagesBytes,
    stickersBytes,
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

// Export Generators
export function exportToMarkdown(entry: DiaryEntry): void {
  const dateStr = new Date(entry.createdAt).toLocaleString();
  let md = `# ${entry.title}\n\n`;
  md += `*Created on ${dateStr}*\n\n`;
  if (entry.tags && entry.tags.length > 0) {
    md += `Tags: ${entry.tags.join(', ')}\n\n`;
  }
  md += `---\n\n`;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = entry.content;
  md += (tempDiv.textContent || entry.plainText || entry.content) + '\n\n';

  downloadBlob(md, `${entry.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'diary'}.md`, 'text/markdown');
}

export function exportToTxt(entry: DiaryEntry): void {
  const dateStr = new Date(entry.createdAt).toLocaleString();
  let txt = `${entry.title.toUpperCase()}\n`;
  txt += `Date: ${dateStr}\n`;
  txt += `========================================\n\n`;
  txt += entry.plainText || entry.content.replace(/<[^>]*>?/gm, '');

  downloadBlob(txt, `${entry.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'diary'}.txt`, 'text/plain');
}

export function exportToHtml(entry: DiaryEntry): void {
  const dateStr = new Date(entry.createdAt).toLocaleString();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${entry.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1 { margin-bottom: 8px; font-size: 2rem; }
    .meta { color: #64748b; font-size: 0.9rem; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  <h1>${entry.title}</h1>
  <div class="meta">Created: ${dateStr}</div>
  <div class="content">${entry.content}</div>
</body>
</html>`;

  downloadBlob(html, `${entry.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'diary'}.html`, 'text/html');
}

export function exportEntryToPdf(entry: DiaryEntry): void {
  const doc = new jsPDF();
  const dateStr = new Date(entry.createdAt).toLocaleString();

  doc.setFontSize(22);
  doc.text(entry.title || 'Untitled Diary', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Created: ${dateStr}`, 20, 33);
  doc.line(20, 37, 190, 37);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);

  const cleanText = entry.plainText || entry.content.replace(/<[^>]*>?/gm, ' ');
  const splitText = doc.splitTextToSize(cleanText, 170);
  doc.text(splitText, 20, 48);

  doc.save(`${entry.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'diary'}.pdf`);
}

export const HIDDEN_VAULT_KEY = 'telenotes_hidden_vault_encrypted_v3';

export async function saveHiddenVaultBackup(
  entries: DiaryEntry[],
  books: BookProject[],
  settings: AppSettings,
  secretKey: string
): Promise<boolean> {
  try {
    const backupData = {
      entries,
      books,
      settings,
      timestamp: Date.now(),
      app: 'Telenotes',
    };
    const encrypted = await encryptPayload(backupData, secretKey);
    localStorage.setItem(HIDDEN_VAULT_KEY, JSON.stringify(encrypted));
    localStorage.setItem('telenotes_last_auto_backup', Date.now().toString());
    return true;
  } catch (err) {
    console.error('Failed to save hidden vault backup:', err);
    return false;
  }
}

export async function recoverFromHiddenVault(secretKey: string): Promise<{
  entries?: DiaryEntry[];
  books?: BookProject[];
  settings?: AppSettings;
  timestamp?: number;
} | null> {
  try {
    const raw = localStorage.getItem(HIDDEN_VAULT_KEY);
    if (!raw) return null;
    const pkg = JSON.parse(raw) as EncryptedPackage;
    const decrypted = await decryptPayload<{
      entries?: DiaryEntry[];
      books?: BookProject[];
      settings?: AppSettings;
      timestamp?: number;
    }>(pkg, secretKey);
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt hidden vault:', err);
    return null;
  }
}

export function exportBookToPdf(book: BookProject): void {
  const doc = new jsPDF();

  // Cover Page
  doc.setFontSize(28);
  doc.text(book.title, 105, 100, { align: 'center' });

  if (book.subtitle) {
    doc.setFontSize(16);
    doc.setTextColor(100, 116, 139);
    doc.text(book.subtitle, 105, 115, { align: 'center' });
  }

  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text(`By ${book.author || 'Anonymous'}`, 105, 140, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Genre: ${book.genre || 'General Fiction'}  •  Target: ${book.targetWords} words`, 105, 150, {
    align: 'center',
  });

  // Table of Contents
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Table of Contents', 20, 30);
  doc.line(20, 35, 190, 35);

  let tocY = 48;
  doc.setFontSize(12);
  for (let i = 0; i < book.chapters.length; i++) {
    const chap = book.chapters[i];
    doc.text(`Chapter ${i + 1}: ${chap.title} (${chap.wordCount} words)`, 20, tocY);
    tocY += 10;
  }

  // Chapters
  for (let i = 0; i < book.chapters.length; i++) {
    const chap = book.chapters[i];
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(`Chapter ${i + 1}: ${chap.title}`, 20, 25);
    doc.line(20, 30, 190, 30);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const bodyClean = chap.content.replace(/<[^>]*>?/gm, ' ');
    const splitBody = doc.splitTextToSize(bodyClean, 170);

    let startY = 40;
    for (let lineIdx = 0; lineIdx < splitBody.length; lineIdx++) {
      if (startY > 275) {
        doc.addPage();
        startY = 25;
      }
      doc.text(splitBody[lineIdx], 20, startY);
      startY += 6;
    }
  }

  doc.save(`${book.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'manuscript'}.pdf`);
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
