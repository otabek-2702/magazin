"use strict";
const electron = require("electron");
const path = require("path");
let mainWindow;
const createWindow = () => {
  mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      // Adjust path if using JS
      contextIsolation: true
    }
  });
  mainWindow.loadURL("https://magazin-dev.vercel.app");
};
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
