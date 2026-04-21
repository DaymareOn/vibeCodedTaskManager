import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin – starts the exchange-rate backend server (`server.js`) when
 * the Vite dev server starts, and kills it when Vite exits.
 * Only active in dev mode (`configureServer` is not called by `vite build`
 * or `vite preview`).
 */
function backendServerPlugin() {
  return {
    name: 'start-backend-server',
    configureServer() {
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
});
