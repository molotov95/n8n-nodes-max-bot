import { IDataObject, IWebhookFunctions, IWebhookResponseData } from 'n8n-workflow';

export async function registerWebhook(this: IWebhookFunctions): Promise<void> {
  const webhookUrl = this.getNodeWebhookUrl('default') as string;
  const credentials = await this.getCredentials('maxBotApi');
  const token = credentials.token as string;
  const baseUrl = (credentials.baseUrl as string) || 'https://platform-api2.max.ru';

  const events = this.getNodeParameter('events', []) as string[];
  const secret = this.getNodeParameter('secret', '') as string;
  const environment = this.getNodeParameter('environment', 'production') as string;

  if (environment === 'production' && !webhookUrl.startsWith('https://')) {
    throw new Error(
      `Webhook URL must use HTTPS in production mode. Got: ${webhookUrl}. ` +
      'Use "Development" environment for local testing via ngrok/tunnel.',
    );
  }

  const body: Record<string, unknown> = {
    url: webhookUrl,
    update_types: events,
  };
  if (secret) body.secret = secret;

  const response = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(
      `Failed to register webhook: ${error.message || response.statusText}. ` +
      'Make sure your n8n instance is accessible from the internet.',
    );
  }

  const webhookData = this.getWorkflowStaticData('node');
  webhookData.subscribed = true;
  webhookData.url = webhookUrl;
}

export async function unregisterWebhook(this: IWebhookFunctions): Promise<void> {
  const webhookData = this.getWorkflowStaticData('node');
  webhookData.subscribed = false;
}

export async function handleWebhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
  const req = this.getRequestObject();
    const body = req.body as IDataObject;

  const secret = this.getNodeParameter('secret', '') as string;
  if (secret) {
    const headerSecret = req.headers['x-max-bot-api-secret'] as string;
    if (headerSecret !== secret) {
      return { noWebhookResponse: true };
    }
  }

  return {
    workflowData: [
      [
        {
          json: body,
          pairedItem: { item: 0 },
        },
      ],
    ],
  };
}
