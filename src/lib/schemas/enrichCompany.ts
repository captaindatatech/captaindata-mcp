import { JSONSchema7 } from "json-schema";

export const enrichCompanySchema: { description: string; parameters: JSONSchema7 } = {
  description: "Extract comprehensive company information from LinkedIn. Use this when you need detailed data about a company including size, industry, location, and key insights. Ideal for market research, competitive analysis, or B2B prospecting.",
  parameters: {
    type: "object",
    required: ["linkedin_company_url"],
    additionalProperties: false,
    properties: {
      linkedin_company_url: { 
        type: "string", 
        format: "uri",
        pattern: "^https://www\\.linkedin\\.com/(sales/company|showcase|company|school)/",
        examples: ["https://www.linkedin.com/company/microsoft"],
        description: "The LinkedIn company page URL to extract data from. Must be a valid LinkedIn URL starting with 'https://www.linkedin.com/sales/company', 'https://www.linkedin.com/showcase', 'https://www.linkedin.com/company' or 'https://www.linkedin.com/school'"
      }
    }
  }
}; 