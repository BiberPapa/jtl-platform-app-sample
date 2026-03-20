import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
const platformUiAssetsDirectory = fileURLToPath(new URL('../../node_modules/@jtl-software/platform-ui-react/dist/assets/', import.meta.url));

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
  plugins: [tailwindcss(), react()],
});
