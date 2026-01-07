
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getChannelStats, getChannelVideos, getAbsoluteOldestVideo, getAbsoluteNewestVideo, getChannelStatsBatch } from '../services/youtubeService';
import { extractChannelId, getTodaysDateString } from '../utils/helpers';
import type { ChannelStats, ChannelGroup, ApiKey, Movie, MovieStatus, MonetizationStatus, EngagementStatus } from '../types';

export interface AddChannelResult {
    identifier: string;
    status: 'success' | 'error';
    message?: string;
    channelTitle?: string;
}

const PRESET_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

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

    // Helper to map DB channel to App type
    const mapDbChannelToStats = (c: any): ChannelStats => ({
        id: c.id, title: c.title, description: c.description, customUrl: c.custom_url || '',
        thumbnailUrl: c.thumbnail_url, subscriberCount: c.subscriber_count, videoCount: c.video_count,
        viewCount: c.view_count, publishedAt: c.published_at, uploadsPlaylistId: c.uploads_playlist_id,
        history: c.history || [], status: c.status as any, addedAt: new Date(c.added_at).getTime(),
        newestVideo: c.newest_video, oldestVideo: c.oldest_video,
        lastRefreshedAt: c.last_refreshed_at ? new Date(c.last_refreshed_at).getTime() : undefined,
        engagementStatus: c.engagement_status || 'undecided',
        monetizationStatus: c.monetization_status || 'undecided'
    });

    // Helper to map DB movie to App type
    const mapDbMovieToMovie = (m: any): Movie => ({
        id: m.id, name: m.name, addedAt: m.added_at, 
        lastUpdatedAt: m.updated_at, // Removed fallback to added_at so new movies appear as null
        channel3DId: m.channel_3d_id || '', 
        channel2DId: m.channel_2d_id || '', 
        status: m.status as any, note: m.note || '',
        channel3DIds: m.channel_3d_ids || [], 
        channel2DIds: m.channel_2d_ids || [] 
    });

    // --- Load Data & Setup Realtime ---
    useEffect(() => {
        if (!session?.user?.id) { 
            setIsLoading(false); 
            return; 
        }

        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const { data: keys } = await supabase.from('api_keys').select('*');
                if (keys) {
                    const today = new Date().toISOString().split('T')[0];
                    const processedKeys = keys.map(k => ({
                        value: k.key_value, 
                        status: k.status as any, 
                        dailyUsage: k.last_used_date === today ? k.daily_usage : 0, 
                        lastUsedDate: k.last_used_date 
                    }));
                    setApiKeysState(processedKeys);
                }
                
                const { data: channels } = await supabase.from('tracked_channels').select('*');
                if (channels) setTrackedChannels(channels.map(mapDbChannelToStats));
                
                const { data: groups } = await supabase.from('channel_groups').select('*');
                if (groups) {
                    setChannelGroups(groups.map(g => ({ 
                        id: g.id, name: g.name, channelIds: g.channel_ids, 
                        createdAt: g.created_at, color: g.color 
                    })));
                }

                const { data: moviesData } = await supabase.from('movies').select('*').order('added_at', { ascending: false });
                if (moviesData) setMovies(moviesData.map(mapDbMovieToMovie));

            } catch (err) { setError("Failed to initial sync."); } finally { setIsLoading(false); }
        };

        loadInitialData();

        // --- REALTIME SUBSCRIPTIONS ---
        const channelsSub = supabase.channel('tracked_channels_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tracked_channels', filter: `user_id=eq.${session.user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newChan = mapDbChannelToStats(payload.new);
                    setTrackedChannels(prev => prev.some(c => c.id === newChan.id) ? prev : [...prev, newChan]);
                } else if (payload.eventType === 'UPDATE') {
                    setTrackedChannels(prev => prev.map(c => c.id === payload.new.id ? mapDbChannelToStats(payload.new) : c));
                } else if (payload.eventType === 'DELETE') {
                    setTrackedChannels(prev => prev.filter(c => c.id !== payload.old.id));
                }
            }).subscribe();

        const moviesSub = supabase.channel('movies_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'movies', filter: `user_id=eq.${session.user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newMovie = mapDbMovieToMovie(payload.new);
                    setMovies(prev => prev.some(m => m.id === newMovie.id) ? prev : [newMovie, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setMovies(prev => prev.map(m => m.id === payload.new.id ? mapDbMovieToMovie(payload.new) : m));
                } else if (payload.eventType === 'DELETE') {
                    setMovies(prev => prev.filter(m => m.id !== payload.old.id));
                }
            }).subscribe();

        const groupsSub = supabase.channel('groups_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_groups', filter: `user_id=eq.${session.user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const group = { 
                        id: payload.new.id, name: payload.new.name, channelIds: payload.new.channel_ids, 
                        createdAt: payload.new.created_at, color: payload.new.color 
                    };
                    setChannelGroups(prev => {
                        const exists = prev.some(g => g.id === group.id);
                        return exists ? prev.map(g => g.id === group.id ? group : g) : [...prev, group];
                    });
                } else if (payload.eventType === 'DELETE') {
                    setChannelGroups(prev => prev.filter(g => g.id !== payload.old.id));
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(channelsSub);
            supabase.removeChannel(moviesSub);
            supabase.removeChannel(groupsSub);
        };
    }, [session?.user?.id]);

    const handleRefreshChannels = async () => {
        if (isRefreshing || !apiKeySet || !session || trackedChannels.length === 0) return;
        setIsRefreshing(true);
        setError('');
        try {
            const today = getTodaysDateString();
            const channelIds = trackedChannels.filter(c => c.status !== 'terminated').map(c => c.id);
            const updatedStatsList = await getChannelStatsBatch(channelIds);
            
            for (const stats of updatedStatsList) {
                const existing = trackedChannels.find(c => c.id === stats.id);
                if (!existing) continue;

                let newest = existing.newestVideo;
                if (!newest || existing.videoCount !== stats.videoCount) {
                    newest = await getAbsoluteNewestVideo(existing.uploadsPlaylistId);
                }

                const newHistory = [...(existing.history || [])];
                const historyEntry = { date: today, timestamp: Date.now(), subscriberCount: stats.subscriberCount!, viewCount: stats.viewCount!, videoCount: stats.videoCount! };
                
                const existingEntryIdx = newHistory.findIndex(h => h.date === today);
                if (existingEntryIdx !== -1) newHistory[existingEntryIdx] = historyEntry;
                else newHistory.push(historyEntry);

                // Fixed: Use camelCase properties subscriberCount, viewCount, videoCount from the stats object
                await supabase.from('tracked_channels').update({
                    subscriber_count: stats.subscriberCount, view_count: stats.viewCount, video_count: stats.videoCount,
                    history: newHistory, last_refreshed_at: new Date().toISOString(), newest_video: newest
                }).eq('id', stats.id);
                // State updates are now handled by Realtime listener
            }
        } catch (err: any) { setError(err.message || "Failed to refresh."); } finally { setIsRefreshing(false); }
    };

    const handleAddChannel = async (channelInput: string): Promise<AddChannelResult[]> => {
        if (!session || !apiKeySet) return [];
        const identifiers = channelInput.split('\n').map(s => s.trim()).filter(Boolean);
        setIsAddingChannel(true);
        const results: AddChannelResult[] = [];

        for (const identifier of identifiers) {
            try {
                const channelId = extractChannelId(identifier);
                if (!channelId || trackedChannels.some(c => c.id === channelId)) {
                    results.push({ identifier, status: 'error', message: 'Invalid or already tracked' });
                    continue;
                }
                const stats = await getChannelStats(channelId);
                const today = getTodaysDateString();
                const dbChannel = { 
                    id: stats.id, user_id: session.user.id, title: stats.title, description: stats.description, 
                    custom_url: stats.customUrl, thumbnail_url: stats.thumbnailUrl, subscriber_count: stats.subscriberCount, 
                    video_count: stats.videoCount, view_count: stats.viewCount, uploads_playlist_id: stats.uploadsPlaylistId, 
                    history: [{ date: today, timestamp: Date.now(), subscriberCount: stats.subscriberCount, viewCount: stats.viewCount, videoCount: stats.videoCount }], 
                    status: stats.status || 'active', published_at: stats.publishedAt, newest_video: stats.newestVideo, 
                    oldest_video: stats.oldestVideo, added_at: new Date().toISOString()
                };
                await supabase.from('tracked_channels').insert(dbChannel);
                results.push({ identifier, status: 'success', channelTitle: stats.title });
            } catch (err: any) { results.push({ identifier, status: 'error', message: 'Channel not found' }); }
        }
        setIsAddingChannel(false);
        return results;
    };

    const handleRemoveChannel = async (id: string) => {
        await supabase.from('tracked_channels').delete().eq('id', id).eq('user_id', session.user.id);
    };

    const handleBulkUpdateChannels = async (ids: string[], updates: Partial<ChannelStats>) => {
        if (!session || ids.length === 0) return;
        const dbUpdates: any = {};
        if (updates.monetizationStatus !== undefined) dbUpdates.monetization_status = updates.monetizationStatus;
        if (updates.engagementStatus !== undefined) dbUpdates.engagement_status = updates.engagementStatus;
        try {
            await supabase.from('tracked_channels').update(dbUpdates).in('id', ids).eq('user_id', session.user.id);
        } catch (err: any) { setError(`Failed to bulk update: ${err.message}`); }
    };

    const handleUpdateChannel = async (id: string, updates: Partial<ChannelStats>) => {
        if (!session) return;
        const dbUpdates: any = {};
        if (updates.monetizationStatus !== undefined) dbUpdates.monetization_status = updates.monetizationStatus;
        if (updates.engagementStatus !== undefined) dbUpdates.engagement_status = updates.engagementStatus;
        try {
            await supabase.from('tracked_channels').update(dbUpdates).eq('id', id).eq('user_id', session.user.id);
        } catch (err: any) { setError("Failed to update channel."); }
    };

    const handleAddMovies = async (names: string) => {
        if (!session) return;
        const inputNames = names.split('\n').map(n => n.trim()).filter(Boolean);
        const uniqueNewNames = inputNames.filter(name => !movies.some(m => m.name.toLowerCase() === name.toLowerCase()));
        if (uniqueNewNames.length === 0) return;
        const newMovies = uniqueNewNames.map(name => ({
            id: crypto.randomUUID(), 
            user_id: session.user.id, 
            name, 
            added_at: new Date().toISOString(),
            updated_at: null, // Force null to prevent DB default value (now()) from triggering
            status: 'Playlist', 
            note: '', 
            channel_3d_ids: [], 
            channel_2d_ids: []
        }));
        try {
            await supabase.from('movies').insert(newMovies);
        } catch (err: any) { setError("Failed to save movies."); }
    };

    const handleUpdateMovie = async (id: string, updates: Partial<Movie>) => {
        if (!session) return;
        try {
            const dbUpdates: any = { updated_at: new Date().toISOString() };
            if (updates.status) dbUpdates.status = updates.status;
            if (updates.channel3DIds) dbUpdates.channel_3d_ids = updates.channel3DIds;
            if (updates.channel2DIds) dbUpdates.channel_2d_ids = updates.channel2DIds;
            if (updates.note !== undefined) dbUpdates.note = updates.note;
            await supabase.from('movies').update(dbUpdates).eq('id', id).eq('user_id', session.user.id);
        } catch (err: any) { setError("Failed to update movie."); }
    };

    const handleBulkUpdateMovieStatus = async (ids: string[], status: MovieStatus) => {
        if (!session || ids.length === 0) return;
        try { 
            await supabase.from('movies').update({ status, updated_at: new Date().toISOString() }).in('id', ids).eq('user_id', session.user.id); 
        } catch (err: any) { setError("Failed bulk update."); }
    };

    const handleDeleteMovie = async (id: string) => {
        if (!session) return;
        try { await supabase.from('movies').delete().eq('id', id).eq('user_id', session.user.id); } catch (err: any) {}
    };
    
    const handleSaveGroup = async (group: Omit<ChannelGroup, 'id' | 'color'> & { id?: string; color?: string }) => {
        if (!session) return;
        const color = group.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        const payload = { user_id: session.user.id, name: group.name, channel_ids: group.channelIds, color: color };
        try {
            if (group.id) {
                await supabase.from('channel_groups').update(payload).eq('id', group.id).eq('user_id', session.user.id);
            } else {
                await supabase.from('channel_groups').insert(payload);
            }
        } catch (err: any) { setError(`Failed to save group.`); }
    };

    const handleDeleteGroup = async (id: string) => {
         await supabase.from('channel_groups').delete().eq('id', id).eq('user_id', session.user.id);
    };

    return {
        apiKeys, setApiKeysState, trackedChannels, setTrackedChannels, channelGroups, setChannelGroups, movies, setMovies,
        isLoading, error, setError, isRefreshing, handleRefreshChannels, isAddingChannel, handleAddChannel, handleRemoveChannel,
        handleBulkUpdateChannels, handleUpdateChannel,
        handleAddMovies, handleUpdateMovie, handleBulkUpdateMovieStatus, handleDeleteMovie, handleSaveGroup, handleDeleteGroup
    };
};
