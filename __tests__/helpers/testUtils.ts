export function mockFetchResponse(data: any, status: number = 200) {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    status,
    text: () => Promise.resolve(JSON.stringify(data))
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