import type { APIRequestContext } from '@playwright/test';

import type { ApiResponse, NewPost, Post } from '@api/types/api.interface';
import { BaseApiUtil } from './base-api.util';

/**
 * Domain utility for the `/posts` resource.
 *
 * Extends `BaseApiUtil` so the HTTP verbs, JSON parsing and request logging stay in one place;
 * this class only knows the paths and shapes that `/posts` uses.
 */
export class PostApiUtil extends BaseApiUtil {
  private static readonly COLLECTION_PATH = '/posts';

  constructor(request: APIRequestContext) {
    super(request);
  }

  private postPath(postId: number | string): string {
    return `${PostApiUtil.COLLECTION_PATH}/${postId}`;
  }

  /** GET every post. */
  async getAllPosts(): Promise<ApiResponse<Post[]>> {
    return this.get<Post[]>(PostApiUtil.COLLECTION_PATH);
  }

  /** GET one post by id. */
  async getPost(postId: number | string): Promise<ApiResponse<Post>> {
    return this.get<Post>(this.postPath(postId));
  }

  /**
   * POST a new post. Returns 201 with the payload echoed plus a fabricated id.
   *
   * ⚠️ The record is NOT persisted — a follow-up GET on the returned id yields 404
   * (docs/EXPLORATION-FINDINGS.md 2.3).
   */
  async createPost(newPost: NewPost): Promise<ApiResponse<Post>> {
    return this.post<Post>(PostApiUtil.COLLECTION_PATH, newPost);
  }
}
