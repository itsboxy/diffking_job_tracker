import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './constants/config';

// Expose safe IPC methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  readJobs: () => ipcRenderer.sendSync(IPC_CHANNELS.JOBS_READ),
  writeJobs: (data: string) => ipcRenderer.send(IPC_CHANNELS.JOBS_WRITE, data),
  generatePDF: (html: string, jobId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.JOB_PDF, { html, jobId }),
  print: (html: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.JOB_PRINT, { html }),
});

// Provide a minimal process shim for browser-only renderer bundles.
contextBridge.exposeInMainWorld('process', {
  env: {
    NODE_ENV: 'production',
  },
});

declare global {
  interface Window {
    electronAPI: {
      readJobs: () => string | null;
      writeJobs: (data: string) => void;
      generatePDF: (html: string, jobId: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      print: (html: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}
