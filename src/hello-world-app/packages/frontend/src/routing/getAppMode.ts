import { appModes } from '../common/constants';

export type AppMode = (typeof appModes)[number];

export function getAppMode(pathname: string): AppMode | null {
  const normalizedPath = pathname.replace(/^\/+|\/+$/g, '');

  if (normalizedPath.length === 0) {
    return null;
  }

  return appModes.find(mode => mode === normalizedPath) ?? null;
}
