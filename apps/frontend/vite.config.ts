import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type PluginOption } from 'vite';

const platformUiAssetsDirectory = fileURLToPath(new URL('../../node_modules/@jtl-software/platform-ui-react/dist/assets/', import.meta.url));
const plugins: PluginOption[] = [tailwindcss(), react()];
const defaultDevPort = 6142;
const fallbackDevPort = 5173;

const parsePort = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }

  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid Vite dev server port: ${value}`);
  }

  return port;
};

const canListenOnPort = async (port: number): Promise<boolean> =>
  new Promise(resolve => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, '127.0.0.1');
  });

const resolveDevPort = async (mode: string): Promise<number> => {
  const env = loadEnv(mode, process.cwd(), '');
  const configuredPort = parsePort(env['VITE_DEV_PORT'] ?? env['PORT']);

  if (configuredPort !== undefined) {
    return configuredPort;
  }

  if (await canListenOnPort(defaultDevPort)) {
    return defaultDevPort;
  }

  return fallbackDevPort;
};

export default defineConfig(async ({ mode }) => ({
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
        manualChunks(id: string) {
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
    port: await resolveDevPort(mode),
  },
  plugins,
}));
