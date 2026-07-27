import {
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';

import { maxBotTriggerDescription } from './MaxBotTrigger.node.description';
import { registerWebhook, handleWebhook } from '../../transport/webhook';

export class MaxBotTrigger implements INodeType {
  description: INodeTypeDescription = maxBotTriggerDescription;

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    return handleWebhook.call(this);
  }

  async webhookActivate(this: IWebhookFunctions): Promise<void> {
    await registerWebhook.call(this);
  }
}
