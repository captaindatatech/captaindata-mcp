import { JSONSchema7 } from "json-schema";

export const searchCompanyEmployeesSchema: { description: string; parameters: JSONSchema7 } = {
  description: "Find employees of a specific company using LinkedIn Sales Navigator. Use this when you need to identify key decision makers, potential contacts, or understand the organizational structure of a target company. Ideal for account-based marketing or sales prospecting.",
  parameters: {
    type: "object",
    required: [],
    additionalProperties: false,
    properties: {
      sales_navigator_company_url: { 
        type: "string", 
        format: "uri",
        pattern: "^https://www\\.linkedin\\.com/sales/company/",
        examples: ["https://www.linkedin.com/sales/company/microsoft", "https://www.linkedin.com/sales/company/apple"],
        description: "The Sales Navigator company page URL. Must start with 'https://www.linkedin.com/sales/company/'. Provide either this URL or the company ID."
      },
      linkedin_company_id: { 
        type: "string",
        examples: ["12345", "67890"],
        description: "The LinkedIn company ID (alternative to providing the company URL). Provide either this ID or the company URL."
      }
    }
  }
}; 