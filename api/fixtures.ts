import { test as base } from '@playwright/test';

import { PostApiUtil } from '@api/util/post-api.util';
import { PostValidator } from '@api/validator/post.validator';

/**
 * Injects the API utility and validator, mirroring how page objects and validators are injected
 * on the UI side. Specs never touch `request` directly.
 */
export interface ApiFixtures {
  postApi: PostApiUtil;
  postValidator: PostValidator;
}

export const test = base.extend<ApiFixtures>({
  postApi: async ({ request }, use) => {
    await use(new PostApiUtil(request));
  },
  // The validator is stateless, so it depends on no other fixture. Playwright requires the first
  // argument to be an object destructuring pattern, so it has to be `{}` here.
  // eslint-disable-next-line no-empty-pattern
  postValidator: async ({}, use) => {
    await use(new PostValidator());
  },
});

export { expect } from '@playwright/test';
