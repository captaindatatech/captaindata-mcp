import { JSONSchema7 } from "json-schema";

export const searchCompaniesSchema: { description: string; parameters: JSONSchema7 } = {
  description: "Search for companies using LinkedIn Sales Navigator. Use this when you need to find target companies based on industry, size, location, or other criteria. Perfect for market research, competitive analysis, or identifying potential business partners.",
  parameters: {
    type: "object",
    required: ["search_url"],
    additionalProperties: false,
    properties: {
      search_url: { 
        type: "string", 
        format: "uri",
        pattern: "^https://www\\.linkedin\\.com/sales/search/company",
        examples: ["https://www.linkedin.com/sales/search/company?keywords=technology"],
        description: "The Sales Navigator company search URL with your desired filters and criteria. Must start with 'https://www.linkedin.com/sales/search/company'"
      },
      page: {
        type: "integer",
        default: 1,
        description: "Page number for pagination, starting at 1"
      }
    }
  }
}; 