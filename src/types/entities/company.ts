import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// FIND COMPANY SCHEMAS
// ============================================================================

/**
 * Find Company input parameters
 */
export const FindCompanyInputSchema = Type.Object(
  {
    company_name: Type.String({
      description: 'The name of the company you want to find on LinkedIn.',
      examples: ['Microsoft', 'Google'],
    }),
  },
  { additionalProperties: false }
);

export type FindCompanyInput = Static<typeof FindCompanyInputSchema>;

/**
 * Find Company response
 */
export const FindCompanyResponseSchema = Type.Object(
  {
    li_company_url: Type.Optional(Type.String({ format: 'uri' })),
    uid: Type.Optional(Type.String()),
    li_company_id: Type.Optional(Type.String()),
  },
  { additionalProperties: true }
);

export type FindCompanyResponse = Static<typeof FindCompanyResponseSchema>;

// ============================================================================
// SEARCH COMPANIES SCHEMAS
// ============================================================================

/**
 * Search Companies input parameters
 */
export const SearchCompaniesInputSchema = Type.Object(
  {
    query: Type.String({
      description:
        'A Sales Navigator account search compliant query parameter. Copy the entire value after ?query= from your Sales Navigator search URL.',
      examples: ['(keywords:"technology")'],
    }),
    page: Type.Optional(
      Type.Integer({
        minimum: 1,
        default: 1,
        description: 'Page number for paginated results',
      })
    ),
    page_size: Type.Optional(
      Type.Integer({
        minimum: 1,
        maximum: 100,
        default: 25,
        description: 'Number of results per page',
      })
    ),
  },
  { additionalProperties: false }
);

export type SearchCompaniesInput = Static<typeof SearchCompaniesInputSchema>;

/**
 * Search Companies result item
 */
export const SearchCompaniesItemSchema = Type.Object(
  {
    uid: Type.Optional(Type.String()),
    company_name: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    li_company_url: Type.Optional(Type.String({ format: 'uri' })),
    li_company_id: Type.Optional(Type.String()),
    sn_company_url: Type.Optional(Type.String({ format: 'uri' })),
    category: Type.Optional(Type.String()),
    number_employees: Type.Optional(Type.String()),
  },
  { additionalProperties: true }
);

export type SearchCompaniesItem = Static<typeof SearchCompaniesItemSchema>;

/**
 * Search Companies response (array)
 */
export const SearchCompaniesResponseSchema = Type.Array(SearchCompaniesItemSchema);

export type SearchCompaniesResponse = Static<typeof SearchCompaniesResponseSchema>;

// ============================================================================
// ENRICH COMPANY SCHEMAS
// ============================================================================

/**
 * Enrich Company input parameters
 */
export const EnrichCompanyInputSchema = Type.Object(
  {
    li_company_url: Type.String({
      format: 'uri',
      pattern: '^https://(?:www\\.)?linkedin\\.com/(?:sales/company|showcase|company|school)/',
      description:
        "The LinkedIn company page URL to extract data from. Must be a valid LinkedIn URL starting with 'https://www.linkedin.com/sales/company', 'https://www.linkedin.com/showcase', 'https://www.linkedin.com/company' or 'https://www.linkedin.com/school'",
      examples: ['https://www.linkedin.com/company/microsoft'],
    }),
  },
  { additionalProperties: false }
);

export type EnrichCompanyInput = Static<typeof EnrichCompanyInputSchema>;

/**
 * Company location schema
 */
export const CompanyLocationSchema = Type.Object(
  {
    address: Type.Optional(Type.String()),
    geographic_area: Type.Optional(Type.String()),
    street: Type.Optional(Type.String()),
    postal_code: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    country: Type.Optional(Type.String()),
  },
  { additionalProperties: true }
);

/**
 * Funding investor schema
 */
export const FundingInvestorSchema = Type.Object(
  {
    name: Type.Optional(Type.String()),
    crunchbase_company_url: Type.Optional(Type.String({ format: 'uri' })),
  },
  { additionalProperties: true }
);

/**
 * Affiliate company schema
 */
export const AffiliateSchema = Type.Object(
  {
    company_uid: Type.Optional(Type.String()),
    company_name: Type.Optional(Type.String()),
    li_company_id: Type.Optional(Type.Number()),
    followers_count: Type.Optional(Type.Integer()),
    industry: Type.Optional(Type.String()),
    li_company_url: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
);

/**
 * Enrich Company response
 */
export const EnrichCompanyResponseSchema = Type.Object(
  {
    uid: Type.Optional(Type.String()),
    company_name: Type.Optional(Type.String()),
    specialties: Type.Optional(Type.Array(Type.String())),
    tagline: Type.Optional(Type.String()),
    li_company_id: Type.Optional(Type.Number()),
    description: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    founded_on: Type.Optional(Type.Number()),
    li_company_url: Type.Optional(Type.String({ format: 'uri' })),
    website: Type.Optional(Type.String({ format: 'uri' })),
    li_company_phone: Type.Optional(Type.String()),
    sn_company_url: Type.Optional(Type.String({ format: 'uri' })),
    industries: Type.Optional(Type.Array(Type.String())),
    industry: Type.Optional(Type.String()),
    li_job_search_url: Type.Optional(Type.String({ format: 'uri' })),
    li_followers_count: Type.Optional(Type.Integer()),
    number_employees: Type.Optional(Type.Number()),
    employees_range: Type.Optional(Type.String()),
    li_employees_url: Type.Optional(Type.String({ format: 'uri' })),
    country: Type.Optional(Type.String()),
    geographic_area: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    postal_code: Type.Optional(Type.String()),
    headquarters: Type.Optional(Type.String()),
    locations: Type.Optional(Type.Array(CompanyLocationSchema)),
    number_of_locations: Type.Optional(Type.Number()),
    last_funding_investors: Type.Optional(Type.Array(FundingInvestorSchema)),
    crunchbase_company_url: Type.Optional(Type.String({ format: 'uri' })),
    last_funding_date: Type.Optional(Type.String({ format: 'date' })),
    last_funding_type: Type.Optional(Type.String()),
    last_funding_raised: Type.Optional(Type.Number()),
    last_funding_currency: Type.Optional(Type.String()),
    logo_url: Type.Optional(Type.String({ format: 'uri' })),
    domain: Type.Optional(Type.String()),
    location: Type.Optional(Type.String()),
    school_uid: Type.Optional(Type.String()),
    li_school_id: Type.Optional(Type.Number()),
    li_page_claimed: Type.Optional(Type.Boolean()),
    updated_at: Type.Optional(Type.String({ format: 'date-time' })),
    affiliates: Type.Optional(Type.Array(AffiliateSchema)),
  },
  { additionalProperties: true }
);

export type EnrichCompanyResponse = Static<typeof EnrichCompanyResponseSchema>;

// ============================================================================
// TOOL SCHEMAS (for route registration)
// ============================================================================

export const findCompanyToolSchema = {
  description:
    "Find a company's LinkedIn page by name. Use this when you have a company name and need to find their LinkedIn profile URL. Essential for starting B2B research or company analysis.",
  parameters: FindCompanyInputSchema,
};

export const searchCompaniesToolSchema = {
  description:
    'Search for companies using a Sales Navigator compliant query. Use this when you need to find target companies based on industry, size, location, or other criteria. Ideal for building target account lists or market analysis.',
  parameters: SearchCompaniesInputSchema,
};

export const enrichCompanyToolSchema = {
  description:
    'Extract comprehensive company information from LinkedIn. Use this when you need detailed data about a company including size, industry, location, and key insights. Ideal for market research, competitive analysis, or B2B prospecting.',
  parameters: EnrichCompanyInputSchema,
};
