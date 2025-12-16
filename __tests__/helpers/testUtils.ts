export function mockFetchResponse(data: any, status: number = 200, headers: Record<string, string> = {}) {
  const originalFetch = global.fetch;
  const mockHeaders = new Map(Object.entries(headers));
  
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: {
      get: (name: string) => mockHeaders.get(name.toLowerCase()) || null
    }
  });
  return originalFetch;
}

export function restoreFetch(originalFetch: any) {
  global.fetch = originalFetch;
}

export function createTestPayload(tool: string, payload: any) {
  return {
    method: 'POST',
    url: `/tools/${tool}`,
    headers: {
      'x-api-key': 'test-api-key'
    },
    payload
  };
}

export function createTestRequest(method: string, url: string, headers?: any, payload?: any) {
  return {
    method,
    url,
    headers,
    payload
  };
}
