
export interface DailyMetric {
  date: string; // YYYY-MM-DD
  timestamp: number; // For precise time-based filtering
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

export interface VideoStat {
  id: string;
  publishedAt: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export type MonetizationStatus = 'not_monetized' | 'monetized' | 'demonetized' | 'policy_violation' | 'on_hold';
export type EngagementStatus = 'good' | 'decreased' | 'pause';

export interface ChannelStats {
  id: string;
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  uploadsPlaylistId: string;
  history: DailyMetric[];
  addedAt?: number;
  lastRefreshedAt?: number;
  newestVideo?: VideoStat | null;
  oldestVideo?: VideoStat | null;
  status?: 'active' | 'terminated' | 'error';
  engagementStatus?: EngagementStatus; 
  monetizationStatus?: MonetizationStatus;
}

export type MovieStatus = 'Playlist' | 'Download' | 'Copyright Check' | 'Visual Copyright' | 'Audio Copyright' | 'Strike Check' | 'Done';

export interface Movie {
  id: string;
  name: string;
  addedAt: string;
  channel3DId: string; // Legacy support
  channel2DId: string; // Legacy support
  channel3DIds?: string[]; // Multi-channel support
  channel2DIds?: string[]; // Multi-channel support
  status: MovieStatus;
  note?: string;
}

export interface ChannelGroup {
  id: string;
  name: string;
  channelIds: string[];
  createdAt: string;
  color?: string; // New: Color for the group dot
}

export interface ApiKey {
  value: string;
  status: KeyStatus;
  error?: string;
  dailyUsage?: number;
  lastUsedDate?: string;
}

export type KeyStatus = 'valid' | 'invalid' | 'checking' | 'quota_exceeded' | 'unknown';

export interface AppSettings {
  refreshInterval: number;
  rowsPerPage: number;
}

export type SortOrder = 'date' | 'viewCount' | 'likeCount';
export type SortDirection = 'asc' | 'desc';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: 'admin' | 'user';
}

export interface ChannelComparisonData extends ChannelStats {
    // We reuse ChannelStats and can add comparison-specific fields if needed
}
