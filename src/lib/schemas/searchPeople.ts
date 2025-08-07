import { JSONSchema7 } from "json-schema";

export const searchPeopleSchema: { description: string; parameters: JSONSchema7 } = {
  description: "Search for people using LinkedIn Sales Navigator. Use this when you need to find potential leads, candidates, or contacts based on specific criteria like job title, company, location, or skills. Great for building prospect lists or finding experts in a particular field.",
  parameters: {
    type: "object",
    required: ["search_url"],
    additionalProperties: false,
    properties: {
      search_url: { 
        type: "string", 
        format: "uri",
        pattern: "^https://www.linkedin.com/sales/search/people",
        examples: ["https://www.linkedin.com/sales/search/people?keywords=software%20engineer"],
        description: "The Sales Navigator search URL with your desired filters and criteria. Must start with 'https://www.linkedin.com/sales/search/people'"
      },
      page: {
        type: "integer",
        default: 1,
        description: "Page number for pagination, starting at 1"
      }
    }
  }
}; 