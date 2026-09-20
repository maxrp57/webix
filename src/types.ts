export type FlowStatus = '🟢' | '🔴' | '🟡';

export interface BotInfo {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar: string | null;
  inviteUrl?: string;
}

export interface BotStatusResponse {
  configured: boolean;
  valid: boolean;
  bot?: BotInfo;
  message?: string;
  error?: string;
  channelId?: string;
  defaultEnvChannelId?: string;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position?: number;
  parentId?: string;
}

export interface StatusHistoryItem {
  id: string;
  status: FlowStatus;
  timestamp: string;
  messageId: string;
  channelId: string;
  action: 'send' | 'edit';
}

export interface TrackingState {
  currentChannelId: string;
  currentMessageId: string;
  currentStatus: FlowStatus | '';
  lastUpdated: string | null;
  history: StatusHistoryItem[];
}
