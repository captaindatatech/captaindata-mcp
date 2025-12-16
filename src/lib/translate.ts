import { ALIAS_TO_PATH, ToolAlias } from '../types';

interface TranslationResult {
  path: string;
  queryParams: Record<string, string>;
}

/**
 * Translates tool alias and body to API path and query parameters
 * for the new v1 GET-based API
 */
export function toQueryParams(alias: ToolAlias, body: Record<string, unknown>): TranslationResult {
  let path: string = ALIAS_TO_PATH[alias];
  const queryParams: Record<string, string> = {};

  switch (alias) {
    case 'find_person': {
      // Required: full_name, Optional: company_name
      if (body.full_name) queryParams.full_name = String(body.full_name);
      if (body.company_name) queryParams.company_name = String(body.company_name);
      break;
    }

    case 'search_people': {
      // Required: query, Optional: page, page_size
      if (body.query) queryParams.query = String(body.query);
      if (body.page) queryParams.page = String(body.page);
      if (body.page_size) queryParams.page_size = String(body.page_size);
      break;
    }

    case 'enrich_person': {
      // Required: li_profile_url, Optional: full_enrich
      if (body.li_profile_url) queryParams.li_profile_url = String(body.li_profile_url);
      if (body.full_enrich !== undefined) queryParams.full_enrich = String(body.full_enrich);
      break;
    }

    case 'find_company': {
      // Required: company_name
      if (body.company_name) queryParams.company_name = String(body.company_name);
      break;
    }

    case 'search_companies': {
      // Required: query, Optional: page, page_size
      if (body.query) queryParams.query = String(body.query);
      if (body.page) queryParams.page = String(body.page);
      if (body.page_size) queryParams.page_size = String(body.page_size);
      break;
    }

    case 'enrich_company': {
      // Required: li_company_url
      if (body.li_company_url) queryParams.li_company_url = String(body.li_company_url);
      break;
    }

    case 'search_company_employees': {
      // Path param: company_uid, Optional: page, page_size
      if (body.company_uid) {
        path = path.replace('{company_uid}', String(body.company_uid));
      }
      if (body.page) queryParams.page = String(body.page);
      if (body.page_size) queryParams.page_size = String(body.page_size);
      break;
    }

    case 'get_quotas': {
      // No parameters required
      break;
    }

    default:
      throw new Error(`Unknown tool alias: ${alias}`);
  }

  return { path, queryParams };
}
