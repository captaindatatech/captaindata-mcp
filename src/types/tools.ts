import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// TOOL ALIAS TYPE
// ============================================================================

/**
 * All supported tool aliases
 */
export const ToolAliasSchema = Type.Union([
  Type.Literal('find_person'),
  Type.Literal('search_people'),
  Type.Literal('enrich_person'),
  Type.Literal('find_company'),
  Type.Literal('search_companies'),
  Type.Literal('enrich_company'),
  Type.Literal('search_company_employees'),
  Type.Literal('get_quotas')
]);

export type ToolAlias = Static<typeof ToolAliasSchema>;

/**
 * Mapping of tool aliases to API paths
 */
export const ALIAS_TO_PATH = {
  find_person: "/people/find",
  search_people: "/people/search",
  enrich_person: "/people/enrich",
  find_company: "/companies/find",
  search_companies: "/companies/search",
  enrich_company: "/companies/enrich",
  search_company_employees: "/companies/{company_uid}/employees",
  get_quotas: "/quotas"
} as const;

// ============================================================================
// TOOL PARAMS SCHEMA
// ============================================================================

/**
 * URL parameters for tool endpoints
 */
export const ToolParamsSchema = Type.Object({
  alias: Type.String({ 
    description: 'Tool alias',
    minLength: 1
  })
});

export type ToolParams = Static<typeof ToolParamsSchema>;

// ============================================================================
// INTROSPECT SCHEMAS
// ============================================================================

/**
 * Introspect query parameters
 */
export const IntrospectQuerySchema = Type.Object({
  v: Type.Optional(Type.Union([
    Type.Literal('full')
  ], { description: 'Version parameter. Use "full" to get all tools' }))
});

export type IntrospectQuery = Static<typeof IntrospectQuerySchema>;

/**
 * Tool function schema for introspection
 */
export const ToolFunctionSchema = Type.Object({
  name: Type.String(),
  description: Type.String(),
  parameters: Type.Any()
});

export type ToolFunction = Static<typeof ToolFunctionSchema>;

/**
 * Tool definition schema
 */
export const ToolDefinitionSchema = Type.Object({
  type: Type.Literal('function'),
  function: ToolFunctionSchema
});

export type ToolDefinition = Static<typeof ToolDefinitionSchema>;

/**
 * Introspect response schema
 */
export const IntrospectResponseSchema = Type.Object({
  tools: Type.Array(ToolDefinitionSchema)
});

export type IntrospectResponse = Static<typeof IntrospectResponseSchema>;

// ============================================================================
// FASTIFY ROUTE SCHEMAS
// ============================================================================

/**
 * Complete introspect endpoint schema for Fastify
 */
export const introspectRouteSchema = {
  operationId: 'getIntrospect',
  tags: ['Introspection'],
  summary: 'List available tools',
  description: 'Get metadata about available tools (MCP introspection)',
  querystring: IntrospectQuerySchema,
  response: {
    200: IntrospectResponseSchema
  }
};

