import type { Response } from 'express';

export type ProxyResponseBody = Buffer | string | null;

export type ProxyResponse = {
  body: ProxyResponseBody;
  headers: Headers;
  status: number;
};

export function sendProxyResponse(response: ProxyResponse, res: Response): void {
  res.status(response.status);

  if (response.body === null) {
    res.end();
    return;
  }

  res.send(response.body);
}
