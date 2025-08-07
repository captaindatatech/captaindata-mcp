export const ALIAS_TO_SLUG = {
  enrich_people: "linkedin-extract-people",
  enrich_company: "linkedin-extract-company",
  search_people: "salesnavigator-search-people",
  search_companies: "salesnavigator-search-companies",
  search_company_employees: "salesnavigator-search-company-employees"
} as const;

export type ToolAlias = keyof typeof ALIAS_TO_SLUG; 