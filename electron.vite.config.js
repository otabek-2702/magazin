import { defineConfig } from 'electron-vite';
import { resolve } from 'path';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/main/index.js') // Adjust path if using JS
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload/index.js') // Adjust path if using JS
      }
    }
  },
  renderer: {
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
});
