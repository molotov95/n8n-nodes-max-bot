import { MaxBotApiClient, HttpHelpers } from '../src/api/MaxBotApiClient';

const createMockHelpers = (responses: Array<{ statusCode: number; body: unknown }> = []): HttpHelpers => {
  let callIndex = 0;
  return {
    httpRequest: async (_opts: Record<string, unknown>) => {
      const res = responses[callIndex] || { statusCode: 200, body: {} };
      callIndex++;
      return {
        statusCode: res.statusCode,
        body: res.body,
        headers: {},
      };
    },
  };
};

describe('MaxBotApiClient', () => {
  it('should create client with correct credentials', () => {
    const client = new MaxBotApiClient('test-token', 'https://test.max.ru');
    expect(client).toBeDefined();
  });

  it('should throw if helpers not set', async () => {
    const client = new MaxBotApiClient('test-token');
    await expect(client.getChat(123)).rejects.toThrow('helpers not set');
  });

  it('should make correct request for getChat', async () => {
    const client = new MaxBotApiClient('test-token', 'https://platform-api2.max.ru');
    client.helpers = createMockHelpers([
      { statusCode: 200, body: { chat_id: 123, title: 'Test', type: 'chat' } },
    ]);

    const result = await client.getChat(123);

    expect(result).toEqual({ chat_id: 123, title: 'Test', type: 'chat' });
  });

  it('should throw MaxError on non-200 response', async () => {
    const client = new MaxBotApiClient('test-token');
    client.helpers = createMockHelpers([
      { statusCode: 401, body: { code: 'unauthorized', message: 'Invalid token' } },
    ]);

    await expect(client.getChat(123)).rejects.toThrow('401: Invalid token');
  });

  it('should handle sendMessageToChat with options', async () => {
    const client = new MaxBotApiClient('test-token');
    client.helpers = createMockHelpers([
      { statusCode: 200, body: { message: { body: { mid: 'msg1', text: 'Hello' } } } },
    ]);

    const result = await client.sendMessageToChat(123, 'Hello', { format: 'markdown' });

    expect(result.message.body.text).toBe('Hello');
  });
});
