import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { MaxBotApiClient } from '../../../api/MaxBotApiClient';
import { MaxError } from '../../../api/types';

function handleApiError(self: IExecuteFunctions, error: unknown): never {
  if (error instanceof MaxError) {
    if (error.status === 401) {
      throw new NodeOperationError(self.getNode(), 'Invalid bot token. Check your credentials.');
    }
    if (error.status === 429) {
      throw new NodeOperationError(self.getNode(), 'Rate limit exceeded. Please wait before retrying.');
    }
    if (error.status === 400) {
      throw new NodeOperationError(self.getNode(), `Bad request: ${error.description}`);
    }
    throw new NodeOperationError(self.getNode(), `MAX API Error ${error.status}: ${error.description}`);
  }
  throw error;
}

export async function sendToChat(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const text = this.getNodeParameter('text', i) as string;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const body: Record<string, unknown> = {};

    if (options.format) body.format = options.format;
    if (options.notify) body.notify = options.notify;

    if (options.linkMid) {
      body.link = { type: 'reply', mid: options.linkMid };
    }

    if (options.inlineKeyboard) {
      try {
        const buttons =
          typeof options.inlineKeyboard === 'string'
            ? JSON.parse(options.inlineKeyboard as string)
            : options.inlineKeyboard;
        body.attachments = [{ type: 'inline_keyboard', payload: { buttons } }];
      } catch (_e) {
        throw new NodeOperationError(this.getNode(), 'Invalid JSON in Inline Keyboard field');
      }
    }

    try {
      const result = await client.sendMessageToChat(chatId, text, body);
      results.push({ json: result.message as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function sendToUser(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const userId = this.getNodeParameter('userId', i) as number;
    const text = this.getNodeParameter('text', i) as string;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const body: Record<string, unknown> = {};

    if (options.format) body.format = options.format;
    if (options.notify) body.notify = options.notify;

    if (options.linkMid) {
      body.link = { type: 'reply', mid: options.linkMid };
    }

    if (options.inlineKeyboard) {
      try {
        const buttons =
          typeof options.inlineKeyboard === 'string'
            ? JSON.parse(options.inlineKeyboard as string)
            : options.inlineKeyboard;
        body.attachments = [{ type: 'inline_keyboard', payload: { buttons } }];
      } catch (_e) {
        throw new NodeOperationError(this.getNode(), 'Invalid JSON in Inline Keyboard field');
      }
    }

    try {
      const result = await client.sendMessageToUser(userId, text, body);
      results.push({ json: result.message as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function edit(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const messageId = this.getNodeParameter('messageId', i) as string;
    const text = this.getNodeParameter('text', i, '') as string;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const body: Record<string, unknown> = {};
    if (text) body.text = text;
    if (options.format) body.format = options.format;

    try {
      const result = await client.editMessage(messageId, body);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function deleteMsg(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const messageId = this.getNodeParameter('messageId', i) as string;

    try {
      const result = await client.deleteMessage(messageId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function get(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const messageId = this.getNodeParameter('messageId', i) as string;

    try {
      const result = await client.getMessage(messageId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getMany(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const query: Record<string, string | number | undefined> = {};
    if (options.from) query.from = options.from as number;
    if (options.to) query.to = options.to as number;
    if (options.count) query.count = options.count as number;
    if (options.messageIds) query.message_ids = options.messageIds as string;

    try {
      const result = await client.getMessages(chatId, query);
      const messages = (result as unknown as { messages: IDataObject[] }).messages || [];
      for (const msg of messages) {
        results.push({ json: msg as unknown as IDataObject, pairedItem: { item: i } });
      }
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function messageActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'sendToChat':
      return sendToChat.call(this, client);
    case 'sendToUser':
      return sendToUser.call(this, client);
    case 'edit':
      return edit.call(this, client);
    case 'delete':
      return deleteMsg.call(this, client);
    case 'get':
      return get.call(this, client);
    case 'getMany':
      return getMany.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
