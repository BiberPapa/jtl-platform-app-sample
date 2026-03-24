import dotenv from 'dotenv';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { logServerStarted, logServerStarting, registerServerLifecycle } from './serverLifecycle.js';

dotenv.config();

const PORT = 6143;

export { createApp } from './app.js';

export const app = createApp();

if (!process.env.VITEST) {
  logServerStarting(PORT, logger, process.pid);
  const server = app.listen(PORT, () => {
    logServerStarted(PORT, logger, process.pid);
  });

  registerServerLifecycle(server, logger);
}
