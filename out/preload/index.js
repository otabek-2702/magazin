"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  // Add your preload API here
});
