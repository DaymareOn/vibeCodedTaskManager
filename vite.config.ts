import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin – starts the exchange-rate backend server (`server.js`) when
 * the Vite dev server starts, and kills it when Vite exits.
 * Active in both dev mode (`configureServer`) and preview mode
 * (`configurePreviewServer`), so `npm run preview` / `npm run prod` also
 * benefit from the backend proxy.
 */
function backendServerPlugin() {
  function startBackend() {
    const serverPath = path.resolve(__dirname, 'server.js');
    const proc = spawn('node', [serverPath], { stdio: 'inherit', shell: false });

    proc.on('error', (err) => {
      console.error('[vite-plugin] Failed to start backend server:', err.message);
    });

    const cleanup = () => {
      if (!proc.killed) proc.kill();
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  return {
    name: 'start-backend-server',
    configureServer() {
      startBackend();
    },
    configurePreviewServer() {
      startBackend();
    },
  };
}

export default defineConfig({
  plugins: [backendServerPlugin()],
  server: {
    proxy: {
      // Forward /api/* from the Vite dev server to the backend.
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    proxy: {
      // Forward /api/* from the Vite preview server to the backend.
      '/api': 'http://localhost:3001',
    },
  },
});
