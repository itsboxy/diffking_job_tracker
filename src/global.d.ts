/// <reference types="node" />

interface ElectronAPI {
  readJobs: () => string | null;
  writeJobs: (data: string) => void;
  generatePDF: (html: string, jobId: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  print: (html: string) => Promise<{ success: boolean; error?: string }>;
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
