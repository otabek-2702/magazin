import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Add your preload API here
});
