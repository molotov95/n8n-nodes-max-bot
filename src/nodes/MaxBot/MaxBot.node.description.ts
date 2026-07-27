import { INodeTypeDescription } from 'n8n-workflow';

export const maxBotDescription: INodeTypeDescription = {
  displayName: 'MAX Bot',
  name: 'maxBot',
  icon: 'file:max.svg',
  group: ['output'],
  version: 1,
  subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
  description: 'Send messages, manage chats, upload files via MAX Bot API',
  defaults: { name: 'MAX Bot' },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [{ name: 'maxBotApi', required: true }],
  properties: [
    // ── Resource ──
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      noDataExpression: true,
      options: [
        { name: 'Message', value: 'message' },
        { name: 'Chat', value: 'chat' },
        { name: 'File', value: 'file' },
        { name: 'Pin', value: 'pin' },
        { name: 'Action', value: 'action' },
        { name: 'Bot', value: 'bot' },
      ],
      default: 'message',
    },

    // ═══════════════════════════════════════════
    // MESSAGE
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['message'] } },
      options: [
        { name: 'Send to Chat', value: 'sendToChat', description: 'Send a message to a chat' },
        { name: 'Send to User', value: 'sendToUser', description: 'Send a message to a user' },
        { name: 'Edit', value: 'edit', description: 'Edit an existing message' },
        { name: 'Delete', value: 'delete', description: 'Delete a message' },
        { name: 'Get', value: 'get', description: 'Get a message by ID' },
        { name: 'Get Many', value: 'getMany', description: 'Get multiple messages from a chat' },
      ],
      default: 'sendToChat',
    },

    // Send to Chat
    {
      displayName: 'Chat ID',
      name: 'chatId',
      type: 'number',
      required: true,
      displayOptions: { show: { resource: ['message'], operation: ['sendToChat', 'getMany'] } },
      default: undefined,
      description: 'ID of the chat to send message to',
    },
    {
      displayName: 'Text',
      name: 'text',
      type: 'string',
      typeOptions: { rows: 4 },
      required: true,
      displayOptions: { show: { resource: ['message'], operation: ['sendToChat', 'sendToUser'] } },
      default: '',
      description: 'Message text',
    },
    // Edit
    {
      displayName: 'Text',
      name: 'text',
      type: 'string',
      typeOptions: { rows: 4 },
      displayOptions: { show: { resource: ['message'], operation: ['edit'] } },
      default: '',
      description: 'New text for the message (leave empty to keep current)',
    },
    // Send to User
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'number',
      required: true,
      displayOptions: { show: { resource: ['message'], operation: ['sendToUser'] } },
      default: undefined,
      description: 'ID of the user to send message to',
    },
    // Edit / Delete / Get
    {
      displayName: 'Message ID',
      name: 'messageId',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          resource: ['message'],
          operation: ['edit', 'delete', 'get'],
        },
      },
      default: '',
      description: 'ID of the message',
    },
    // Get Many options
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['message'], operation: ['getMany'] } },
      default: {},
      options: [
        {
          displayName: 'Message IDs',
          name: 'messageIds',
          type: 'string',
          default: '',
          description: 'Comma-separated list of message IDs',
        },
        {
          displayName: 'From',
          name: 'from',
          type: 'number',
          default: undefined,
          description: 'Starting sequence number',
        },
        {
          displayName: 'To',
          name: 'to',
          type: 'number',
          default: undefined,
          description: 'Ending sequence number',
        },
        {
          displayName: 'Count',
          name: 'count',
          type: 'number',
          default: 50,
          description: 'Max number of messages to return',
        },
      ],
    },
    // Common message options
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['message'], operation: ['sendToChat', 'sendToUser'] } },
      default: {},
      options: [
        {
          displayName: 'Format',
          name: 'format',
          type: 'options',
          options: [
            { name: 'Plain Text', value: '' },
            { name: 'Markdown', value: 'markdown' },
            { name: 'HTML', value: 'html' },
          ],
          default: '',
          description: 'Text formatting mode',
        },
        {
          displayName: 'Reply to Message ID',
          name: 'linkMid',
          type: 'string',
          default: '',
          description: 'ID of the message to reply to',
        },
        {
          displayName: 'Notify',
          name: 'notify',
          type: 'boolean',
          default: false,
          description: 'Whether to send with sound notification',
        },
        {
          displayName: 'Inline Keyboard',
          name: 'inlineKeyboard',
          type: 'json',
          default: '[]',
          description: 'JSON array of button rows. Example: [[{"type":"callback","text":"Button","payload":"data"}]]',
        },
      ],
    },
    // Edit message options
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['message'], operation: ['edit'] } },
      default: {},
      options: [
        {
          displayName: 'Format',
          name: 'format',
          type: 'options',
          options: [
            { name: 'Plain Text', value: '' },
            { name: 'Markdown', value: 'markdown' },
            { name: 'HTML', value: 'html' },
          ],
          default: '',
        },
      ],
    },

    // ═══════════════════════════════════════════
    // CHAT
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['chat'] } },
      options: [
        { name: 'Get', value: 'get', description: 'Get chat by ID' },
        { name: 'Get by Link', value: 'getByLink', description: 'Get chat by invite link' },
        { name: 'List', value: 'list', description: 'List all chats' },
        { name: 'Edit', value: 'edit', description: 'Edit chat info' },
        { name: 'Get Members', value: 'getMembers', description: 'Get chat members' },
        { name: 'Add Members', value: 'addMembers', description: 'Add members to chat' },
        { name: 'Remove Member', value: 'removeMember', description: 'Remove a member from chat' },
        { name: 'Get Admins', value: 'getAdmins', description: 'Get chat admins' },
        { name: 'Get Membership', value: 'getMembership', description: 'Get own membership info' },
      ],
      default: 'get',
    },
    {
      displayName: 'Chat ID',
      name: 'chatId',
      type: 'number',
      required: true,
      displayOptions: {
        show: { resource: ['chat'], operation: ['get', 'edit', 'getMembers', 'addMembers', 'removeMember', 'getAdmins', 'getMembership'] },
      },
      default: undefined,
      description: 'ID of the chat',
    },
    {
      displayName: 'Link',
      name: 'link',
      type: 'string',
      required: true,
      displayOptions: { show: { resource: ['chat'], operation: ['getByLink'] } },
      default: '',
      description: 'Invite link of the chat',
    },
    // List options
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      displayOptions: { show: { resource: ['chat'], operation: ['list'] } },
      default: false,
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      displayOptions: { show: { resource: ['chat'], operation: ['list'], returnAll: [false] } },
      typeOptions: { minValue: 1, maxValue: 100 },
      default: 10,
      description: 'Max number of results to return',
    },
    {
      displayName: 'Marker',
      name: 'marker',
      type: 'string',
      displayOptions: { show: { resource: ['chat'], operation: ['list'] } },
      default: '',
      description: 'Pagination marker (from previous response)',
    },
    // Edit chat options
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['chat'], operation: ['edit'] } },
      default: {},
      options: [
        {
          displayName: 'Title',
          name: 'title',
          type: 'string',
          default: '',
          description: 'New chat title',
        },
      ],
    },
    // Add members
    {
      displayName: 'User IDs',
      name: 'userIds',
      type: 'string',
      required: true,
      displayOptions: { show: { resource: ['chat'], operation: ['addMembers'] } },
      default: '',
      description: 'Comma-separated list of user IDs to add',
    },
    // Remove member
    {
      displayName: 'User ID',
      name: 'userId',
      type: 'number',
      required: true,
      displayOptions: { show: { resource: ['chat'], operation: ['removeMember'] } },
      default: undefined,
      description: 'ID of the user to remove',
    },
    // Members options
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['chat'], operation: ['getMembers'] } },
      default: {},
      options: [
        {
          displayName: 'User IDs',
          name: 'userIds',
          type: 'string',
          default: '',
          description: 'Comma-separated list of user IDs to filter',
        },
        {
          displayName: 'Count',
          name: 'count',
          type: 'number',
          default: 50,
          description: 'Max number of members to return',
        },
        {
          displayName: 'Marker',
          name: 'marker',
          type: 'string',
          default: '',
          description: 'Pagination marker',
        },
      ],
    },

    // ═══════════════════════════════════════════
    // FILE
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['file'] } },
      options: [
        { name: 'Upload Image', value: 'uploadImage', description: 'Upload an image' },
        { name: 'Upload Video', value: 'uploadVideo', description: 'Upload a video' },
        { name: 'Upload Audio', value: 'uploadAudio', description: 'Upload an audio file' },
        { name: 'Upload File', value: 'uploadFile', description: 'Upload a generic file/document' },
      ],
      default: 'uploadImage',
    },
    {
      displayName: 'Binary Property',
      name: 'binaryPropertyName',
      type: 'string',
      required: true,
      displayOptions: { show: { resource: ['file'] } },
      default: 'data',
      description: 'Name of the binary property containing the file data',
    },

    // ═══════════════════════════════════════════
    // PIN
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['pin'] } },
      options: [
        { name: 'Pin Message', value: 'pin', description: 'Pin a message in a chat' },
        { name: 'Unpin Message', value: 'unpin', description: 'Unpin the current message' },
        { name: 'Get Pinned Message', value: 'getPinned', description: 'Get the currently pinned message' },
      ],
      default: 'pin',
    },
    {
      displayName: 'Chat ID',
      name: 'chatId',
      type: 'number',
      required: true,
      displayOptions: { show: { resource: ['pin'] } },
      default: undefined,
      description: 'ID of the chat',
    },
    {
      displayName: 'Message ID',
      name: 'messageId',
      type: 'string',
      required: true,
      displayOptions: { show: { resource: ['pin'], operation: ['pin'] } },
      default: '',
      description: 'ID of the message to pin',
    },
    {
      displayName: 'Additional Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add Option',
      displayOptions: { show: { resource: ['pin'], operation: ['pin'] } },
      default: {},
      options: [
        {
          displayName: 'Notify',
          name: 'notify',
          type: 'boolean',
          default: false,
          description: 'Whether to notify chat members about the pin',
        },
      ],
    },

    // ═══════════════════════════════════════════
    // ACTION
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['action'] } },
      options: [
        { name: 'Send Typing', value: 'sendTyping', description: 'Send "typing" indicator' },
        { name: 'Leave Chat', value: 'leaveChat', description: 'Leave a chat' },
      ],
      default: 'sendTyping',
    },
    {
      displayName: 'Chat ID',
      name: 'chatId',
      type: 'number',
      required: true,
      displayOptions: { show: { resource: ['action'] } },
      default: undefined,
      description: 'ID of the chat',
    },

    // ═══════════════════════════════════════════
    // BOT
    // ═══════════════════════════════════════════
    {
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      noDataExpression: true,
      displayOptions: { show: { resource: ['bot'] } },
      options: [
        { name: 'Get Info', value: 'getInfo', description: 'Get bot information' },
        { name: 'Set Commands', value: 'setCommands', description: 'Set bot commands' },
      ],
      default: 'getInfo',
    },
    {
      displayName: 'Commands',
      name: 'commands',
      type: 'json',
      required: true,
      displayOptions: { show: { resource: ['bot'], operation: ['setCommands'] } },
      default: '[{"name":"start","description":"Start the bot"}]',
      description: 'JSON array of commands: [{"name":"start","description":"Start"}]',
    },
  ],
};
