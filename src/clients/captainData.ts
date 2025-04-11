import axios, { AxiosError } from 'axios';

export interface CaptainDataConfig {
  apiKey: string;
  baseUrl?: string;
}

export class CaptainDataClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CaptainDataConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.captaindata.com/v4/actions';
  }

  async executeAction<T>(actionPath: string, params: Record<string, any>, integrationUsers: string[]): Promise<T> {
    try {
      const response = await axios.post(`${this.baseUrl}/${actionPath}/run/live`, {
        input: params,
        integration_users: integrationUsers
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new Error(`Captain Data API error: ${axiosError.response?.status} ${axiosError.response?.statusText}`);
      }
      throw error;
    }
  }
} 