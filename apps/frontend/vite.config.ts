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
  server: {
    port: 50142,
  },
  plugins,
});
