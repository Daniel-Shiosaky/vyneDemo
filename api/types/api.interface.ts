import type { APIResponse } from '@playwright/test';

/**
 * A response paired with its parsed JSON body.
 *
 * Both are exposed because API tests routinely assert on the status AND the body, and because
 * several JSONPlaceholder endpoints return `{}` where a body would be expected.
 */
export interface ApiResponse<TBody> {
  readonly response: APIResponse;
  readonly status: number;
  readonly body: TBody;
  readonly headers: Record<string, string>;
}

/** A blog post as returned by `/posts`. */
export interface Post {
  readonly id: number;
  readonly userId: number;
  readonly title: string;
  readonly body: string;
}

/** The fields accepted when creating a post. */
export interface NewPost {
  readonly title: string;
  readonly body: string;
  readonly userId: number;
}
