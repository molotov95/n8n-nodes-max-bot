import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
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

async function uploadFile(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  uploadType: string,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;

    const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
    const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

    try {
      const uploadInfo = await client.requestUploadUrl(uploadType);
      const uploadRes = await MaxBotApiClient.requestUpload(
        uploadInfo.url,
        buffer,
        binaryData.fileName || 'file',
      );

      if (!uploadRes.ok) {
        throw new NodeOperationError(
          this.getNode(),
          `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
        );
      }

      const token = uploadInfo.token || '';
      const attachment = { type: uploadType, payload: { token } };

      results.push({
        json: { attachment, token },
        pairedItem: { item: i },
      });
    } catch (error) {
      handleApiError(this, error);
    }
  }

  return results;
}

export async function uploadImage(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  return uploadFile.call(this, client, 'image');
}

export async function uploadVideo(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  return uploadFile.call(this, client, 'video');
}

export async function uploadAudio(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  return uploadFile.call(this, client, 'audio');
}

export async function uploadDoc(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
): Promise<INodeExecutionData[]> {
  return uploadFile.call(this, client, 'file');
}

export async function fileActions(
  this: IExecuteFunctions,
  client: MaxBotApiClient,
  operation: string,
): Promise<INodeExecutionData[]> {
  switch (operation) {
    case 'uploadImage':
      return uploadImage.call(this, client);
    case 'uploadVideo':
      return uploadVideo.call(this, client);
    case 'uploadAudio':
      return uploadAudio.call(this, client);
    case 'uploadFile':
      return uploadDoc.call(this, client);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
