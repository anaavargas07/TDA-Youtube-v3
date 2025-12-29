
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
}

export type MovieStatus = 'Playlist' | 'Download' | 'Copyright Check' | 'Visual Copyright' | 'Audio Copyright' | 'Strike Check' | 'Done';

export interface Movie {
  id: string;
  name: string;
  addedAt: string;
  channel3DId: string; // Legacy support
  channel2DId: string; // Legacy support
  channel3DIds?: string[]; // Multi-tag support
  channel2DIds?: string[]; // Multi-tag support
  status: MovieStatus;
  note?: string;
}

export interface YouTubeData {
  channelStats: ChannelStats;
  videos: VideoStat[];
}

export type SortOrder = 'date' | 'viewCount' | 'likeCount';
export type SortDirection = 'asc' | 'desc';

export interface ChannelGroup {
  id:string;
  name: string;
  channelIds: string[];
  createdAt: string;
}

export interface ChannelComparisonData extends ChannelStats {}

export type KeyStatus = 'unknown' | 'checking' | 'valid' | 'invalid' | 'quota_exceeded';

export interface ApiKey {
  value: string;
  status: KeyStatus;
  error?: string;
  dailyUsage?: number;
  lastUsedDate?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  avatar_url?: string;
}

export interface AppSettings {
    refreshInterval: number; // in milliseconds, 0 = off
    rowsPerPage: number;
}
