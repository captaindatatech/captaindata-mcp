import { JSONSchema7 } from "json-schema";

export const enrichPeopleSchema: { description: string; parameters: JSONSchema7 } = {
  description: "Extract detailed information from a LinkedIn profile. Use this when you need comprehensive data about a person including their work history, education, skills, and achievements. Perfect for lead research, candidate evaluation, or networking preparation.",
  parameters: {
    type: "object",
    required: ["linkedin_profile_url"],
    additionalProperties: false,
    properties: {
      linkedin_profile_url: { 
        type: "string", 
        format: "uri",
        pattern: "^https://www\\.linkedin\\.com/(sales/people|in|pub|sales/lead)/",
        examples: ["https://www.linkedin.com/in/john-doe"],
        description: "The LinkedIn profile URL to extract data from. Must be a valid LinkedIn URL starting with 'https://www.linkedin.com/sales/people/', 'https://www.linkedin.com/sales/lead/', 'https://www.linkedin.com/pub/' or 'https://www.linkedin.com/in/'"
      },
      sections: {
        type: "boolean",
        default: false,
        description: "Include education, certifications, and other profile sections in the results"
      },
      experiences: {
        type: "boolean",
        default: false,
        description: "Include detailed work experience and employment history"
      },
      skills: {
        type: "boolean",
        default: false,
        description: "Include skills, endorsements, and expertise areas"
      },
      highlights: {
        type: "boolean",
        default: false,
        description: "Include highlights, achievements, and notable accomplishments"
      }
    }
  }
}; 