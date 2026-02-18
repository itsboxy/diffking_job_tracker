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

  // Auto-update
  onUpdateAvailable: (callback: (info: { version: string }) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, (_event, info) => callback(info)),
  onUpdateProgress: (callback: (info: { percent: number }) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS, (_event, info) => callback(info)),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_DOWNLOADED, () => callback()),
  onUpdateError: (callback: (info: { message: string }) => void) =>
    ipcRenderer.on(IPC_CHANNELS.UPDATE_ERROR, (_event, info) => callback(info)),
  startUpdateDownload: () => ipcRenderer.send(IPC_CHANNELS.UPDATE_START_DOWNLOAD),
  installUpdate: () => ipcRenderer.send(IPC_CHANNELS.UPDATE_INSTALL),
  checkForUpdates: () => ipcRenderer.send(IPC_CHANNELS.UPDATE_CHECK),
});

// Provide a minimal process shim for browser-only renderer bundles.
contextBridge.exposeInMainWorld('process', {
  env: {
    NODE_ENV: 'production',
  },
});
