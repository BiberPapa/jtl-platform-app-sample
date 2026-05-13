import type { AppBridgeClient } from './appBridgeClient';
import { getCachedSessionToken, invalidateSessionTokenCache } from './sessionTokenCache';

type CloudApiRequestOptions = {
    url: string;
    appBridgeClient: AppBridgeClient;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
    body?: string;
};

type SuccessResponse<T> = {
    ok: true;
    status: number;
    headers: Headers;
    data?: T;
    error?: never;
};

type ErrorResponse = {
    ok: false;
    status: number;
    headers: Headers;
    data?: never;
    error: string;
};

export type CloudApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Generic client for JTL Cloud Platform APIs (auth.jtl-cloud.com, api.jtl-cloud.com)
 * Uses Bearer Token authentication from AppBridge, with automatic caching and refresh.
 */
export async function requestCloudApi<T>({ url, appBridgeClient, method = 'GET', body }: CloudApiRequestOptions): Promise<CloudApiResponse<T>> {
    return performRequest({
        url,
        appBridgeClient,
        method,
        ...(body !== undefined && { body }),
    });
}

async function performRequest<T>(options: CloudApiRequestOptions & { retryCount?: number }): Promise<CloudApiResponse<T>> {
    const { url, appBridgeClient, method = 'GET', body, retryCount = 0 } = options;

    try {
        const sessionToken = await getCachedSessionToken(appBridgeClient);

        if (!sessionToken) {
            return {
                ok: false,
                status: 401,
                headers: new Headers(),
                error: 'No session token available',
            } as ErrorResponse;
        }

        const requestInit: RequestInit = {
            method,
            headers: {
                Authorization: `Bearer ${sessionToken}`,
            },
        };

        if (body !== undefined) {
            requestInit.body = body;
            requestInit.headers = {
                ...requestInit.headers,
                'Content-Type': 'application/json',
            };
        }

        const response = await fetch(url, requestInit);
        const text = method === 'HEAD' || response.status === 204 ? '' : await response.text();
        const data = parseJsonResponse<T>(text);

        // On 401, invalidate cache and retry once with fresh token
        if (response.status === 401 && retryCount === 0) {
            invalidateSessionTokenCache();
            return performRequest({ ...options, retryCount: 1 });
        }

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                headers: response.headers,
                error: text || `HTTP ${response.status}`,
            } as ErrorResponse;
        }

        // Build success response
        const result: SuccessResponse<T> = {
            ok: true,
            status: response.status,
            headers: response.headers,
        };
        if (data !== undefined) {
            result.data = data;
        }
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
            ok: false,
            status: 0,
            headers: new Headers(),
            error: message,
        } as ErrorResponse;
    }
}

function parseJsonResponse<T>(responseText: string): T | undefined {
    if (!responseText) {
        return undefined;
    }

    try {
        return JSON.parse(responseText) as T;
    } catch {
        return undefined;
    }
}
