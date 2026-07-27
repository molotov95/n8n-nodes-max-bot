import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { MaxBotApiClient } from '../../../api/MaxBotApiClient';
import { MaxError } from '../../../api/types';

function handleApiError(self: IExecuteFunctions, error: unknown): never {
  if (error instanceof MaxError) {
    throw new NodeOperationError(self.getNode(), `MAX API Error ${error.status}: ${error.description}`);
  }
  throw error;
}

export async function pin(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;
    const messageId = this.getNodeParameter('messageId', i) as string;
    const options = this.getNodeParameter('options', i, {}) as Record<string, unknown>;
    const notify = (options.notify as boolean) || false;

    try {
      const result = await client.pinMessage(chatId, messageId, notify);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function unpin(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.unpinMessage(chatId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function getPinned(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.getPinnedMessage(chatId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function pinActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'pin':
      return pin.call(this, client);
    case 'unpin':
      return unpin.call(this, client);
    case 'getPinned':
      return getPinned.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
