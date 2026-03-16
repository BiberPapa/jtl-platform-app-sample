const configuredApiUrl: unknown = import.meta.env.VITE_API_URL;

export const apiUrl = typeof configuredApiUrl === 'string' && configuredApiUrl.length > 0 ? configuredApiUrl : 'http://localhost:50143';
export const appModes = ['setup', 'erp', 'pane'] as const;
