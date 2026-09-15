import { z } from 'zod';

/**
 * The response contract for a post, derived from live responses
 * (docs/EXPLORATION-FINDINGS.md 2.1).
 *
 * Kept out of the validator on purpose: this file describes what a post looks like, the validator
 * decides what to assert. `.strict()` catches unexpected new fields that a `toHaveProperty` check
 * would silently ignore.
 */
export const postSchema = z
  .object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    title: z.string(),
    body: z.string(),
  })
  .strict();
