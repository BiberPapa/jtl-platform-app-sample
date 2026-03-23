import type { RequestHandler } from 'express';
import { getAppInfo } from '../services/appInfo.js';

export const appInfoHandler: RequestHandler = (_req, res) => {
  res.status(200).json(getAppInfo());
};
