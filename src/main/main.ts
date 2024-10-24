/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as fs from 'fs/promises';
import * as url from 'url';
import { stringifySync } from 'subtitle';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const dataFilePath = path.join(app.getPath('userData'), 'appState.json');

const readAppState = async () => {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('Errore durante la lettura dello stato:', error);
    return null;
  }
};

// Funzione per salvare lo stato
const saveAppState = async (state: any) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.log('Errore durante il salvataggio dello stato:', error);
  }
};

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.handle('getAppState', async () => {
  return await readAppState();
});

ipcMain.handle('setAppState', async (event, appState) => {
  await saveAppState(appState);
});

ipcMain.handle('selectFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: 'Video Files',
        extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm'],
      },
    ],
  });

  if (!canceled && filePaths.length > 0) {
    // Converte il file path in un URI nel formato file://
    const fileUri = url.pathToFileURL(filePaths[0]).href;
    return fileUri; // Restituisci l'URI file://
  }
  return null; // L'utente ha cancellato la selezione
});

ipcMain.handle('export-subtitles', async (event, subtitles: Subtitle[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });

  const list = [];

  list.push({
    type: 'cue',
    data: {
      start: 1200,
      end: 1300,
      text: 'Something',
    },
  });

  console.log('stringggg:', stringifySync(list, { format: 'WebVTT' }));

  if (!result.canceled) {
    const folderPath = result.filePaths[0];

    // Funzione per salvare sottotitoli in modo asincrono
    const saveSubtitlesForLanguage = async (
      language: 'english' | 'french' | 'arabic',
      filename: string,
    ) => {
      const languageSubtitles = subtitles
        .filter((i) => i.start && i.end)
        .map((sub) => ({
          type: 'cue',
          data: {
            start: parseFloat(sub.start) * 1000, // Converti secondi in millisecondi
            end: parseFloat(sub.end) * 1000,
            text: sub[language], // Testo nella lingua specifica
          },
        }));

      //  console.log('languageSubtitles', languageSubtitles);
      const vttContent = stringifySync(languageSubtitles, { format: 'WebVTT' });
      //  console.log('vttContent', vttContent);
      const filePath = path.join(folderPath, filename);

      // Usa writeFile per salvare i file
      await fs.writeFile(filePath, vttContent, 'utf-8'); // Scrittura asincrona
    };

    // Salva i file per ogni lingua in modo asincrono
    await saveSubtitlesForLanguage('english', 'subtitles_english.vtt');
    await saveSubtitlesForLanguage('french', 'subtitles_french.vtt');
    await saveSubtitlesForLanguage('arabic', 'subtitles_arabic.vtt');

    return { success: true, folderPath };
  } else {
    return { success: false };
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
