import type { NewPost } from '@api/types/api.interface';

/** Verified live against JSONPlaceholder (docs/EXPLORATION-FINDINGS.md 2.1 / 2.3). */
export const POSTS = {
  /** Total records in the collection. */
  expectedCount: 100,
  /** An id that exists. */
  existingId: 1,
  /**
   * The id a create returns: `expectedCount + 1`, computed per request rather than from a
   * sequence, so two consecutive creates return the same id.
   */
  fabricatedCreateId: 101,
} as const;

export const NEW_POST: NewPost = {
  title: 'QA automation post',
  body: 'Created by the API suite',
  userId: 1,
};
