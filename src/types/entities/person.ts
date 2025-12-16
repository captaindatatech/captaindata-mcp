import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// FIND PERSON SCHEMAS
// ============================================================================

/**
 * Find Person input parameters
 */
export const FindPersonInputSchema = Type.Object({
  full_name: Type.String({
    description: "The full name of the person you want to find on LinkedIn.",
    examples: ["John Doe", "Jane Smith"]
  }),
  company_name: Type.Optional(Type.String({
    description: "The company name to help narrow down the search results. Highly recommended for common names.",
    examples: ["Microsoft", "Google"]
  }))
}, { additionalProperties: false });

export type FindPersonInput = Static<typeof FindPersonInputSchema>;

/**
 * Find Person response
 */
export const FindPersonResponseSchema = Type.Object({
  li_profile_url: Type.Optional(Type.String({ format: 'uri' })),
  uid: Type.Optional(Type.String()),
  li_profile_id: Type.Optional(Type.Number())
}, { additionalProperties: true });

export type FindPersonResponse = Static<typeof FindPersonResponseSchema>;

// ============================================================================
// SEARCH PEOPLE SCHEMAS
// ============================================================================

/**
 * Search People input parameters
 */
export const SearchPeopleInputSchema = Type.Object({
  query: Type.String({
    description: "A Sales Navigator People search compliant query param. Please copy the entire value of the query parameter from your Sales Navigator search URL (everything after ?query=) and paste it here.",
    examples: ['(keywords:"Software Engineer")']
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

export type SearchPeopleInput = Static<typeof SearchPeopleInputSchema>;

/**
 * Search People result item
 */
export const SearchPeopleItemSchema = Type.Object({
  uid: Type.Optional(Type.String()),
  full_name: Type.Optional(Type.String()),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  job_title: Type.Optional(Type.String()),
  company_name: Type.Optional(Type.String()),
  headline: Type.Optional(Type.String()),
  location: Type.Optional(Type.String()),
  li_profile_id: Type.Optional(Type.Integer()),
  li_profile_url: Type.Optional(Type.String({ format: 'uri' })),
  li_profile_image_url: Type.Optional(Type.String()),
  li_company_id: Type.Optional(Type.String()),
  job_start: Type.Optional(Type.String({ format: 'date-time' })),
  job_end: Type.Optional(Type.String({ format: 'date-time' })),
  job_time_period: Type.Optional(Type.String()),
  recently_hired: Type.Optional(Type.Boolean()),
  recently_promoted: Type.Optional(Type.Boolean())
}, { additionalProperties: true });

export type SearchPeopleItem = Static<typeof SearchPeopleItemSchema>;

/**
 * Search People response (array)
 */
export const SearchPeopleResponseSchema = Type.Array(SearchPeopleItemSchema);

export type SearchPeopleResponse = Static<typeof SearchPeopleResponseSchema>;

// ============================================================================
// ENRICH PERSON SCHEMAS
// ============================================================================

/**
 * Enrich Person input parameters
 */
export const EnrichPersonInputSchema = Type.Object({
  li_profile_url: Type.String({
    format: 'uri',
    pattern: "^https://(?:www\\.)?linkedin\\.com/(?:in|pub|sales/people|sales/lead)/",
    description: "The LinkedIn profile URL to extract data from. Must be a valid LinkedIn URL starting with 'https://www.linkedin.com/sales/people/', 'https://www.linkedin.com/sales/lead/', 'https://www.linkedin.com/pub/' or 'https://www.linkedin.com/in/'",
    examples: ["https://www.linkedin.com/in/john-doe"]
  }),
  full_enrich: Type.Optional(Type.Boolean({
    default: false,
    description: "Extract experiences, skills and highlights. Set to true for comprehensive profile data."
  }))
}, { additionalProperties: false });

export type EnrichPersonInput = Static<typeof EnrichPersonInputSchema>;

/**
 * Education item schema
 */
export const EducationSchema = Type.Object({
  school_uid: Type.Optional(Type.String()),
  school_name: Type.Optional(Type.String()),
  li_school_url: Type.Optional(Type.String()),
  date: Type.Optional(Type.String()),
  li_school_id: Type.Optional(Type.String()),
  degree_name: Type.Optional(Type.String())
}, { additionalProperties: false });

/**
 * Experience item schema
 */
export const ExperienceSchema = Type.Object({
  title: Type.Optional(Type.String()),
  company_uid: Type.Optional(Type.String()),
  company_name: Type.Optional(Type.String()),
  company_description: Type.Optional(Type.String()),
  li_company_url: Type.Optional(Type.String({ format: 'uri' })),
  location: Type.Optional(Type.String()),
  li_company_id: Type.Optional(Type.String()),
  date: Type.Optional(Type.String()),
  job_time_period: Type.Optional(Type.String()),
  company_logo_url: Type.Optional(Type.String())
}, { additionalProperties: false });

/**
 * Skill item schema
 */
export const SkillSchema = Type.Object({
  name: Type.Optional(Type.String())
}, { additionalProperties: false });

/**
 * Enrich Person response
 */
export const EnrichPersonResponseSchema = Type.Object({
  uid: Type.Optional(Type.String()),
  li_profile_handle: Type.Optional(Type.String()),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  full_name: Type.Optional(Type.String()),
  birth_date: Type.Optional(Type.String()),
  headline: Type.Optional(Type.String()),
  summary: Type.Optional(Type.String()),
  languages: Type.Optional(Type.Array(Type.String())),
  skills: Type.Optional(Type.Array(SkillSchema)),
  li_profile_id: Type.Optional(Type.Integer()),
  li_profile_url: Type.Optional(Type.String({ format: 'uri' })),
  li_profile_country: Type.Optional(Type.String()),
  li_profile_language: Type.Optional(Type.String()),
  location: Type.Optional(Type.String()),
  li_profile_image_url: Type.Optional(Type.String({ format: 'uri' })),
  job_title: Type.Optional(Type.String()),
  education: Type.Optional(Type.Array(EducationSchema)),
  school_name: Type.Optional(Type.String()),
  li_school_url: Type.Optional(Type.String({ format: 'uri' })),
  volunteer_experiences: Type.Optional(Type.Array(Type.Any())),
  li_number_connections: Type.Optional(Type.Number()),
  experiences: Type.Optional(Type.Array(ExperienceSchema)),
  company_uid: Type.Optional(Type.String()),
  company_name: Type.Optional(Type.String()),
  li_company_url: Type.Optional(Type.String({ format: 'uri' })),
  li_company_id: Type.Optional(Type.String()),
  li_number_followers: Type.Optional(Type.Number()),
  li_people_post_search_url: Type.Optional(Type.String({ format: 'uri' })),
  open_to_work: Type.Optional(Type.Boolean()),
  past_company_uid: Type.Optional(Type.String()),
  past_company_name: Type.Optional(Type.String()),
  past_job_title: Type.Optional(Type.String()),
  past_li_company_id: Type.Optional(Type.String()),
  past_li_company_url: Type.Optional(Type.String({ format: 'uri' }))
}, { additionalProperties: true });

export type EnrichPersonResponse = Static<typeof EnrichPersonResponseSchema>;

// ============================================================================
// TOOL SCHEMAS (for route registration)
// ============================================================================

export const findPersonToolSchema = {
  description: "Find a person's LinkedIn profile by their name. Use this when you have someone's name and optionally their company, and need to find their LinkedIn profile URL. Perfect for starting lead research when you only have basic contact information.",
  parameters: FindPersonInputSchema
};

export const searchPeopleToolSchema = {
  description: "Search for people using a Sales Navigator compliant query. Use this when you need to find potential leads, candidates, or contacts based on specific criteria like job title, company, location, or skills. Great for building prospect lists or finding experts in a particular field.",
  parameters: SearchPeopleInputSchema
};

export const enrichPersonToolSchema = {
  description: "Extract detailed information from a LinkedIn profile. Use this when you need comprehensive data about a person including their work history, education, skills, and achievements. Perfect for lead research, candidate evaluation, or networking preparation.",
  parameters: EnrichPersonInputSchema
};

