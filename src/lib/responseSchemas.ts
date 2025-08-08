import { JSONSchema7 } from "json-schema";

// Error response schema (based on actions.json BadRequest response)
const errorResponse: JSONSchema7 = {
  type: "object",
  properties: {
    error_label: {
      type: ["string", "null"]
    },
    error_scope: {
      type: ["string", "null"],
      enum: ["input", "integ", "param", "config"]
    },
    error_ref: {
      type: ["string", "null"],
      examples: ["ERR-12345"]
    },
    message: {
      type: "string"
    },
    status_code: {
      type: ["integer", "null"]
    },
    params: {
      type: ["object", "null"],
      patternProperties: {
        "^[^_].*": {
          type: "string"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

// Enrich People response schema (based on LinkedinExtractPeopleOutput from actions.json)
const enrichPeopleResponse: JSONSchema7 = {
  type: "object",
  properties: {
    linkedin_profile_handle: {
      type: "string"
    },
    first_name: {
      type: "string"
    },
    last_name: {
      type: "string"
    },
    full_name: {
      type: "string"
    },
    birth_date: {
      type: "string"
    },
    headline: {
      type: "string"
    },
    summary: {
      type: "string"
    },
    languages: {
      type: "array",
      items: {
        type: "string"
      }
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string"
          }
        },
        additionalProperties: false
      }
    },
    sales_navigator_profile_id: {
      type: "string"
    },
    linkedin_profile_id: {
      type: "integer"
    },
    linkedin_profile_url: {
      type: "string",
      format: "uri"
    },
    profile_country: {
      type: "string"
    },
    profile_language: {
      type: "string"
    },
    location: {
      type: "string"
    },
    profile_image_url: {
      type: "string",
      format: "uri"
    },
    job_title: {
      type: "string"
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    },
    experiences: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    },
    highlights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    }
  },
  additionalProperties: true
};

// Enrich Company response schema (based on LinkedinExtractCompanyOutput from actions.json)
const enrichCompanyResponse: JSONSchema7 = {
  type: "object",
  properties: {
    company_name: {
      type: "string"
    },
    specialties: {
      type: "array",
      items: {
        type: "string"
      }
    },
    tagline: {
      type: "string"
    },
    linkedin_company_id: {
      type: "number"
    },
    description: {
      type: "string"
    },
    type: {
      type: "string"
    },
    founded_on: {
      type: "number"
    },
    linkedin_company_url: {
      type: "string",
      format: "uri"
    },
    website: {
      type: "string",
      format: "uri"
    },
    linkedin_company_phone: {
      type: "string"
    },
    sales_navigator_company_url: {
      type: "string",
      format: "uri"
    },
    industries: {
      type: "array",
      description: "Industries taxonomy (v2)",
      items: {
        type: "string"
      }
    },
    industries_v1: {
      type: "array",
      description: "Industries (v1)",
      items: {
        type: "string"
      }
    },
    industry: {
      type: "string"
    },
    linkedin_job_search_url: {
      type: "string",
      format: "uri"
    },
    followers_count: {
      type: "integer"
    },
    number_employees: {
      type: "number"
    },
    employees_range: {
      type: "string"
    },
    linkedin_employees_url: {
      type: "string",
      format: "uri"
    },
    sales_navigator_employees_url: {
      type: "string",
      format: "uri"
    },
    country: {
      type: "string"
    },
    geographic_area: {
      type: "string"
    },
    city: {
      type: "string"
    },
    postal_code: {
      type: "string"
    },
    headquarters: {
      type: "string"
    },
    locations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        properties: {
          address: {
            type: "string"
          },
          geographic_area: {
            type: "string"
          },
          street: {
            type: "string"
          },
          postal_code: {
            type: "string"
          },
          city: {
            type: "string"
          }
        }
      }
    }
  },
  additionalProperties: true
};

// Search People response schema (based on SalesnavigatorSearchPeopleOutput from actions.json)
const searchPeopleResponse: JSONSchema7 = {
  type: "array",
  items: {
    type: "object",
    properties: {
      full_name: {
        type: "string"
      },
      first_name: {
        type: "string"
      },
      last_name: {
        type: "string"
      },
      company_name: {
        type: "string"
      },
      sales_navigator_company_id: {
        type: "string"
      },
      linkedin_profile_id: {
        type: "integer"
      },
      connection_degree: {
        type: "integer"
      },
      job_title: {
        type: "string"
      },
      headline: {
        type: "string"
      },
      profile_image_url: {
        type: "string",
        format: "string"
      },
      sales_navigator_search_url: {
        type: "string",
        format: "string"
      },
      sales_navigator_profile_url: {
        type: "string",
        format: "string"
      },
      linkedin_profile_url: {
        type: "string",
        format: "string"
      },
      sales_navigator_profile_id: {
        type: "string"
      },
      sales_navigator_company_url: {
        type: "string",
        format: "string"
      },
      location: {
        type: "string"
      },
      linkedin_people_post_search_url: {
        type: "string",
        format: "string"
      },
      viewed: {
        type: "boolean"
      },
      tenure_start: {
        type: "string"
      },
      tenure_end: {
        type: "string"
      },
      tenure_length: {
        type: "string"
      },
      recently_hired: {
        type: "boolean"
      },
      recently_promoted: {
        type: "boolean"
      },
      current_company: {
        type: "string"
      }
    },
    additionalProperties: true
  }
};

// Search Companies response schema (based on SalesnavigatorSearchCompaniesOutput from actions.json)
const searchCompaniesResponse: JSONSchema7 = {
  type: "array",
  items: {
    type: "object",
    properties: {
      company_name: {
        type: "string"
      },
      sales_navigator_company_id: {
        type: "string"
      },
      linkedin_company_id: {
        type: "integer"
      },
      industry: {
        type: "string"
      },
      company_size: {
        type: "string"
      },
      location: {
        type: "string"
      },
      description: {
        type: "string"
      },
      sales_navigator_company_url: {
        type: "string",
        format: "string"
      },
      linkedin_company_url: {
        type: "string",
        format: "string"
      },
      followers_count: {
        type: "integer"
      },
      employee_count: {
        type: "integer"
      }
    },
    additionalProperties: true
  }
};

// Search Company Employees response schema (based on SalesnavigatorSearchCompanyEmployeesOutput from actions.json)
const searchCompanyEmployeesResponse: JSONSchema7 = {
  type: "array",
  items: {
    type: "object",
    properties: {
      full_name: {
        type: "string"
      },
      first_name: {
        type: "string"
      },
      last_name: {
        type: "string"
      },
      company_name: {
        type: "string"
      },
      sales_navigator_company_id: {
        type: "string"
      },
      linkedin_profile_id: {
        type: "integer"
      },
      connection_degree: {
        type: "integer"
      },
      job_title: {
        type: "string"
      },
      headline: {
        type: "string"
      },
      profile_image_url: {
        type: "string",
        format: "string"
      },
      sales_navigator_profile_url: {
        type: "string",
        format: "string"
      },
      linkedin_profile_url: {
        type: "string",
        format: "string"
      },
      sales_navigator_profile_id: {
        type: "string"
      },
      sales_navigator_company_url: {
        type: "string",
        format: "string"
      },
      linkedin_company_url: {
        type: "string",
        format: "string"
      },
      location: {
        type: "string"
      },
      viewed: {
        type: "boolean"
      },
      tenure_start: {
        type: "string"
      },
      tenure_end: {
        type: "string"
      },
      tenure_length: {
        type: "string"
      },
      recently_hired: {
        type: "boolean"
      },
      recently_promoted: {
        type: "boolean"
      },
      current_company: {
        type: "string"
      }
    },
    additionalProperties: true
  }
};

// Response schemas mapping for our 5 tools
export const RESPONSE_SCHEMAS: Record<string, JSONSchema7> = {
  enrich_people: enrichPeopleResponse,
  enrich_company: enrichCompanyResponse,
  search_people: searchPeopleResponse,
  search_companies: searchCompaniesResponse,
  search_company_employees: searchCompanyEmployeesResponse
};

// Error response schemas for different HTTP status codes
export const ERROR_RESPONSES = {
  400: errorResponse,
  401: errorResponse,
  404: errorResponse,
  500: errorResponse
}; 