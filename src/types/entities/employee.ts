import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// SEARCH COMPANY EMPLOYEES SCHEMAS
// ============================================================================

/**
 * Search Company Employees input parameters
 */
export const SearchCompanyEmployeesInputSchema = Type.Object({
  company_uid: Type.String({
    description: "The Captain Data unique identifier for the company. Get this from search_companies or enrich_company first.",
    examples: ["abc123-def456"]
  }),
  page: Type.Optional(Type.Integer({ 
    minimum: 1, 
    default: 1,
    description: 'Page number for paginated results' 
  })),
  page_size: Type.Optional(Type.Integer({ 
    minimum: 1, 
    maximum: 100, 
    default: 25,
    description: 'Number of results per page' 
  }))
}, { additionalProperties: false });

export type SearchCompanyEmployeesInput = Static<typeof SearchCompanyEmployeesInputSchema>;

/**
 * Employee item schema
 */
export const EmployeeSchema = Type.Object({
  uid: Type.Optional(Type.String()),
  full_name: Type.Optional(Type.String()),
  headline: Type.Optional(Type.String()),
  location: Type.Optional(Type.String()),
  li_profile_url: Type.Optional(Type.String({ format: 'uri' })),
  li_profile_id: Type.Optional(Type.Integer()),
  job_title: Type.Optional(Type.String()),
  company_name: Type.Optional(Type.String()),
  current_company: Type.Optional(Type.String()),
  li_profile_image_url: Type.Optional(Type.String({ format: 'uri' })),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  current_title: Type.Optional(Type.String()),
  li_profile_handle: Type.Optional(Type.String()),
  li_company_id: Type.Optional(Type.String()),
  li_company_url: Type.Optional(Type.String({ format: 'uri' }))
}, { additionalProperties: true });

export type Employee = Static<typeof EmployeeSchema>;

/**
 * Search Company Employees response (array)
 */
export const SearchCompanyEmployeesResponseSchema = Type.Array(EmployeeSchema);

export type SearchCompanyEmployeesResponse = Static<typeof SearchCompanyEmployeesResponseSchema>;

// ============================================================================
// TOOL SCHEMAS (for route registration)
// ============================================================================

export const searchCompanyEmployeesToolSchema = {
  description: "Search for employees of a specific company. Use this when you need to find people working at a particular organization. Perfect for identifying key contacts, decision-makers, or potential leads within target companies.",
  parameters: SearchCompanyEmployeesInputSchema
};

