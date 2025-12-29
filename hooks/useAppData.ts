
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChannelStats, getChannelVideos, getAbsoluteOldestVideo, getAbsoluteNewestVideo, getChannelStatsBatch } from '../services/youtubeService';
import { extractChannelId, getTodaysDateString } from '../utils/helpers';
import type { ChannelStats, ChannelGroup, ApiKey, Movie, MovieStatus } from '../types';

export interface AddChannelResult {
    identifier: string;
    status: 'success' | 'error';
    message?: string;
    channelTitle?: string;
}

export const useAppData = (session: any) => {
    const [apiKeys, setApiKeysState] = useState<ApiKey[]>([]);
    const [trackedChannels, setTrackedChannels] = useState<ChannelStats[]>([]);
    const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAddingChannel, setIsAddingChannel] = useState(false);

    const apiKeySet = apiKeys.some(k => k.status === 'valid');

    // --- Load Data ---
    useEffect(() => {
        if (!session?.user?.id) { 
            setIsLoading(false); 
            return; 
        }

        const loadUserData = async () => {
            setIsLoading(true);
            try {
                const { data: keys } = await supabase.from('api_keys').select('*');
                if (keys) {
                    const today = new Date().toISOString().split('T')[0];
                    const keysToReset: string[] = [];
                    const processedKeys = keys.map(k => {
                        if (k.last_used_date !== today) {
                            keysToReset.push(k.key_value);
                            return { value: k.key_value, status: k.status as any, dailyUsage: 0, lastUsedDate: today };
                        }
                        return { value: k.key_value, status: k.status as any, dailyUsage: k.daily_usage, lastUsedDate: k.last_used_date };
                    });
                    if (keysToReset.length > 0) {
                        supabase.from('api_keys').update({ daily_usage: 0, last_used_date: today }).in('key_value', keysToReset).then();
                    }
                    setApiKeysState(processedKeys);
                }
                
                const { data: channels } = await supabase.from('tracked_channels').select('*');
                if (channels) {
                  setTrackedChannels(channels.map(c => ({
                    id: c.id, title: c.title, description: c.description, customUrl: c.custom_url || '',
                    thumbnailUrl: c.thumbnail_url, subscriberCount: c.subscriber_count, videoCount: c.video_count,
                    viewCount: c.view_count, publishedAt: c.published_at, uploadsPlaylistId: c.uploads_playlist_id,
                    history: c.history || [], status: c.status as any, addedAt: new Date(c.added_at).getTime(),
                    newestVideo: c.newest_video, oldestVideo: c.oldest_video,
                    lastRefreshedAt: c.last_refreshed_at ? new Date(c.last_refreshed_at).getTime() : undefined
                  })));
                }
                
                const { data: groups } = await supabase.from('channel_groups').select('*');
                if (groups) {
                    setChannelGroups(groups.map(g => ({ id: g.id, name: g.name, channelIds: g.channel_ids, createdAt: g.created_at || new Date().toISOString() })));
                }

                const { data: moviesData } = await supabase.from('movies').select('*');
                if (moviesData) {
                    setMovies(moviesData.map(m => ({
                        id: m.id, name: m.name, addedAt: m.added_at, channel3DId: m.channel_3d_id || '', 
                        channel2DId: m.channel_2d_id || '', status: m.status as any, note: m.note || '',
                        channel3DIds: m.channel_3d_ids || [], channel2DIds: m.channel_2d_ids || [] 
                    })));
                }
            } catch (err) { setError("Failed to sync data."); } finally { setIsLoading(false); }
        };
        loadUserData();
    }, [session?.user?.id]);

    // --- Lazy Fetcher ---
    const fetchVideoInfoForChannels = useCallback(async (channels: ChannelStats[]) => {
        if (!apiKeySet || channels.length === 0 || !session) return;
        const channelsToFetch = channels.filter(c => c.status !== 'terminated' && (!c.newestVideo || !c.oldestVideo));
        
        for (const channel of channelsToFetch) {
            try {
                const [newest, oldest] = await Promise.all([
                    getAbsoluteNewestVideo(channel.uploadsPlaylistId),
                    getAbsoluteOldestVideo(channel.id, channel.publishedAt)
                ]);
                
                setTrackedChannels(prev => prev.map(c => c.id === channel.id ? { ...c, newestVideo: newest, oldestVideo: oldest } : c));
                await supabase.from('tracked_channels').update({ newest_video: newest, oldest_video: oldest }).eq('id', channel.id).eq('user_id', session.user.id);
            } catch (err) { console.error(`Error fetching videos for ${channel.title}`, err); }
        }
    }, [apiKeySet, session]);

    useEffect(() => {
        if (trackedChannels.length > 0 && apiKeySet) fetchVideoInfoForChannels(trackedChannels);
    }, [trackedChannels.length, apiKeySet, fetchVideoInfoForChannels]);

    const handleRefreshChannels = async () => {
        if (isRefreshing || !apiKeySet || !session || trackedChannels.length === 0) return;
        setIsRefreshing(true);
        setError('');
        try {
            const today = getTodaysDateString();
            const activeChannels = trackedChannels.filter(c => c.status !== 'terminated');
            const channelIds = activeChannels.map(c => c.id);
            
            const updatedStatsList = await getChannelStatsBatch(channelIds);
            const timestamp = Date.now();
            const results = [];

            for (const stats of updatedStatsList) {
                const existing = trackedChannels.find(c => c.id === stats.id);
                if (!existing) continue;

                const newest = await getAbsoluteNewestVideo(existing.uploadsPlaylistId);

                const newHistory = [...(existing.history || [])];
                const historyEntry = { date: today, timestamp, subscriberCount: stats.subscriberCount!, viewCount: stats.viewCount!, videoCount: stats.videoCount! };
                if (newHistory.length > 0 && newHistory[newHistory.length - 1].date === today) {
                    newHistory[newHistory.length - 1] = historyEntry;
                } else {
                    newHistory.push(historyEntry);
                }

                results.push({
                    id: stats.id, user_id: session.user.id, subscriber_count: stats.subscriberCount,
                    view_count: stats.viewCount, video_count: stats.videoCount, history: newHistory,
                    last_refreshed_at: new Date().toISOString(), newest_video: newest
                });
            }

            if (results.length > 0) {
                 await supabase.from('tracked_channels').upsert(results);
                 setTrackedChannels(prev => prev.map(c => {
                    const res = results.find(r => r.id === c.id);
                    return res ? { 
                        ...c, subscriberCount: res.subscriber_count!, viewCount: res.view_count!, videoCount: res.video_count!,
                        history: res.history, lastRefreshedAt: timestamp, newestVideo: res.newest_video 
                    } : c;
                 }));
            }
        } catch (err: any) { setError(err.message); } finally { setIsRefreshing(false); }
    };

    const handleAddChannel = async (channelInput: string): Promise<AddChannelResult[]> => {
        if (!session || !apiKeySet) return [];
        const identifiers = channelInput.split('\n').map(s => s.trim()).filter(Boolean);
        setIsAddingChannel(true);
        const results: AddChannelResult[] = [];

        for (const identifier of identifiers) {
            try {
                const channelId = extractChannelId(identifier);
                if (!channelId) {
                    results.push({ identifier, status: 'error', message: 'Invalid URL or ID format' });
                    continue;
                }
                
                if (trackedChannels.some(c => c.id === channelId)) {
                    results.push({ identifier, status: 'error', message: 'Channel already tracked' });
                    continue;
                }

                const stats = await getChannelStats(channelId);
                const today = getTodaysDateString();
                const dbChannel = { 
                    id: stats.id, user_id: session.user.id, title: stats.title, 
                    description: stats.description, custom_url: stats.customUrl, 
                    thumbnail_url: stats.thumbnailUrl, subscriber_count: stats.subscriberCount, 
                    video_count: stats.videoCount, view_count: stats.viewCount, 
                    uploads_playlist_id: stats.uploadsPlaylistId, 
                    history: [{ date: today, timestamp: Date.now(), subscriberCount: stats.subscriberCount, viewCount: stats.viewCount, videoCount: stats.videoCount }], 
                    status: stats.status || 'active', published_at: stats.publishedAt, 
                    newest_video: stats.newestVideo, oldest_video: stats.oldestVideo,
                    added_at: new Date().toISOString()
                };
                
                await supabase.from('tracked_channels').upsert(dbChannel);
                const newChan = { ...stats, history: dbChannel.history, addedAt: Date.now() };
                
                // Incremental State Update: Add to UI immediately
                setTrackedChannels(prev => [...prev, newChan]);
                results.push({ identifier, status: 'success', channelTitle: stats.title });
            } catch (err: any) { 
                results.push({ identifier, status: 'error', message: err.message || 'Channel not found' });
            }
        }
        
        setIsAddingChannel(false);
        return results;
    };

    const handleRemoveChannel = async (id: string) => {
        await supabase.from('tracked_channels').delete().eq('id', id).eq('user_id', session.user.id);
        setTrackedChannels(prev => prev.filter(c => c.id !== id));
    };

    const handleAddMovies = async (names: string) => {
        if (!session) return;
        const inputNames = names.split('\n').map(n => n.trim()).filter(Boolean);
        const uniqueNewNames = inputNames.filter(name => !movies.some(m => m.name.toLowerCase() === name.toLowerCase()));
        if (uniqueNewNames.length === 0) return;
        const newMovies: Movie[] = uniqueNewNames.map(name => ({
            id: crypto.randomUUID(), name, addedAt: new Date().toISOString(),
            channel3DId: '', channel2DId: '', channel3DIds: [], channel2DIds: [],
            status: 'Playlist', note: ''
        }));
        try {
            setMovies(prev => [...newMovies, ...prev]);
            await supabase.from('movies').insert(newMovies.map(m => ({
                id: m.id, user_id: session.user.id, name: m.name, added_at: m.addedAt, status: m.status, note: m.note,
                channel_3d_ids: m.channel3DIds, channel_2d_ids: m.channel2DIds
            })));
        } catch (err: any) { setError("Failed to save movies."); }
    };

    const handleUpdateMovie = async (id: string, updates: Partial<Movie>) => {
        if (!session) return;
        setMovies(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
        try {
            const dbUpdates: any = {};
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.channel3DIds) { dbUpdates.channel_3d_ids = updates.channel3DIds; dbUpdates.channel_3d_id = updates.channel3DIds[0] || ''; }
            if (updates.channel2DIds) { dbUpdates.channel_2d_ids = updates.channel2DIds; dbUpdates.channel_2d_id = updates.channel2DIds[0] || ''; }
            if (updates.note !== undefined) dbUpdates.note = updates.note;
            await supabase.from('movies').update(dbUpdates).eq('id', id);
        } catch (err: any) { setError("Failed to save update."); }
    };

    const handleBulkUpdateMovieStatus = async (ids: string[], status: MovieStatus) => {
        if (!session || ids.length === 0) return;
        setMovies(prev => prev.map(m => ids.includes(m.id) ? { ...m, status } : m));
        try { await supabase.from('movies').update({ status }).in('id', ids); } catch (err: any) { setError("Failed to save bulk updates."); }
    };

    const handleDeleteMovie = async (id: string) => {
        if (!session) return;
        setMovies(prev => prev.filter(m => m.id !== id));
        try { await supabase.from('movies').delete().eq('id', id); } catch (err: any) {}
    };
    
    const handleSaveGroup = async (group: Omit<ChannelGroup, 'id'> & { id?: string }) => {
        if (!session) return;
        const payload = { user_id: session.user.id, name: group.name, channel_ids: group.channelIds };
        if (group.id) {
            await supabase.from('channel_groups').update(payload).eq('id', group.id);
            setChannelGroups(prev => prev.map(g => g.id === group.id ? { ...g, ...group, id: group.id!, createdAt: g.createdAt } : g));
        } else {
            const { data } = await supabase.from('channel_groups').insert(payload).select();
            if (data && data[0]) setChannelGroups(prev => [...prev, { id: data[0].id, name: data[0].name, channelIds: data[0].channel_ids, createdAt: data[0].created_at }]);
        }
    };

    const handleDeleteGroup = async (id: string) => {
         await supabase.from('channel_groups').delete().eq('id', id);
         setChannelGroups(prev => prev.filter(g => g.id !== id));
    };

    return {
        apiKeys, setApiKeysState, trackedChannels, setTrackedChannels, channelGroups, setChannelGroups, movies, setMovies,
        isLoading, error, setError, isRefreshing, handleRefreshChannels, isAddingChannel, handleAddChannel, handleRemoveChannel,
        handleAddMovies, handleUpdateMovie, handleBulkUpdateMovieStatus, handleDeleteMovie, handleSaveGroup, handleDeleteGroup
    };
};
