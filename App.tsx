
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SettingsModal } from './components/SettingsModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { DashboardModal } from './components/DashboardModal';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorDisplay } from './components/ErrorDisplay';
import { GroupSettingsModal } from './components/GroupSettingsModal';
import { TopBar } from './components/TopBar';
import { Auth } from './components/Auth';
import { Toast } from './components/Toast'; // New
import { supabase } from './lib/supabase';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useAppData } from './hooks/useAppData';
import { getChannelVideos, setApiKeys, validateYouTubeApiKey, setOnKeyIndexChange, setOnQuotaChange, getInitialQuota } from './services/youtubeService';
import { ChannelsView } from './components/ChannelsView'; 
import { GroupsOverviewModal } from './components/GroupsOverviewModal'; 
import type { ChannelStats, VideoStat, ChannelGroup, AppSettings, SortOrder } from './types';
import { MoviesView } from './components/MoviesView'; 

interface SelectedChannelData {
    stats: ChannelStats;
    videos: VideoStat[];
    nextPageToken?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    refreshInterval: 3600000, 
    rowsPerPage: 100
};

const App: React.FC = () => {
    const { session, profile, loading: authLoading, handleSignOut, updateProfile } = useSupabaseAuth();
    
    const {
        apiKeys, setApiKeysState,
        trackedChannels, setTrackedChannels,
        channelGroups, setChannelGroups,
        movies, setMovies,
        isLoading, error, setError,
        isRefreshing, handleRefreshChannels,
        isAddingChannel, handleAddChannel, handleRemoveChannel,
        handleBulkUpdateChannels, handleUpdateChannel,
        handleAddMovies, handleUpdateMovie, handleBulkUpdateMovieStatus, handleDeleteMovie,
        handleSaveGroup, handleDeleteGroup
    } = useAppData(session);

    const [appSettings, setAppSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('infi_app_settings');
            return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });

    const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
    const [quotaUsage, setQuotaUsage] = useState(() => getInitialQuota());
    const [selectedChannel, setSelectedChannel] = useState<SelectedChannelData | null>(null);
    const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);
    const [dashboardSortOrder, setDashboardSortOrder] = useState<SortOrder>('date');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null); // New state for toast
    
    const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('infi_recent_channels');
        return saved ? JSON.parse(saved) : [];
    });

    const [currentMainView, setCurrentMainView] = useState<'channels' | 'movies'>('channels');

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); 
    const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);
    const [isGroupsOverviewModalOpen, setIsGroupsOverviewModalOpen] = useState(false); 

    const validatingKeysRef = useRef(new Set<string>());
    
    const apiKeySet = apiKeys.some(k => k.status === 'valid');
    const dailyQuotaLimit = apiKeys.filter(k => k.status === 'valid').length > 0 ? apiKeys.filter(k => k.status === 'valid').length * 10000 : 10000;

    const lastGlobalRefresh = useMemo(() => {
        if (trackedChannels.length === 0) return undefined;
        const timestamps = trackedChannels.map(c => c.lastRefreshedAt || 0);
        const maxTs = Math.max(...timestamps);
        return maxTs > 0 ? maxTs : undefined;
    }, [trackedChannels]);

    useEffect(() => {
        localStorage.setItem('infi_app_settings', JSON.stringify(appSettings));
    }, [appSettings]);

    useEffect(() => {
        if (appSettings.refreshInterval > 0 && apiKeySet && session) {
            const intervalId = setInterval(() => {
                if (!isRefreshing) {
                    handleRefreshChannels();
                }
            }, appSettings.refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [appSettings.refreshInterval, apiKeySet, session, isRefreshing, handleRefreshChannels]);

    useEffect(() => {
        if (apiKeys.length > 0) {
            setApiKeys(apiKeys);
        }
    }, [apiKeys]);

    useEffect(() => {
        const nextKeyToValidate = apiKeys.find(k => k.status === 'unknown' && !validatingKeysRef.current.has(k.value));
        if (nextKeyToValidate) {
            const validate = async () => {
                const keyValue = nextKeyToValidate.value;
                validatingKeysRef.current.add(keyValue);
                setApiKeysState(prev => prev.map(k => k.value === keyValue ? { ...k, status: 'checking' } : k));
                const result = await validateYouTubeApiKey(keyValue);
                setApiKeysState(prev => prev.map(k => k.value === keyValue ? { ...k, status: result.status, error: result.error } : k));
                validatingKeysRef.current.delete(keyValue);
            };
            validate();
        }
    }, [apiKeys, setApiKeysState]);

    useEffect(() => {
        setOnKeyIndexChange(setCurrentKeyIndex);
        setOnQuotaChange(setQuotaUsage);
    }, []);

    // New helper to show toast
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Wrapper for handleSaveGroup to add notification
    const handleSaveGroupWithNotification = async (groupData: any) => {
        try {
            await handleSaveGroup(groupData);
            showToast(groupData.id ? 'Group updated successfully!' : 'Group created successfully!');
        } catch (e: any) {
            console.error(e);
            showToast(e.message || 'Failed to save group', 'error');
        }
    };

    const handleSelectChannel = async (id: string) => {
        const stats = trackedChannels.find(c => c.id === id);
        if (!stats || stats.status === 'terminated') return;
        
        setRecentlyViewedIds(prev => {
            const filtered = prev.filter(rid => rid !== id);
            const updated = [id, ...filtered].slice(0, 5);
            localStorage.setItem('infi_recent_channels', JSON.stringify(updated));
            return updated;
        });

        setSelectedChannel({ stats, videos: [] });
        setIsDashboardModalOpen(true);
        setIsDashboardLoading(true);
        
        try {
            const videoData = await getChannelVideos(stats.uploadsPlaylistId, 24); 
            setSelectedChannel({ stats, videos: videoData.videos });
        } catch(e) {
            console.error(e);
        } finally {
            setIsDashboardLoading(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900"><LoadingIndicator /></div>;

    const isBlurred = !session;

    return (
        <>
            <div className={`bg-gray-900 min-h-screen text-white font-sans antialiased pt-14 transition-all duration-500 ${isBlurred ? 'filter blur-sm pointer-events-none select-none overflow-hidden h-screen' : ''}`}>
                <TopBar 
                    trackedChannelsCount={trackedChannels.length} 
                    apiKeys={apiKeys}
                    currentKeyIndex={currentKeyIndex}
                    sessionQuota={quotaUsage.session}
                    dailyQuota={quotaUsage.daily}
                    dailyQuotaLimit={dailyQuotaLimit}
                />
                
                <Header 
                    onOpenSettings={() => setIsSettingsOpen(true)} 
                    onOpenAccount={() => setIsAccountOpen(true)} 
                    profile={profile}
                    currentView={currentMainView} 
                    onViewChange={setCurrentMainView} 
                    lastViewedChannelId={recentlyViewedIds[0]} 
                    onViewSpecificChannel={handleSelectChannel} 
                    trackedChannels={trackedChannels} 
                    onOpenGroupsOverview={() => setIsGroupsOverviewModalOpen(true)} 
                    showNavigation={true}
                    minimal={false}
                    onRefresh={handleRefreshChannels}
                    isRefreshing={isRefreshing}
                    lastRefreshedAt={lastGlobalRefresh}
                />
                
                <main className="w-full px-4 md:px-8 py-8 flex flex-col items-center space-y-8">
                    {error && <ErrorDisplay message={error} />}
                    {isLoading ? <LoadingIndicator /> : (
                        <>
                            {currentMainView === 'channels' && (
                                <ChannelsView
                                    currentSubView={'allChannels'} 
                                    trackedChannels={trackedChannels}
                                    channelGroups={channelGroups}
                                    onAddChannel={handleAddChannel}
                                    onSelectChannel={handleSelectChannel}
                                    onRemoveChannel={handleRemoveChannel}
                                    onUpdateChannel={handleUpdateChannel}
                                    onSaveGroup={handleSaveGroupWithNotification} // Use wrapped function
                                    onDeleteGroup={handleDeleteGroup}
                                    handleBulkUpdateChannels={handleBulkUpdateChannels}
                                    isAdding={isAddingChannel}
                                    apiKeySet={apiKeySet}
                                    settings={appSettings}
                                    setChannelGroups={setChannelGroups} 
                                    setEditingGroup={setEditingGroup} 
                                    setIsGroupModalOpen={setIsGroupModalOpen} 
                                    onOpenGroupsOverview={() => setIsGroupsOverviewModalOpen(true)} 
                                />
                            )}
                            {currentMainView === 'movies' && (
                                <MoviesView 
                                    movies={movies}
                                    channels={trackedChannels} 
                                    onAddMovies={handleAddMovies}
                                    onUpdateMovie={handleUpdateMovie}
                                    onBulkUpdateMovieStatus={handleBulkUpdateMovieStatus}
                                    onDeleteMovie={handleDeleteMovie}
                                    settings={appSettings}
                                    setMovies={setMovies} 
                                />
                            )}
                        </>
                    )}
                </main>
                <Footer />
            </div>

            {isBlurred && (
                <Auth showCloseButton={false} />
            )}

            {session && (
                <>
                    <SettingsModal 
                        isOpen={isSettingsOpen} 
                        onClose={() => setIsSettingsOpen(false)}
                        apiKeys={apiKeys}
                        onApiKeysChange={async (keys) => {
                            if (!session) return;
                            try {
                                await supabase.from('api_keys').delete().eq('user_id', session.user.id);
                                if (keys.length > 0) {
                                    const { error: insertError } = await supabase.from('api_keys').insert(keys.map(k => ({ user_id: session.user.id, key_value: k, status: 'unknown' })));
                                    if (insertError) throw insertError;
                                }
                                setApiKeysState(keys.map(k => ({ value: k, status: 'unknown' })));
                            } catch (dbError: any) {
                                console.error("Failed to save API keys:", dbError);
                                setError(`Error saving API keys: ${dbError.message}`);
                            }
                        }}
                        onRevalidateAll={() => setApiKeysState(prev => prev.map(k => ({ ...k, status: 'unknown' })))}
                        settings={appSettings}
                        onSettingsChange={setAppSettings}
                    />

                    <AccountSettingsModal 
                        isOpen={isAccountOpen}
                        onClose={() => setIsAccountOpen(false)}
                        profile={profile}
                        onUpdateProfile={updateProfile}
                        onSignOut={handleSignOut}
                    />

                    <GroupSettingsModal 
                        isOpen={isGroupModalOpen}
                        onClose={() => setIsGroupModalOpen(false)}
                        onSave={handleSaveGroupWithNotification} // Use wrapped function
                        existingGroup={editingGroup}
                        allChannels={trackedChannels}
                    />

                    {selectedChannel && (
                        <DashboardModal 
                            isOpen={isDashboardModalOpen}
                            onClose={() => setIsDashboardModalOpen(false)}
                            channelStats={selectedChannel.stats}
                            initialVideos={selectedChannel.videos}
                            isLoading={isDashboardLoading}
                            allChannels={trackedChannels}
                            channelGroups={channelGroups}
                            recentlyViewedIds={recentlyViewedIds}
                            onSwitchChannel={handleSelectChannel}
                            sortOrder={dashboardSortOrder}
                            onSortOrderChange={setDashboardSortOrder}
                        />
                    )}

                    <GroupsOverviewModal 
                        isOpen={isGroupsOverviewModalOpen}
                        onClose={() => setIsGroupsOverviewModalOpen(false)}
                        groups={channelGroups}
                        channels={trackedChannels}
                        onEditGroup={(group) => {
                            setEditingGroup(group);
                            setIsGroupModalOpen(true);
                        }}
                        onDeleteGroup={handleDeleteGroup}
                        onCreateGroup={() => {
                            setEditingGroup(null);
                            setIsGroupModalOpen(true);
                        }}
                        settings={appSettings}
                    />

                    {toast && <Toast message={toast.message} type={toast.type} />}
                </>
            )}
        </>
    );
};

export default App;
