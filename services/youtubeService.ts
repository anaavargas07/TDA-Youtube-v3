
import { ChannelStats, VideoStat, KeyStatus, ApiKey } from '../types';
import { supabase } from '../lib/supabase';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

let apiKeys: ApiKey[] = [];
let currentKeyIndex = 0;
let onKeyIndexChangeCallback: ((index: number) => void) | null = null;

const QUOTA_COSTS: Record<string, number> = {
    'channels': 1,
    'playlistItems': 1,
    'videos': 1,
    'search': 100,
    'i18nLanguages': 1,
};

let sessionQuotaUsed = 0;
let onQuotaChangeCallback: ((quota: { session: number, daily: number }) => void) | null = null;

export const setOnQuotaChange = (callback: (quota: { session: number, daily: number }) => void) => {
    onQuotaChangeCallback = callback;
};

const getTotalDailyUsage = () => {
    return apiKeys.reduce((total, key) => total + (key.dailyUsage || 0), 0);
};

export const getInitialQuota = () => {
    return { session: sessionQuotaUsed, daily: getTotalDailyUsage() };
};

export const setApiKeys = (keys: ApiKey[]) => {
    apiKeys = keys.map(newKey => {
        const existing = apiKeys.find(k => k.value === newKey.value);
        if (existing) {
            return { ...newKey, dailyUsage: newKey.dailyUsage ?? existing.dailyUsage ?? 0 };
        }
        return { ...newKey, dailyUsage: newKey.dailyUsage ?? 0 };
    });

    if (currentKeyIndex >= apiKeys.length) {
        currentKeyIndex = 0;
    }
    
    if (onQuotaChangeCallback) {
        onQuotaChangeCallback({ session: sessionQuotaUsed, daily: getTotalDailyUsage() });
    }
};

export const setOnKeyIndexChange = (callback: (index: number) => void) => {
    onKeyIndexChangeCallback = callback;
};

const updateKeyUsage = async (keyIndex: number, cost: number) => {
    const keyObj = apiKeys[keyIndex];
    if (!keyObj) return;

    const newUsage = (keyObj.dailyUsage || 0) + cost;
    apiKeys[keyIndex] = { ...keyObj, dailyUsage: newUsage };
    sessionQuotaUsed += cost;

    if (onQuotaChangeCallback) {
        onQuotaChangeCallback({ session: sessionQuotaUsed, daily: getTotalDailyUsage() });
    }

    const today = new Date().toISOString().split('T')[0];
    supabase.from('api_keys')
        .update({ daily_usage: newUsage, last_used_date: today })
        .eq('key_value', keyObj.value)
        .then(({ error }) => {
            if (error) console.error("Failed to sync quota to DB:", error.message || error);
        });
};

const fetchYouTubeAPI = async (endpoint: string, params: Record<string, string>): Promise<any> => {
    if (apiKeys.length === 0) {
        throw new Error('Please configure at least one YouTube Data API key in Settings.');
    }
    
    const cost = QUOTA_COSTS[endpoint] || 1; 
    const startIndex = currentKeyIndex;
    let lastError: Error | null = null;

    for (let i = 0; i < apiKeys.length; i++) {
        const keyIndex = (startIndex + i) % apiKeys.length;
        const apiKeyObj = apiKeys[keyIndex];

        if ((apiKeyObj.dailyUsage || 0) + cost > 10000) continue;

        try {
            const query = new URLSearchParams({ ...params, key: apiKeyObj.value }).toString();
            const response = await fetch(`${API_BASE_URL}/${endpoint}?${query}`);

            if (!response.ok) {
                const errorData = await response.json();
                const reason = errorData.error?.errors?.[0]?.reason;
                const message = errorData.error?.message || 'An unknown API error occurred.';
                lastError = new Error(message);
                
                if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') continue; 
                throw lastError; // For other errors like 404, throw immediately
            }

            updateKeyUsage(keyIndex, cost);
            
            // **FIX**: Stick with the current key if it's successful
            // Only change when an error (like quota exceeded) occurs, which the loop handles
            currentKeyIndex = keyIndex;
            if (onKeyIndexChangeCallback) onKeyIndexChangeCallback(keyIndex);
            
            return await response.json();

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            lastError = error instanceof Error ? error : new Error(errorMsg);
            // If it's a structural error (not quota), we might want to throw or continue.
            // For add channel, we want to know if it's a real 404.
            if (errorMsg.includes('Channel not found')) throw error;
        }
    }
    throw new Error(`API Request failed. ${lastError?.message || 'Check your connection or API keys.'}`);
};

export const validateYouTubeApiKey = async (key: string): Promise<{ status: KeyStatus; error?: string }> => {
    if (!key || key.trim() === '') return { status: 'invalid', error: 'Key cannot be empty.' };
    try {
        const params = new URLSearchParams({ part: 'id', id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', key: key });
        const response = await fetch(`${API_BASE_URL}/channels?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json();
            const reason = errorData.error?.errors?.[0]?.reason;
            if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') return { status: 'quota_exceeded', error: 'Quota Exceeded' };
            return { status: 'invalid', error: errorData.error?.message || 'Invalid key' };
        }
        return { status: 'valid' };
    } catch (err: any) {
        return { status: 'invalid', error: err.message };
    }
};

async function resolveChannelId(channelIdentifier: string): Promise<string> {
    if (channelIdentifier.startsWith('UC')) return channelIdentifier;
    try {
        const data = await fetchYouTubeAPI('channels', { part: 'id', forUsername: channelIdentifier });
        if (data.items && data.items.length > 0) return data.items[0].id;
    } catch (error) {}
    try {
        const searchData = await fetchYouTubeAPI('search', { part: 'snippet', q: channelIdentifier, type: 'channel', maxResults: '1' });
        if (searchData.items && searchData.items.length > 0) return searchData.items[0].snippet.channelId;
    } catch (error) {}
    // If not found, return original string if it looks like a custom name, handle parsing elsewhere
    return channelIdentifier; 
}

/**
 * Lấy video đầu tiên tuyệt đối của kênh bằng Search API.
 */
export const getAbsoluteOldestVideo = async (channelId: string, channelPublishedAt: string): Promise<VideoStat | null> => {
    try {
        const startDate = new Date(channelPublishedAt);
        startDate.setHours(startDate.getHours() - 12);

        const data = await fetchYouTubeAPI('search', {
            part: 'snippet',
            channelId: channelId,
            type: 'video',
            order: 'date',
            publishedAfter: startDate.toISOString(),
            maxResults: '50'
        });

        if (!data.items || data.items.length === 0) return null;

        const items = data.items.map((item: any) => ({
            id: item.id.videoId,
            publishedAt: item.snippet.publishedAt,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            viewCount: '0', likeCount: '0', commentCount: '0',
        }));

        items.sort((a: any, b: any) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        return items[0];
    } catch (error) {
        return null;
    }
};

/**
 * Lấy video mới nhất bằng cách truy vấn Playlist Uploads.
 */
export const getAbsoluteNewestVideo = async (uploadsPlaylistId: string): Promise<VideoStat | null> => {
    try {
        const playlistData = await fetchYouTubeAPI('playlistItems', {
            part: 'snippet',
            playlistId: uploadsPlaylistId,
            maxResults: '1'
        });

        if (!playlistData.items || playlistData.items.length === 0) return null;
        
        const videoId = playlistData.items[0].snippet.resourceId.videoId;
        const statsData = await fetchYouTubeAPI('videos', { 
            part: 'snippet,statistics', 
            id: videoId 
        });

        if (!statsData.items || statsData.items.length === 0) return null;
        const item = statsData.items[0];

        return {
            id: item.id,
            publishedAt: item.snippet.publishedAt,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            commentCount: item.statistics.commentCount,
        };
    } catch (error) {
        return null;
    }
};

export const getChannelStats = async (channelIdentifier: string): Promise<ChannelStats> => {
    const resolvedId = await resolveChannelId(channelIdentifier);
    
    try {
        const channelData = await fetchYouTubeAPI('channels', { part: 'snippet,statistics,contentDetails', id: resolvedId });

        if (!channelData.items || channelData.items.length === 0) {
             throw new Error('NOT_FOUND');
        }

        const channel = channelData.items[0];
        const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

        const [newest, oldest] = await Promise.all([
            getAbsoluteNewestVideo(uploadsPlaylistId),
            getAbsoluteOldestVideo(channel.id, channel.snippet.publishedAt)
        ]);

        return {
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            customUrl: channel.snippet.customUrl || '',
            publishedAt: channel.snippet.publishedAt,
            thumbnailUrl: channel.snippet.thumbnails.high.url,
            subscriberCount: channel.statistics.subscriberCount,
            videoCount: channel.statistics.videoCount,
            viewCount: channel.statistics.viewCount,
            uploadsPlaylistId: uploadsPlaylistId,
            history: [],
            newestVideo: newest,
            oldestVideo: oldest,
            status: 'active'
        };
    } catch (error: any) {
        // Return a shell object for terminated/invalid channels
        return {
            id: resolvedId.startsWith('UC') ? resolvedId : 'INVALID_ID',
            title: resolvedId,
            description: 'Channel unavailable or terminated.',
            customUrl: resolvedId,
            publishedAt: new Date().toISOString(),
            thumbnailUrl: 'https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg',
            subscriberCount: '0',
            videoCount: '0',
            viewCount: '0',
            uploadsPlaylistId: '',
            history: [],
            status: 'terminated'
        };
    }
};

export const getChannelStatsBatch = async (channelIds: string[]): Promise<Partial<ChannelStats>[]> => {
    if (!channelIds || channelIds.length === 0) return [];
    const results: Partial<ChannelStats>[] = [];
    for (let i = 0; i < channelIds.length; i += 50) {
        const chunk = channelIds.slice(i, i + 50);
        try {
            const data = await fetchYouTubeAPI('channels', { part: 'snippet,statistics,contentDetails', id: chunk.join(','), maxResults: '50' });
            if (data.items) {
                results.push(...data.items.map((item: any) => ({
                    id: item.id, title: item.snippet.title, description: item.snippet.description,
                    customUrl: item.snippet.customUrl || '', publishedAt: item.snippet.publishedAt,
                    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
                    subscriberCount: item.statistics.subscriberCount, videoCount: item.statistics.videoCount,
                    viewCount: item.statistics.viewCount, uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
                    status: 'active' as const
                })));
            }
            // Handle missing IDs in the batch if needed (not strictly required by YouTube API as it just omits them)
        } catch (error) { console.error("Error fetching batch channel stats:", error); }
    }
    return results;
}

export const getChannelVideos = async (playlistId: string, maxResults: number, pageToken?: string): Promise<{ videos: VideoStat[], nextPageToken?: string }> => {
    const playlistParams: Record<string, string> = { part: 'snippet', playlistId: playlistId, maxResults: String(maxResults) };
    if (pageToken) playlistParams.pageToken = pageToken;
    const playlistData = await fetchYouTubeAPI('playlistItems', playlistParams);
    if (!playlistData.items || playlistData.items.length === 0) return { videos: [], nextPageToken: undefined };

    const videoIds = playlistData.items.map((item: any) => item.snippet?.resourceId?.videoId).filter(Boolean).join(',');
    if (!videoIds) return { videos: [], nextPageToken: playlistData.nextPageToken };

    const videosData = await fetchYouTubeAPI('videos', { part: 'snippet,statistics', id: videoIds });
    const videoDataMap = new Map(videosData.items.map((item: any) => [item.id, item]));
    const originalOrderVideoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId);

    const videos: VideoStat[] = originalOrderVideoIds.map((id: string) => {
        const item: any = videoDataMap.get(id);
        if (!item) return null;
        return {
            id: item.id, publishedAt: item.snippet.publishedAt, title: item.snippet.title,
            description: item.snippet.description, thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
            viewCount: item.statistics.viewCount, likeCount: item.statistics.likeCount, commentCount: item.statistics.commentCount,
        };
    }).filter((v): v is VideoStat => v !== null);
    return { videos, nextPageToken: playlistData.nextPageToken };
};
