/**
 * This file defines the specific types that can be used for the `content`
 * property of a CognitiveItem. Using a discriminated union helps ensure
 * type safety when working with different kinds of cognitive content.
 */
import { TruthValue } from './types';
import { ComponentMetrics } from '../modules/selfRepresentationModule';

// Content for a schema, containing its name and apply function
export interface ContentSchema {
  type: 'schema';
  name: string;
  // Note: Using Function is not ideal, but better than 'any'.
  // A more specific function signature could be used if known.
  apply: Function;
}

// Content representing a system insight, e.g., from the reflection loop
export interface ContentInsight {
  type: 'insight';
  insightType: string;
  label: string;
  analyzedBelief: string;
}

export interface ContentSystemComponent {
  type: 'system_component';
  name: string;
  description: string;
  responsibilities: string[];
  dependencies: string[];
  capabilities: string[];
  metrics?: ComponentMetrics;
}

export interface ContentTestSchema {
  type: 'test_schema';
  name: string;
  pattern: {
    premise: string;
    conclusion: string;
  };
}

export interface ContentHistory {
  type: 'history';
  historicalRecordFor: string;
  recordedTruth: TruthValue;
  timestamp: number;
}

// The discriminated union for all possible CognitiveItem content types
export type CognitiveContent =
  | string
  | ContentSchema
  | ContentInsight
  | ContentSystemComponent
  | ContentTestSchema
  | ContentHistory
  | undefined;
