import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    async configureServer(server) {
      const { app } = await server.ssrLoadModule('./apps/api/src/app.ts');
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api') || url.startsWith('/health')) {
          return app(req, res, next);
        }
        next();
      });
    },
  };
}

export default defineConfig(({ command }) => {
  return {
    // The Express bridge is development-only. Loading it during a production
    // build makes Node resolve the workspace TypeScript config package before
    // Vite can transform it.
    plugins: command === 'serve'
      ? [react(), tailwindcss(), expressApiPlugin()]
      : [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@piercyn/db': path.resolve(__dirname, './packages/db/src'),
        '@piercyn/types': path.resolve(__dirname, './packages/types/src'),
        '@piercyn/config': path.resolve(__dirname, './packages/config/src'),
        '@piercyn/utils': path.resolve(__dirname, './packages/utils/src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
