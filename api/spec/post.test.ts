import { NEW_POST, POSTS } from '@api/data/const/post.const';
import { test } from '@api/fixtures';

/**
 * API journeys against `/posts`.
 *
 * Scoped deliberately: JSONPlaceholder is a mock server, so a full CRUD matrix across all six
 * resources produced a large number of tests that all proved the same handful of behaviours.
 * These four cover the ones that matter — read one, read many, create, and the fact that writes
 * are discarded.
 */
test.describe('API: Posts', () => {
  test('Verify a single post can be retrieved', async ({ postApi, postValidator }) => {
    const postResult = await postApi.getPost(POSTS.existingId);

    postValidator.verifyPostIsValid(postResult, POSTS.existingId);
  });

  test('Verify all posts can be retrieved', async ({ postApi, postValidator }) => {
    const collectionResult = await postApi.getAllPosts();

    postValidator.verifyPostCollectionIsValid(collectionResult);
  });

  test('Verify a post can be created', async ({ postApi, postValidator }) => {
    const createResult = await postApi.createPost(NEW_POST);

    postValidator.verifyPostWasCreated(createResult, NEW_POST);
  });

  test(
    'Verify a created post is not persisted by the mock server',
    { tag: '@fake-api' },
    async ({ postApi, postValidator }) => {
      // Documents a limitation of the application under test, not a defect in it: this is the
      // first test to rewrite if the suite is ever pointed at a real backend.
      const createResult = await postApi.createPost(NEW_POST);

      const readBackResult = await postApi.getPost(createResult.body.id);
      const collectionAfterCreate = await postApi.getAllPosts();

      postValidator.verifyCreatedPostWasNotPersisted(readBackResult, collectionAfterCreate);
    },
  );
});
