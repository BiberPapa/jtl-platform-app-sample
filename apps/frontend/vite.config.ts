import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, type PluginOption } from 'vite';

const platformUiAssetsDirectory = fileURLToPath(new URL('../../node_modules/@jtl-software/platform-ui-react/dist/assets/', import.meta.url));
const plugins: PluginOption[] = [tailwindcss(), react()];

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^\/assets\//,
        replacement: `${platformUiAssetsDirectory.replaceAll('\\', '/')}/`,
      },
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('@graphiql/plugin-explorer')) {
            return 'vendor-graphiql-explorer';
          }

          if (id.includes('graphiql')) {
            return 'vendor-graphiql';
          }

          if (id.includes('swagger-ui-react')) {
            return 'vendor-swagger';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 50142,
  },
  plugins,
});
