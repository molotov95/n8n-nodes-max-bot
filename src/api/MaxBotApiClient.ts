import {
  MaxError,
  Message,
  Chat,
  ChatMember,
  BotInfo,
  BotCommand,
  ActionResponse,
  UploadUrlResponse,
  GetAllChatsResponse,
  GetChatMembersResponse,
  GetMessagesResponse,
  SendMessageResponse,
} from './types';

export interface HttpHelpers {
  httpRequest: (opts: unknown) => Promise<unknown>;
}

export class MaxBotApiClient {
  private baseUrl: string;
  private token: string;
  private _helpers?: HttpHelpers;

  constructor(token: string, baseUrl?: string) {
    this.baseUrl = baseUrl || 'https://platform-api2.max.ru';
    this.token = token;
  }

  set helpers(h: HttpHelpers) {
    this._helpers = h;
  }

  get helpers(): HttpHelpers {
    if (!this._helpers) throw new Error('MaxBotApiClient: helpers not set. Call client.helpers = ctx.helpers first.');
    return this._helpers;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: object;
      query?: Record<string, string | number | boolean | undefined>;
      pathParams?: Record<string, string | number>;
    },
  ): Promise<T> {
    let url = `${this.baseUrl}/${path}`;

    if (options?.pathParams) {
      for (const [key, value] of Object.entries(options.pathParams)) {
        url = url.replace(`{${key}}`, String(value));
      }
    }

    if (options?.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: this.token,
      'Content-Type': 'application/json',
    };

    const res = await this.helpers.httpRequest({
      method,
      url,
      headers,
      body: options?.body,
      json: true,
      returnFullResponse: true,
    }) as { statusCode: number; body: unknown; headers: Record<string, string> };

    if (res.statusCode !== 200) {
      throw new MaxError(res.statusCode, res.body as { code: string; message: string });
    }

    return res.body as T;
  }

  async requestUploadUrl(uploadType: string): Promise<UploadUrlResponse> {
    return this.request<UploadUrlResponse>('POST', 'uploads', {
      query: { type: uploadType },
    });
  }

  static async requestUpload(url: string, body: Buffer, fileName: string): Promise<globalThis.Response> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(body)]);
    formData.append('data', blob, fileName);

    return fetch(url, { method: 'POST', body: formData });
  }

  // ── Messages ──

  async sendMessageToChat(
    chatId: number,
    text: string,
    extra?: Record<string, unknown>,
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('POST', 'messages', {
      query: { chat_id: chatId },
      body: { text, ...extra },
    });
  }

  async sendMessageToUser(
    userId: number,
    text: string,
    extra?: Record<string, unknown>,
  ): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('POST', 'messages', {
      query: { user_id: userId },
      body: { text, ...extra },
    });
  }

  async editMessage(
    messageId: string,
    extra?: Record<string, unknown>,
  ): Promise<ActionResponse> {
    return this.request<ActionResponse>('PUT', 'messages', {
      query: { message_id: messageId },
      body: extra || {},
    });
  }

  async deleteMessage(messageId: string): Promise<ActionResponse> {
    return this.request<ActionResponse>('DELETE', 'messages', {
      query: { message_id: messageId },
    });
  }

  async getMessage(messageId: string): Promise<Message> {
    return this.request<Message>('GET', `messages/${messageId}`);
  }

  async getMessages(
    chatId: number,
    options?: {
      message_ids?: string;
      from?: number;
      to?: number;
      count?: number;
    },
  ): Promise<GetMessagesResponse> {
    return this.request<GetMessagesResponse>('GET', 'messages', {
      query: { chat_id: chatId, ...options },
    });
  }

  // ── Chats ──

  async getChat(chatId: number): Promise<Chat> {
    return this.request<Chat>('GET', `chats/${chatId}`);
  }

  async getChatByLink(link: string): Promise<Chat> {
    return this.request<Chat>('GET', `chats/${link}`);
  }

  async listChats(options?: {
    count?: number;
    marker?: string;
  }): Promise<GetAllChatsResponse> {
    return this.request<GetAllChatsResponse>('GET', 'chats', { query: options });
  }

  async editChat(
    chatId: number,
    body: Record<string, unknown>,
  ): Promise<Chat> {
    return this.request<Chat>('PATCH', `chats/${chatId}`, { body });
  }

  async getChatMembers(
    chatId: number,
    options?: {
      user_ids?: string;
      count?: number;
      marker?: string;
    },
  ): Promise<GetChatMembersResponse> {
    return this.request<GetChatMembersResponse>('GET', `chats/${chatId}/members`, {
      query: options,
    });
  }

  async addChatMembers(chatId: number, userIds: number[]): Promise<ActionResponse> {
    return this.request<ActionResponse>('POST', `chats/${chatId}/members`, {
      body: { user_ids: userIds },
    });
  }

  async removeChatMember(chatId: number, userId: number): Promise<ActionResponse> {
    return this.request<ActionResponse>('DELETE', `chats/${chatId}/members`, {
      body: { user_id: userId },
    });
  }

  async getChatAdmins(chatId: number): Promise<GetChatMembersResponse> {
    return this.request<GetChatMembersResponse>('GET', `chats/${chatId}/members/admins`);
  }

  async getChatMembership(chatId: number): Promise<ChatMember> {
    return this.request<ChatMember>('GET', `chats/${chatId}/members/me`);
  }

  // ── Pins ──

  async pinMessage(
    chatId: number,
    messageId: string,
    notify?: boolean,
  ): Promise<ActionResponse> {
    return this.request<ActionResponse>('PUT', `chats/${chatId}/pin`, {
      body: { message_id: messageId, notify },
    });
  }

  async unpinMessage(chatId: number): Promise<ActionResponse> {
    return this.request<ActionResponse>('DELETE', `chats/${chatId}/pin`);
  }

  async getPinnedMessage(chatId: number): Promise<{ message: Message | null }> {
    return this.request<{ message: Message | null }>('GET', `chats/${chatId}/pin`);
  }

  // ── Actions ──

  async sendAction(chatId: number, action: string): Promise<ActionResponse> {
    return this.request<ActionResponse>('POST', `chats/${chatId}/actions`, {
      body: { action },
    });
  }

  async leaveChat(chatId: number): Promise<ActionResponse> {
    return this.request<ActionResponse>('DELETE', `chats/${chatId}/members/me`);
  }

  // ── Bot ──

  async getBotInfo(): Promise<BotInfo> {
    return this.request<BotInfo>('GET', 'me');
  }

  async setCommands(commands: BotCommand[]): Promise<{ commands: BotCommand[] }> {
    return this.request<{ commands: BotCommand[] }>('PATCH', 'me/commands', {
      body: { commands },
    });
  }

  // ── Subscriptions ──

  async getUpdates(options?: {
    limit?: number;
    timeout?: number;
    marker?: number;
    types?: string;
  }): Promise<{ updates: Record<string, unknown>[]; marker: number }> {
    return this.request<{ updates: Record<string, unknown>[]; marker: number }>('GET', 'updates', {
      query: options,
    });
  }

  async createSubscription(
    url: string,
    updateTypes: string[],
    secret?: string,
  ): Promise<void> {
    const body: Record<string, unknown> = { url, update_types: updateTypes };
    if (secret) body.secret = secret;
    await this.request<unknown>('POST', 'subscriptions', { body });
  }
}
