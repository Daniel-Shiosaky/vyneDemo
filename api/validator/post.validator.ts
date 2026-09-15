import { expect } from '@playwright/test';

import { POSTS } from '@api/data/const/post.const';
import { postSchema } from '@api/schema/post.schema';
import type { ApiResponse, NewPost, Post } from '@api/types/api.interface';
import { HTTP } from '@api/util/base-api.util';

/**
 * Assertions for `/posts` responses.
 *
 * Layer rule: every `expect()` for the API suite lives here. Specs describe the request sequence;
 * this class judges the results.
 */
export class PostValidator {
  /** 200 and a body that satisfies the post contract. */
  verifyPostIsValid(result: ApiResponse<Post>, expectedId: number): void {
    expect(result.status).toBe(HTTP.OK);

    const post = this.parseOrFail(result.body, `posts/${expectedId}`);
    expect(post.id).toBe(expectedId);
    expect(post.title.length).toBeGreaterThan(0);
    expect(post.body.length).toBeGreaterThan(0);
  }

  /**
   * 200, the exact expected record count, unique ids, and every record contract-valid.
   *
   * Validates the whole collection rather than a sample: a single malformed row deep in the list
   * is exactly what a spot check misses.
   */
  verifyPostCollectionIsValid(result: ApiResponse<Post[]>): void {
    expect(result.status).toBe(HTTP.OK);
    expect(result.body).toHaveLength(POSTS.expectedCount);

    result.body.forEach((post, postIndex) => {
      this.parseOrFail(post, `posts[${postIndex}]`);
    });

    const postIds = result.body.map((post) => post.id);
    expect(new Set(postIds).size).toBe(postIds.length);
  }

  /** 201, the submitted fields echoed back, an assigned id, and a matching Location header. */
  verifyPostWasCreated(result: ApiResponse<Post>, submittedPost: NewPost): void {
    expect(result.status).toBe(HTTP.CREATED);
    expect(result.body).toMatchObject({ ...submittedPost });
    expect(result.body.id).toBe(POSTS.fabricatedCreateId);

    expect(result.headers['location']).toContain(`/posts/${POSTS.fabricatedCreateId}`);
    expect(result.headers['content-type']).toContain('application/json');
  }

  /**
   * The id a create returned is not retrievable, and the collection has not grown.
   *
   * JSONPlaceholder is a mock: it accepts writes and discards them. On a real API this would be
   * 200 with the new record, so this assertion is the opposite of what a production suite wants -
   * hence the `@fake-api` tag on the test that calls it.
   */
  verifyCreatedPostWasNotPersisted(
    readBackResult: ApiResponse<Post>,
    collectionAfterCreate: ApiResponse<Post[]>,
  ): void {
    expect(readBackResult.status).toBe(HTTP.NOT_FOUND);
    expect(collectionAfterCreate.body).toHaveLength(POSTS.expectedCount);
  }

  /** Runs the contract, throwing a readable error listing every problem. */
  private parseOrFail(payload: unknown, context: string): Post {
    const parseResult = postSchema.safeParse(payload);

    if (!parseResult.success) {
      const issues = parseResult.error.issues
        .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(
        `Schema validation failed for ${context}:\n${issues}\n\n` +
          `Received: ${JSON.stringify(payload)}`,
      );
    }
    return parseResult.data;
  }
}
