import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appInfoHandler } from './appInfoRoute.js';

const { getAppInfoMock } = vi.hoisted(() => ({
  getAppInfoMock: vi.fn(),
}));

vi.mock('../services/appInfo.js', () => ({
  getAppInfo: getAppInfoMock,
}));

describe('appInfoHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns app info from the service with HTTP 200', () => {
    getAppInfoMock.mockReturnValue({
      environment: 'qa',
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });

    const response = createResponseMock();

    appInfoHandler({} as never, response as never, vi.fn() as never);

    expect(getAppInfoMock).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      environment: 'qa',
      hubUrl: 'https://hub.qa.jtl-cloud.com',
      cloudErpUrl: 'https://erp.qa.jtl-cloud.com',
      apiBaseUrl: 'https://api.qa.jtl-cloud.com',
      authUrl: 'https://auth.qa.jtl-cloud.com/oauth2/token',
    });
  });
});

function createResponseMock(): Pick<Response, 'json' | 'status'> {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);

  return response;
}
