import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { MaxBotApiClient, HttpHelpers } from '../../api/MaxBotApiClient';
import { maxBotDescription } from './MaxBot.node.description';
import { executeAction } from './actions';

export class MaxBot implements INodeType {
  description: INodeTypeDescription = maxBotDescription;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('maxBotApi');
    const token = credentials.token as string;
    const baseUrl = (credentials.baseUrl as string) || 'https://platform-api2.max.ru';

    const client = new MaxBotApiClient(token, baseUrl);
    client.helpers = this.helpers as unknown as HttpHelpers;

    return executeAction.call(this, client);
  }
}
