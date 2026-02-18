import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { WINDOW_CONFIG, IPC_CHANNELS } from './constants/config';

let mainWindow: BrowserWindow | null;
const getDataFilePath = () => path.join(app.getPath('userData'), 'jobs.json');

const getProfileName = () => {
    const arg = process.argv.find((entry) => entry.startsWith('--profile='));
    if (!arg) {
        return 'default';
    }
    const value = arg.split('=')[1]?.trim();
    return value ? value : 'default';
};

const profileName = getProfileName();
app.setPath('userData', path.join(app.getPath('appData'), 'Diff-King-Job-Tracker', profileName));
const cacheRoot = path.join(app.getPath('temp'), 'Diff-King-Job-Tracker', profileName, 'Cache');
app.setPath('cache', cacheRoot);
try {
    fs.mkdirSync(cacheRoot, { recursive: true });
} catch (error) {
    console.warn('Unable to create cache directory', error);
}
app.commandLine.appendSwitch('disk-cache-dir', cacheRoot);
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-cache');

const createWindow = () => {
    const iconCandidates = [
        path.join(__dirname, 'assets', 'diffking-icon.ico'),
        path.join(__dirname, 'assets', 'diffking-icon.png'),
        path.join(__dirname, 'assets', 'diffking-icon.svg'),
    ];
    const iconPath = iconCandidates.find((candidate) => fs.existsSync(candidate));

    mainWindow = new BrowserWindow({
        width: WINDOW_CONFIG.DEFAULT_WIDTH,
        height: WINDOW_CONFIG.DEFAULT_HEIGHT,
        ...(iconPath ? { icon: iconPath } : {}),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', errorCode, errorDescription, validatedURL)    });
};

const createPrintWindow = async (html: string, show: boolean) => {
    const printWindow = new BrowserWindow({
        width: WINDOW_CONFIG.PRINT_WIDTH,
        height: WINDOW_CONFIG.PRINT_HEIGHT,
        show,
        autoHideMenuBar: false,
        ...(mainWindow ? { parent: mainWindow, modal: show } : {}),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const tempDir = app.getPath('temp');
    const tempFile = path.join(
        tempDir,
        `diff-king-print-${Date.now()}-${Math.random().toString(16).slice(2)}.html`
    );
    fs.writeFileSync(tempFile, html, 'utf-8');

    await printWindow.loadFile(tempFile);

    const printMenu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Print',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => {
                        printWindow.webContents.print({ printBackground: true, silent: false });
                    },
                },
                { type: 'separator' },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => printWindow.close(),
                },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' },
            ],
        },
    ]);
    printWindow.setMenu(printMenu);
    await new Promise<void>((resolve) => {
        if (printWindow.webContents.isLoading()) {
            printWindow.webContents.once('did-finish-load', () => resolve());
        } else {
            resolve();
        }
    });

    if (show) {
        printWindow.once('ready-to-show', () => printWindow.show());
    }

    return { printWindow, tempFile };
};

app.whenReady().then(() => {
    ipcMain.on(IPC_CHANNELS.JOBS_READ, (event) => {
        try {
            const dataFile = getDataFilePath();
            if (!fs.existsSync(dataFile)) {
                event.returnValue = null;
                return;
            }
            event.returnValue = fs.readFileSync(dataFile, 'utf-8');
        } catch (error) {
            console.error('Unable to read jobs file', error);
            event.returnValue = null;
        }
    });

    ipcMain.on(IPC_CHANNELS.JOBS_WRITE, (_event, payload) => {
        try {
            const dataFile = getDataFilePath();
            fs.writeFileSync(dataFile, payload, 'utf-8');
        } catch (error) {
            console.error('Unable to write jobs file', error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.JOB_PDF, async (_event, payload) => {
        const { html, jobId } = payload as { html: string; jobId: string };
        const { printWindow, tempFile } = await createPrintWindow(html, false);
        try {
            const pdfBuffer = await printWindow.webContents.printToPDF({
                printBackground: true,
            });
            const defaultDir = path.join(app.getPath('documents'), 'Diff-King');
            fs.mkdirSync(defaultDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const defaultPath = path.join(defaultDir, `Job-${jobId}-${timestamp}.pdf`);

            fs.writeFileSync(defaultPath, pdfBuffer);
            shell.showItemInFolder(defaultPath);
            return { success: true, path: defaultPath };
        } catch (error) {
            console.error('Unable to create PDF', error);
            return { success: false, error: (error as Error).message };
        } finally {
            try {
                fs.unlinkSync(tempFile);
            } catch (error) {
                console.warn('Unable to delete temp print file', error);
            }
            printWindow.destroy();
        }
    });

    ipcMain.handle(IPC_CHANNELS.JOB_PRINT, async (_event, payload) => {
        const { html } = payload as { html: string };
        const { printWindow, tempFile } = await createPrintWindow(html, true);
        try {
            printWindow.show();
            printWindow.focus();
            printWindow.setAlwaysOnTop(true, 'modal-panel');
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Print timed out'));
                }, 15000);
                printWindow.webContents.print({ printBackground: true, silent: false }, (success, errorType) => {
                    clearTimeout(timeout);
                    if (!success) {
                        reject(new Error(errorType || 'Print failed'));
                        return;
                    }
                    resolve();
                });
            });
            printWindow.setAlwaysOnTop(false);
            return { success: true };
        } catch (error) {
            console.error('Unable to print job', error);
            return { success: false, error: (error as Error).message };
        } finally {
            try {
                printWindow.setAlwaysOnTop(false);
            } catch (error) {
                // ignore
            }
            try {
                fs.unlinkSync(tempFile);
            } catch (error) {
                console.warn('Unable to delete temp print file', error);
            }
            printWindow.destroy();
        }
    });

    // Auto-update IPC handlers
    // Track whether the user explicitly requested a download so we can
    // distinguish download failures from silent background-check failures.
    let updateDownloadRequested = false;

    ipcMain.on(IPC_CHANNELS.UPDATE_START_DOWNLOAD, () => {
        updateDownloadRequested = true;
        autoUpdater.downloadUpdate().catch((err) => {
            console.error('Failed to start update download:', err);
            updateDownloadRequested = false;
            if (mainWindow) {
                mainWindow.webContents.send(IPC_CHANNELS.UPDATE_ERROR, {
                    message: err?.message || 'Failed to start download',
                });
            }
        });
    });

    ipcMain.on(IPC_CHANNELS.UPDATE_INSTALL, () => {
        autoUpdater.quitAndInstall();
    });

    // Allow the renderer to trigger a manual re-check
    ipcMain.on(IPC_CHANNELS.UPDATE_CHECK, () => {
        autoUpdater.checkForUpdates().catch((err) => {
            console.warn('Manual update check failed:', err?.message ?? err);
        });
    });

    createWindow();

    // Auto-update setup
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('update-not-available', () => {
        console.log('No update available — app is up to date');
        updateDownloadRequested = false;
    });

    autoUpdater.on('update-available', (info) => {
        console.log('Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, {
                version: info.version,
            });
        }
    });

    autoUpdater.on('download-progress', (progress) => {
        if (mainWindow) {
            mainWindow.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS, {
                percent: Math.round(progress.percent),
            });
        }
    });

    autoUpdater.on('update-downloaded', () => {
        updateDownloadRequested = false;
        if (mainWindow) {
            mainWindow.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED);
        }
    });

    autoUpdater.on('error', (error) => {
        console.error('Auto-update error:', error?.message ?? error);
        // Only notify the renderer when the user actively requested a download.
        // Background check failures (network unavailable, 404 for latest.yml, etc.)
        // are logged but otherwise silent so as not to show spurious error banners.
        if (updateDownloadRequested && mainWindow) {
            updateDownloadRequested = false;
            mainWindow.webContents.send(IPC_CHANNELS.UPDATE_ERROR, {
                message: error?.message || 'Update failed',
            });
        }
    });

    // Check for updates 8 seconds after launch, then every 4 hours
    const runUpdateCheck = () => {
        autoUpdater.checkForUpdates().catch((err) => {
            console.warn('Update check failed:', err?.message ?? err);
        });
    };
    setTimeout(runUpdateCheck, 8000);
    setInterval(runUpdateCheck, 4 * 60 * 60 * 1000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});