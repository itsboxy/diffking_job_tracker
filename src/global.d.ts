/// <reference types="node" />

interface ElectronAPI {
  readJobs: () => string | null;
  writeJobs: (data: string) => void;
  generatePDF: (html: string, jobId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  print: (html: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateAvailable: (callback: (info: { version: string }) => void) => void;
  onUpdateProgress: (callback: (info: { percent: number }) => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  onUpdateError: (callback: (info: { message: string }) => void) => void;
  startUpdateDownload: () => void;
  installUpdate: () => void;
  checkForUpdates: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    process?: {
      env?: Record<string, string>;
    };
  }
}

export {};
