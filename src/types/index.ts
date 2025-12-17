// ============================================================================
// CAPTAIN DATA MCP - UNIFIED TYPE DEFINITIONS
// ============================================================================
// All types are defined using TypeBox, providing both TypeScript types and
// JSON Schema definitions from a single source of truth.
// ============================================================================

// Re-export TypeBox utilities for convenience
export { Type, Static } from '@sinclair/typebox';

// ============================================================================
// COMMON TYPES
// ============================================================================
export {
  // Schemas
  MetadataSchema,
  ToolMetadataSchema,
  ErrorScopeSchema,
  ErrorResponseSchema,
  PaginationInputSchema,
  // Types
  type Metadata,
  type ToolMetadata,
  type ErrorScope,
  type ErrorResponse,
  type PaginationInput,
  // Constants
  ERROR_CODES,
  type ErrorCode,
  // Functions
  createErrorResponse,
  jsonErrorResponse,
} from './common';

// ============================================================================
// AUTH TYPES
// ============================================================================
export {
  // Schemas
  AuthRequestSchema,
  AuthResponseSchema,
  SessionDataSchema,
  // Types
  type AuthRequest,
  type AuthResponse,
  type SessionData,
  // Route schemas
  authRouteSchema,
} from './auth';

// ============================================================================
// HEALTH TYPES
// ============================================================================
export {
  // Schemas
  RedisStatusSchema,
  HealthResponseSchema,
  UnhealthyResponseSchema,
  // Types
  type RedisStatus,
  type HealthResponse,
  type UnhealthyResponse,
  // Route schemas
  healthRouteSchema,
} from './health';

// ============================================================================
// TOOLS TYPES
// ============================================================================
export {
  // Schemas
  ToolAliasSchema,
  ToolParamsSchema,
  IntrospectQuerySchema,
  ToolFunctionSchema,
  ToolDefinitionSchema,
  IntrospectResponseSchema,
  // Types
  type ToolAlias,
  type ToolParams,
  type IntrospectQuery,
  type ToolFunction,
  type ToolDefinition,
  type IntrospectResponse,
  // Constants
  ALIAS_TO_PATH,
  // Route schemas
  introspectRouteSchema,
} from './tools';

// ============================================================================
// ENTITY TYPES (Captain Data domain objects)
// ============================================================================
export * from './entities';

// ============================================================================
// TOOL SCHEMAS MAPPING
// ============================================================================
import { ToolAlias } from './tools';
import {
  findPersonToolSchema,
  searchPeopleToolSchema,
  enrichPersonToolSchema,
  findCompanyToolSchema,
  searchCompaniesToolSchema,
  enrichCompanyToolSchema,
  searchCompanyEmployeesToolSchema,
  getQuotasToolSchema,
  FindPersonResponseSchema,
  SearchPeopleResponseSchema,
  EnrichPersonResponseSchema,
  FindCompanyResponseSchema,
  SearchCompaniesResponseSchema,
  EnrichCompanyResponseSchema,
  SearchCompanyEmployeesResponseSchema,
  GetQuotasResponseSchema,
} from './entities';
import { TSchema } from '@sinclair/typebox';

/**
 * Mapping of tool aliases to their input schemas and descriptions
 */
export const TOOL_SCHEMAS: Record<ToolAlias, { description: string; parameters: TSchema }> = {
  find_person: findPersonToolSchema,
  search_people: searchPeopleToolSchema,
  enrich_person: enrichPersonToolSchema,
  find_company: findCompanyToolSchema,
  search_companies: searchCompaniesToolSchema,
  enrich_company: enrichCompanyToolSchema,
  search_company_employees: searchCompanyEmployeesToolSchema,
  get_quotas: getQuotasToolSchema,
};

/**
 * Mapping of tool aliases to their response schemas
 */
export const RESPONSE_SCHEMAS: Record<ToolAlias, TSchema> = {
  find_person: FindPersonResponseSchema,
  search_people: SearchPeopleResponseSchema,
  enrich_person: EnrichPersonResponseSchema,
  find_company: FindCompanyResponseSchema,
  search_companies: SearchCompaniesResponseSchema,
  enrich_company: EnrichCompanyResponseSchema,
  search_company_employees: SearchCompanyEmployeesResponseSchema,
  get_quotas: GetQuotasResponseSchema,
};

/**
 * Error response schemas for different HTTP status codes
 */
import { ErrorResponseSchema } from './common';
export const ERROR_RESPONSES = {
  400: ErrorResponseSchema,
  401: ErrorResponseSchema,
  404: ErrorResponseSchema,
  408: ErrorResponseSchema,
  500: ErrorResponseSchema,
  503: ErrorResponseSchema,
};
