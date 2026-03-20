import dotenv from 'dotenv';
import { createApp } from './app.js';
import { getConfiguredProxyLogLevel, logger } from './logger.js';

dotenv.config();

const PORT = 50143;

export { createApp } from './app.js';

export const app = createApp();

if (!process.env.VITEST) {
  app.listen(PORT, () => {
    logger.info(
      {
        event: 'server_started',
        port: PORT,
        proxyLogLevel: getConfiguredProxyLogLevel(),
      },
      `Server running on http://localhost:${PORT}`,
    );
  });
}
