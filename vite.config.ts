import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const devPort = Number(process.env.PORT) || 5180;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-crossorigin-for-electron',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '').replace(/crossorigin=""/g, '').replace(/crossorigin/g, '');
      }
    }
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '127.0.0.1',
    port: devPort,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
