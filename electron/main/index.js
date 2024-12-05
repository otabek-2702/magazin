import { app, BrowserWindow } from 'electron';
import path from 'path';

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'), // Adjust path if using JS
      contextIsolation: true,
    },
  });


  mainWindow.loadURL('https://magazin-dev.vercel.app');

  // if (process.env.VITE_DEV_SERVER_URL) {
  //   mainWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL);
  // } else {
  //   mainWindow.loadFile('index.html');
  // }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
