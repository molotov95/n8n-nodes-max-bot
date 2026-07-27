import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { MaxBotApiClient } from '../../../api/MaxBotApiClient';
import { messageActions } from './message';
import { chatActions } from './chat';
import { fileActions } from './file';
import { pinActions } from './pin';
import { botActions, actionActions } from './bot';

export async function executeAction(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[][]> {
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0) as string;

  let results: INodeExecutionData[];

  switch (resource) {
    case 'message':
      results = await messageActions.call(this, client, operation);
      break;
    case 'chat':
      results = await chatActions.call(this, client, operation);
      break;
    case 'file':
      results = await fileActions.call(this, client, operation);
      break;
    case 'pin':
      results = await pinActions.call(this, client, operation);
      break;
    case 'action':
      results = await actionActions.call(this, client, operation);
      break;
    case 'bot':
      results = await botActions.call(this, client, operation);
      break;
    default:
      throw new Error(`Unknown resource: ${resource}`);
  }

  return [results];
}
