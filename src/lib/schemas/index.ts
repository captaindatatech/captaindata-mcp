/**
 * Tool input schemas
 * 
 * This module re-exports tool schemas from the centralized types module.
 * For new code, import directly from '../../types' instead.
 */

export { TOOL_SCHEMAS } from '../../types';

// Re-export validation function for backwards compatibility
import { TSchema } from '@sinclair/typebox';

/**
 * Validation function to ensure schemas follow MCP best practices
 */
export function validateToolSchema(schema: { description: string; parameters: TSchema }): boolean {
  // Check required fields
  if (!schema.description || typeof schema.description !== 'string') {
    throw new Error('Schema must have a description string');
  }
  
  if (!schema.parameters || typeof schema.parameters !== 'object') {
    throw new Error('Schema must have parameters object');
  }
  
  return true;
}
