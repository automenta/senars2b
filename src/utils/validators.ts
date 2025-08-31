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
export const ContentSchema = z
  .any()
  .refine((val) => val !== null && val !== undefined, {
    message: 'Content cannot be null or undefined',
  })
  .transform((val) => (typeof val === 'string' ? val : JSON.stringify(val)))
  .refine((val) => val.length > 0, {
    message: 'Content cannot be empty',
  })
  .refine((val) => val.length <= MAX_CONTENT_LENGTH, {
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

export const DerivationStampSchema = z.object({
  timestamp: z.number(),
  parent_ids: z.array(z.string()),
  schema_id: z.string(),
  module: z.string().optional(),
});

export const SemanticAtomSchema = z.object({
  id: z.string().uuid(),
  content: ContentSchema,
  embedding: z.array(z.number()),
  creationTime: z.number(),
  lastAccessTime: z.number(),
  meta: MetaSchema,
});

export const TaskMetadataSchema = z.object({
  status: z.enum([
    'pending',
    'awaiting_dependencies',
    'decomposing',
    'awaiting_subtasks',
    'ready_for_execution',
    'completed',
    'failed',
    'deferred',
  ]),
  priority_level: z.enum(['low', 'medium', 'high', 'critical']),
  dependencies: z.array(z.string()).optional(),
  deadline: z.number().optional(),
  estimated_effort: z.number().optional(),
  required_resources: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
  group_id: z.string().optional(),
  parent_id: z.string().optional(),
  subtasks: z.array(z.string()).optional(),
});

export const CognitiveItemSchema = z.object({
  id: z.string().uuid(),
  atom_id: z.string().uuid(),
  type: z.enum(['BELIEF', 'GOAL', 'QUERY', 'EVENT', 'TASK']),
  label: z.string(),
  content: ContentSchema.optional(),
  truth: TruthValueSchema.optional(),
  attention: AttentionValueSchema,
  meta: MetaSchema,
  goal_parent_id: z.string().optional(),
  goal_status: z
    .enum(['active', 'blocked', 'achieved', 'failed'])
    .optional(),
  stamp: DerivationStampSchema,
  payload: z.record(z.any()).optional(),
  task_metadata: TaskMetadataSchema.optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
});
