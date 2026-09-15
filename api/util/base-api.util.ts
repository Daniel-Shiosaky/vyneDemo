import type { APIRequestContext, APIResponse } from '@playwright/test';

import { ENV } from '@shared/const/env.const';
import type { ApiResponse } from '@api/types/api.interface';

/** Statuses this API actually returns, named so assertions read clearly. */
export const HTTP = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Shared HTTP plumbing for the API layer: the four verbs, JSON parsing, and optional logging.
 *
 * Domain utilities extend this rather than calling `APIRequestContext` directly, so no spec
 * repeats `await response.json()` with its own error handling, and headers, base URL or
 * logging can change in one place.
 *
 * Base URL and default headers come from `playwright.config.ts` (`use.baseURL` and
 * `use.extraHTTPHeaders`), which is why they are not re-declared here - one source of truth.
 *
 * Note there is deliberately no automatic "throw on unsuccessful response". Many tests here
 * assert 404 and 500 on purpose, so failing fast would fight the suite. Use
 * `assertSuccessful()` explicitly when a non-2xx genuinely means the test cannot continue.
 */
export abstract class BaseApiUtil {
  constructor(protected readonly request: APIRequestContext) {}

  protected async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.send<T>('GET', path, () => this.request.get(path));
  }

  protected async post<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('POST', path, () => this.request.post(path, { data }));
  }

  protected async put<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('PUT', path, () => this.request.put(path, { data }));
  }

  protected async patch<T>(path: string, data: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('PATCH', path, () => this.request.patch(path, { data }));
  }

  protected async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.send<T>('DELETE', path, () => this.request.delete(path));
  }

  /** Runs the call, logs it when enabled, and parses the body. */
  private async send<T>(
    method: string,
    path: string,
    call: () => Promise<APIResponse>,
  ): Promise<ApiResponse<T>> {
    const response = await call();
    const parsed = await this.parse<T>(response);

    if (ENV.API_DEBUG) {
      // eslint-disable-next-line no-console -- opt-in debugging aid, off by default
      console.log(`[api] ${method} ${path} -> ${parsed.status}`);
    }
    return parsed;
  }

  /**
   * Parses a JSON body, tolerating an empty or non-JSON response.
   *
   * Necessary because several endpoints return an empty object or empty text - DELETE returns
   * `{}`, and so do 404s - and a bare `.json()` throws on empty text.
   */
  private async parse<T>(response: APIResponse): Promise<ApiResponse<T>> {
    const text = await response.text();
    let body: T;
    try {
      body = (text.length > 0 ? JSON.parse(text) : {}) as T;
    } catch {
      // Preserve the raw text so a caller can inspect a non-JSON error page.
      body = text as unknown as T;
    }
    return {
      response,
      status: response.status(),
      body,
      headers: response.headers(),
    };
  }

  /**
   * Throws when a response is not 2xx. For setup or preconditions where continuing past a
   * failure would only produce a confusing downstream error.
   */
  protected assertSuccessful<T>(result: ApiResponse<T>, context: string): ApiResponse<T> {
    if (!result.response.ok()) {
      throw new Error(
        `${context} failed with HTTP ${result.status}: ${JSON.stringify(result.body)}`,
      );
    }
    return result;
  }
}
