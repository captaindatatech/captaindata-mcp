import { CaptainDataClient } from '../clients/captainData';
import toolDefinitions from './definitions.json';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
  actionPath: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
  execute: (params: any, request: any) => Promise<any>;
}

export class ToolFactory {
  private client: CaptainDataClient;
  private tools: Map<string, Tool> = new Map();

  constructor(client: CaptainDataClient) {
    this.client = client;
    this.initializeTools();
  }

  private initializeTools() {
    // Initialize LinkedIn Company tool
    this.tools.set('linkedin_extract_company', {
      ...toolDefinitions.linkedin_extract_company,
      execute: async (params: { linkedin_company_url: string }, request: any) => {
        if (!process.env.HARDCODED_LINKEDIN_UID) {
          throw new Error('Missing required environment variable: HARDCODED_LINKEDIN_UID');
        }

        const apiKey = request.headers['x-api-key'] || process.env.CAPTAINDATA_API_KEY;
        if (!apiKey) {
          throw new Error('Missing API key. Please provide it via x-api-key header or CAPTAINDATA_API_KEY environment variable.');
        }

        // Create a new client with the provided API key
        const client = new CaptainDataClient({ apiKey });
        
        return client.executeAction(
          toolDefinitions.linkedin_extract_company.actionPath,
          { linkedin_company_url: params.linkedin_company_url },
          [process.env.HARDCODED_LINKEDIN_UID]
        );
      }
    });

    // Initialize LinkedIn People tool
    this.tools.set('linkedin_extract_people', {
      ...toolDefinitions.linkedin_extract_people,
      execute: async (params: { linkedin_profile_url: string }, request: any) => {
        if (!process.env.HARDCODED_LINKEDIN_UID) {
          throw new Error('Missing required environment variable: HARDCODED_LINKEDIN_UID');
        }

        const apiKey = request.headers['x-api-key'] || process.env.CAPTAINDATA_API_KEY;
        if (!apiKey) {
          throw new Error('Missing API key. Please provide it via x-api-key header or CAPTAINDATA_API_KEY environment variable.');
        }

        // Create a new client with the provided API key
        const client = new CaptainDataClient({ apiKey });
        
        return client.executeAction(
          toolDefinitions.linkedin_extract_people.actionPath,
          { linkedin_profile_url: params.linkedin_profile_url },
          [process.env.HARDCODED_LINKEDIN_UID]
        );
      }
    });
  }

  getTool(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
} 