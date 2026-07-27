import {
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
  INodeExecutionData,
  IDataObject,
} from 'n8n-workflow';

import { MaxBotApiClient } from '../../api/MaxBotApiClient';
import { maxBotTriggerPollingDescription } from './MaxBotTriggerPolling.node.description';

export class MaxBotTriggerPolling implements INodeType {
  description: INodeTypeDescription = maxBotTriggerPollingDescription;

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][]> {
    const credentials = await this.getCredentials('maxBotApi');
    const token = credentials.token as string;
    const baseUrl = (credentials.baseUrl as string) || 'https://platform-api2.max.ru';

    const events = this.getNodeParameter('events', []) as string[];
    const limit = this.getNodeParameter('limit', 10) as number;

    const client = new MaxBotApiClient(token, baseUrl);
    client.helpers = this.helpers as unknown as { httpRequest: (opts: unknown) => Promise<unknown> };

    const staticData = this.getWorkflowStaticData('node');
    const marker = (staticData.marker as number) || undefined;

    const result = await client.getUpdates({
      limit,
      timeout: 30,
      marker,
      types: events.join(','),
    });

    if (result.marker) {
      staticData.marker = result.marker;
    }

    const updates = result.updates || [];

    if (updates.length === 0) {
      return [[]] as INodeExecutionData[][];
    }

    return [
      updates.map((update) => ({
        json: update as unknown as IDataObject,
        pairedItem: { item: 0 },
      })),
    ];
  }
}
