import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { MaxBotApiClient } from '../../../api/MaxBotApiClient';
import { MaxError } from '../../../api/types';
import { BotCommand } from '../../../api/types';

function handleApiError(self: IExecuteFunctions, error: unknown): never {
  if (error instanceof MaxError) {
    throw new NodeOperationError(self.getNode(), `MAX API Error ${error.status}: ${error.description}`);
  }
  throw error;
}

export async function getInfo(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const result = await client.getBotInfo();
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function setCommands(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const commandsStr = this.getNodeParameter('commands', i, '') as string;

    let commands: BotCommand[];
    try {
      commands = typeof commandsStr === 'string'
        ? JSON.parse(commandsStr)
        : commandsStr;
    } catch (_e) {
      commands = [];
    }

    if (!Array.isArray(commands) || commands.length === 0) {
      continue;
    }

    try {
      const result = await client.setCommands(commands);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function botActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'getInfo':
      return getInfo.call(this, client);
    case 'setCommands':
      return setCommands.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// ── Action resource (typing, leave) ──

export async function sendTyping(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.sendAction(chatId, 'typing_on');
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function leaveChat(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const chatId = this.getNodeParameter('chatId', i) as number;

    try {
      const result = await client.leaveChat(chatId);
      results.push({ json: result as unknown as IDataObject, pairedItem: { item: i } });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function actionActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'sendTyping':
      return sendTyping.call(this, client);
    case 'leaveChat':
      return leaveChat.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
