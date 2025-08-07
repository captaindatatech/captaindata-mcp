import { ToolAlias } from "../alias";
import { JSONSchema7 } from "json-schema";
import { enrichPeopleSchema } from './enrichPeople';
import { enrichCompanySchema } from './enrichCompany';
import { searchPeopleSchema } from './searchPeople';
import { searchCompaniesSchema } from './searchCompanies';
import { searchCompanyEmployeesSchema } from './searchCompanyEmployees';

/**
 * Captain Data LinkedIn Tool Schemas
 * 
 * These schemas define the parameters for LinkedIn data extraction and search tools.
 * Each tool is designed for specific use cases:
 * 
 * - enrich_people: Extract detailed profile information for lead research or candidate evaluation
 * - enrich_company: Get comprehensive company data for market research or competitive analysis
 * - search_people: Find prospects using Sales Navigator with advanced filtering
 * - search_companies: Discover target companies based on industry, size, and location
 * - search_company_employees: Identify key contacts within a specific organization
 * 
 * All tools require valid LinkedIn URLs and follow consistent parameter patterns.
 */

// Export the complete mapping
export const TOOL_SCHEMAS: Record<ToolAlias, {description:string; parameters:JSONSchema7}> = {
  enrich_people: enrichPeopleSchema,
  enrich_company: enrichCompanySchema,
  search_people: searchPeopleSchema,
  search_companies: searchCompaniesSchema,
  search_company_employees: searchCompanyEmployeesSchema
};

// Validation function to ensure schemas follow MCP best practices
export function validateToolSchema(schema: { description: string; parameters: JSONSchema7 }): boolean {
  // Check required fields
  if (!schema.description || typeof schema.description !== 'string') {
    throw new Error('Schema must have a description string');
  }
  
  if (!schema.parameters || typeof schema.parameters !== 'object') {
    throw new Error('Schema must have parameters object');
  }
  
  // Check parameters structure
  const params = schema.parameters as JSONSchema7;
  if (params.type !== 'object') {
    throw new Error('Parameters must be of type "object"');
  }
  
  // Validate that required properties are defined
  if (params.required && Array.isArray(params.required)) {
    if (!params.properties) {
      throw new Error('Required properties must have corresponding property definitions');
    }
    
    for (const requiredProp of params.required) {
      if (!(requiredProp in params.properties)) {
        throw new Error(`Required property "${requiredProp}" must be defined in properties`);
      }
    }
  }
  
  return true;
}

// Validate all schemas on import
Object.entries(TOOL_SCHEMAS).forEach(([name, schema]) => {
  try {
    validateToolSchema(schema);
  } catch (error) {
    console.error(`Schema validation failed for ${name}:`, error);
    throw error;
  }
}); 