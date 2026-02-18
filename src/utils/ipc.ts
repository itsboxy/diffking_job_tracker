// Check if electronAPI is available (provided by preload script)
const isElectronAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'electronAPI' in window;
};

export const readJobsFile = (): string | null => {
  if (!isElectronAvailable()) {
    return null;
  }

  try {
    return window.electronAPI.readJobs();
  } catch (error) {
    console.error('Failed to read jobs file:', error);
    return null;
  }
};

export const writeJobsFile = (data: string): boolean => {
  if (!isElectronAvailable()) {
    return false;
  }

  try {
    window.electronAPI.writeJobs(data);
    return true;
  } catch (error) {
    console.error('Failed to write jobs file:', error);
    return false;
  }
};

export const generateJobPDF = async (html: string, jobId: string): Promise<{
  success: boolean;
  path?: string;
  error?: string;
}> => {
  if (!isElectronAvailable()) {
    return { success: false, error: 'IPC not available' };
  }

  try {
    return await window.electronAPI.generatePDF(html, jobId);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const printJob = async (html: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  if (!isElectronAvailable()) {
    return { success: false, error: 'IPC not available' };
  }

  try {
    return await window.electronAPI.print(html);
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};
