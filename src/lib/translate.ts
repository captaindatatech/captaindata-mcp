import { ALIAS_TO_SLUG, ToolAlias } from "./alias";

export function toCaptainData(alias: ToolAlias, body: any) {
  const slug = ALIAS_TO_SLUG[alias];

  // Base structure with Captain Data specific fields
  const basePayload = {
    identity_mode: "managed",
    identity_ids: []
  };

  // Split user payload into input vs parameters based on action spec
  switch (alias) {
    case 'enrich_people': {
      const { linkedin_profile_url, sections, experiences, skills, highlights, ...rest } = body;
      return {
        ...basePayload,
        input: { 
          linkedin_profile_url,
          custom_data: { source: "mcp" }
        },
        parameters: { sections, experiences, skills, highlights, ...rest }
      };
    }
    
    case 'enrich_company': {
      const { linkedin_company_url, ...rest } = body;
      return {
        ...basePayload,
        input: { 
          linkedin_company_url,
          custom_data: { source: "mcp" }
        },
        parameters: { ...rest }
      };
    }
    
    case 'search_people': {
      const { search_url, ...rest } = body;
      return {
        ...basePayload,
        input: { 
          sales_navigator_profile_search_url: search_url,
          custom_data: { source: "mcp" }
        },
        parameters: { ...rest }
      };
    }
    
    case 'search_companies': {
      const { search_url, ...rest } = body;
      return {
        ...basePayload,
        input: { 
          sales_navigator_company_search_url: search_url,
          custom_data: { source: "mcp" }
        },
        parameters: { ...rest }
      };
    }
    
    case 'search_company_employees': {
      const { sales_navigator_company_url, linkedin_company_id, ...rest } = body;
      const input: any = {
        custom_data: { source: "mcp" }
      };
      if (sales_navigator_company_url) {
        input.sales_navigator_company_url = sales_navigator_company_url;
      }
      if (linkedin_company_id) {
        input.linkedin_company_id = linkedin_company_id;
      }
      return {
        ...basePayload,
        input,
        parameters: { ...rest }
      };
    }
    
    default:
      throw new Error(`Unknown tool alias: ${alias}`);
  }
} 