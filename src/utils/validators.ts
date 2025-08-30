import { z } from 'zod';
import { MAX_CONTENT_LENGTH } from './constants';

/**
 * Schema for validating TruthValue objects.
 * Ensures frequency and confidence are numbers between 0 and 1.
 */
export const TruthValueSchema = z.object({
  frequency: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

/**
 * Schema for validating AttentionValue objects.
 * Ensures priority and durability are numbers between 0 and 1.
 */
export const AttentionValueSchema = z.object({
  priority: z.number().min(0).max(1),
  durability: z.number().min(0).max(1),
});

/**
 * Schema for validating content inputs.
 * Ensures content is a non-empty string with a max length.
 * It can also be an object, which will be stringified for length checks.
 */
export const ContentSchema = z.any()
  .refine(val => val !== null && val !== undefined, {
    message: 'Content cannot be null or undefined',
  })
  .transform(val => typeof val === 'string' ? val : JSON.stringify(val))
  .refine(val => val.length > 0, {
    message: 'Content cannot be empty',
  })
  .refine(val => val.length <= MAX_CONTENT_LENGTH, {
    message: `Content is too long (maximum ${MAX_CONTENT_LENGTH} characters)`,
  });

/**
 * Schema for validating the metadata object.
 */
export const MetaSchema = z.record(z.any()).optional();

/**
 * Combined schema for adding a new belief.
 */
export const AddBeliefSchema = z.object({
  content: ContentSchema,
  truth: TruthValueSchema,
  attention: AttentionValueSchema,
  meta: MetaSchema,
});

/**
 * Combined schema for adding a new goal.
 */
export const AddGoalSchema = z.object({
  content: ContentSchema,
  attention: AttentionValueSchema,
  meta: MetaSchema,
});

/**
 * Combined schema for adding a new schema.
 */
export const AddSchemaSchema = z.object({
    content: ContentSchema,
    meta: MetaSchema,
});
