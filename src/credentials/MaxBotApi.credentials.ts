import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MaxBotApi implements ICredentialType {
  name = 'maxBotApi';
  displayName = 'MAX Bot API';
  documentationUrl = 'https://dev.max.ru/';
  properties: INodeProperties[] = [
    {
      displayName: 'Bot Token',
      name: 'token',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Токен бота из раздела "Чат-боты" на платформе MAX',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://platform-api2.max.ru',
      required: true,
      description: 'Базовый URL API (не менять без необходимости)',
    },
  ];
}
