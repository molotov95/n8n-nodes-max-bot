export interface MessageBody {
  mid: string;
  seq: number;
  text: string | null;
  attachments: Attachment[] | null;
  markup?: MarkupElement[] | null;
}

export interface MessageSender {
  user_id: number;
  name: string;
  username: string | null;
  is_bot: boolean;
  last_activity_time: number;
  avatar_url?: string;
}

export interface MessageRecipient {
  chat_id: number | null;
  chat_type: string;
}

export interface LinkedMessage {
  type: 'forward' | 'reply';
  sender?: MessageSender | null;
  chat_id?: number;
  message: MessageBody;
}

export interface MessageStat {
  views: number;
}

export interface MessageConstructor {
  constructor_type: string;
  data?: Record<string, unknown>;
  input?: string;
}

export interface Message {
  sender?: MessageSender | null;
  recipient: MessageRecipient;
  timestamp: number;
  link?: LinkedMessage | null;
  body: MessageBody;
  stat?: MessageStat | null;
  url?: string | null;
  constructor?: MessageConstructor | null;
}

export interface User {
  user_id: number;
  username?: string | null;
  first_name?: string;
  last_name?: string;
  name?: string;
  is_bot?: boolean;
}

export interface ChatMember {
  user_id: number;
  name: string;
  username: string | null;
  is_bot: boolean;
  last_activity_time: number;
  description?: string | null;
  avatar_url?: string;
  full_avatar_url?: string;
  last_access_time: number;
  is_owner: boolean;
  is_admin: boolean;
  join_time: number;
  permissions: string[] | null;
}

export interface Chat {
  chat_id: number;
  type: string;
  status: string;
  title: string | null;
  icon: { url: string } | null;
  last_event_time: number;
  participants_count: number;
  owner_id?: number | null;
  is_public: boolean;
  link?: string | null;
  description?: string | null;
  messages_count?: number | null;
  chat_message_id?: string | null;
  pinned_message?: object | null;
}

export interface BotCommand {
  name: string;
  description?: string | null;
}

export interface BotInfo extends User {
  user_id: number;
  name: string;
  username: string | null;
  is_bot: boolean;
  last_activity_time: number;
  description?: string | null;
  avatar_url?: string;
  full_avatar_url?: string;
  commands?: BotCommand[] | null;
}

export type AttachmentType =
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'sticker'
  | 'contact'
  | 'share'
  | 'location'
  | 'inline_keyboard';

export interface Attachment {
  type: AttachmentType;
  payload: Record<string, unknown>;
}

export interface Button {
  type: 'callback' | 'link' | 'request_contact' | 'request_geo_location' | 'chat';
  text: string;
  payload?: string;
  intent?: 'default' | 'positive' | 'negative';
  url?: string;
  chat_title?: string;
  chat_description?: string;
  start_payload?: string;
  uuid?: string;
  quick?: boolean;
}

export interface MarkupElement {
  type: 'user_mention';
  from: number;
  length: number;
  user_link?: string;
  user_id?: number;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}

export type UpdateType =
  | 'message_created'
  | 'message_callback'
  | 'message_edited'
  | 'message_removed'
  | 'bot_started'
  | 'bot_added'
  | 'bot_removed'
  | 'user_added'
  | 'user_removed'
  | 'chat_title_changed'
  | 'message_construction_request'
  | 'message_constructed'
  | 'message_chat_created';

export interface Update {
  update_type: UpdateType;
  timestamp: number;
  [key: string]: unknown;
}

export type SenderAction =
  | 'typing_on'
  | 'sending_photo'
  | 'sending_video'
  | 'sending_audio'
  | 'sending_file'
  | 'mark_seen';

export type UploadType = 'image' | 'video' | 'audio' | 'file';

export interface UploadUrlResponse {
  url: string;
  token?: string;
}

export interface GetUpdatesResponse {
  updates: Update[];
  marker: number;
}

export interface GetAllChatsResponse {
  chats: Chat[];
  marker: string;
}

export interface GetChatMembersResponse {
  members: ChatMember[];
  marker: string;
}

export interface GetMessagesResponse {
  messages: Message[];
}

export interface SendMessageResponse {
  message: Message;
}

export class MaxError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: { code: string; message: string },
  ) {
    super(`${status}: ${response.message}`);
    this.name = 'MaxError';
  }
  get code(): string {
    return this.response.code;
  }
  get description(): string {
    return this.response.message;
  }
}
