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
    throw new NodeOperationError(self.getNode(), `MAX API Error ${error.status}: ${error.description}`);
  }
  throw error;
}

export async function getChat(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.getChat(chatId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getByLink(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const link = this.getNodeParameter('link', i) as string;

    try {
      const result = await client.getChatByLink(link);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function listChats(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = this.getNodeParameter('limit', i, 10) as number;
    const marker = this.getNodeParameter('marker', i, '') as string;

    const query: Record<string, string | number | undefined> = {};
    if (!returnAll) query.count = limit;
    if (marker) query.marker = marker;

    try {
      const result = await client.listChats(query);
      for (const chat of result.chats) {
        results.push({ json: chat as unknown as IDataObject, pairedItem: { item: i } });
      }
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function editChat(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const body: Record<string, unknown> = {};
    if (options.title) body.title = options.title;
    if (options.icon) body.icon = options.icon;

    try {
      const result = await client.editChat(chatId, body);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getMembers(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;

    const query: Record<string, string | number | undefined> = {};
    if (options.count) query.count = options.count as number;
    if (options.marker) query.marker = options.marker as string;
    if (options.userIds) query.user_ids = options.userIds as string;

    try {
      const result = await client.getChatMembers(chatId, query);
      for (const member of result.members) {
        results.push({ json: member as unknown as IDataObject, pairedItem: { item: i } });
      }
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function addMembers(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const userIdsStr = this.getNodeParameter('userIds', i, '') as string;
    const userIds = userIdsStr
      .split(',')
      .map((id: string) => parseInt(id.trim(), 10))
      .filter((id: number) => !isNaN(id));

    if (userIds.length === 0) {
      continue;
    }

    try {
      const result = await client.addChatMembers(chatId, userIds);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function removeMember(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const userId = this.getNodeParameter('userId', i) as number;

    try {
      const result = await client.removeChatMember(chatId, userId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getAdmins(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.getChatAdmins(chatId);
      for (const member of result.members) {
        results.push({ json: member as unknown as IDataObject, pairedItem: { item: i } });
      }
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getMembership(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.getChatMembership(chatId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function chatActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'get':
      return getChat.call(this, client);
    case 'getByLink':
      return getByLink.call(this, client);
    case 'list':
      return listChats.call(this, client);
    case 'edit':
      return editChat.call(this, client);
    case 'getMembers':
      return getMembers.call(this, client);
    case 'addMembers':
      return addMembers.call(this, client);
    case 'removeMember':
      return removeMember.call(this, client);
    case 'getAdmins':
      return getAdmins.call(this, client);
    case 'getMembership':
      return getMembership.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
