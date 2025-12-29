import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from './lib/supabase';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useAppData } from './hooks/useAppData';
import { getChannelVideos, setApiKeys, validateYouTubeApiKey, setOnKeyIndexChange, setOnQuotaChange, getInitialQuota } from './services/youtubeService';
import { ChannelsView } from './components/ChannelsView'; // New Channels View
import { GroupsOverviewModal } from './components/GroupsOverviewModal'; // New: GroupsOverviewModal
import type { ChannelStats, VideoStat, ChannelGroup, AppSettings, SortOrder } from './types';
import { MoviesView } from './components/MoviesView'; // Movies view is now self-contained

interface SelectedChannelData {
    stats: ChannelStats;
    videos: VideoStat[];
    nextPageToken?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
    refreshInterval: 3600000, // Default: Every 1 hour
    rowsPerPage: 100
};

const App: React.FC = () => {
    const { session, profile, loading: authLoading, handleSignOut, updateProfile } = useSupabaseAuth();
    
    // Data Logic from Hook
    const {
        apiKeys, setApiKeysState,
        trackedChannels, setTrackedChannels,
        channelGroups, setChannelGroups, // Added setChannelGroups
        movies, setMovies, // Added setMovies
        isLoading, error, setError,
        isRefreshing, handleRefreshChannels,
        isAddingChannel, handleAddChannel, handleRemoveChannel,
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
    // FIX: Define quotaUsage state and initialize it using getInitialQuota
    const [quotaUsage, setQuotaUsage] = useState(() => getInitialQuota());
    const [selectedChannel, setSelectedChannel] = useState<SelectedChannelData | null>(null);
    const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);
    const [dashboardSortOrder, setDashboardSortOrder] = useState<SortOrder>('date');
    
    // Track recently viewed channels
    const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('infi_recent_channels');
        return saved ? JSON.parse(saved) : [];
    });

    // Main navigation view state
    const [currentMainView, setCurrentMainView] = useState<'channels' | 'movies'>('channels');
    // Sub-navigation view state for 'channels' (now only 'allChannels' is relevant for ChannelsView itself)
    const [currentChannelsSubView, setCurrentChannelsSubView] = useState<'allChannels'>('allChannels'); // Renamed and simplified

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); // For creating/editing individual groups
    const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);

    const [isGroupsOverviewModalOpen, setIsGroupsOverviewModalOpen] = useState(false); // New: State for GroupsOverviewModal

    const validatingKeysRef = useRef(new Set<string>());
    
    const apiKeySet = apiKeys.some(k => k.status === 'valid');
    const dailyQuotaLimit = apiKeys.filter(k => k.status === 'valid').length > 0 ? apiKeys.filter(k => k.status === 'valid').length * 10000 : 10000;

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
        // FIX: setOnQuotaChange now correctly refers to the state setter
        setOnKeyIndexChange(setCurrentKeyIndex);
        setOnQuotaChange(setQuotaUsage);
    }, []);

    const handleSelectChannel = async (id: string) => {
        const stats = trackedChannels.find(c => c.id === id);
        if (!stats || stats.status === 'terminated') return;
        
        // Update recently viewed history
        setRecentlyViewedIds(prev => {
            const filtered = prev.filter(rid => rid !== id);
            const updated = [id, ...filtered].slice(0, 5);
            localStorage.setItem('infi_recent_channels', JSON.stringify(updated));
            return updated;
        });

        // Open modal immediately with skeleton
        setSelectedChannel({ stats, videos: [] });
        setIsDashboardModalOpen(true);
        setIsDashboardLoading(true);
        
        try {
            const videoData = await getChannelVideos(stats.uploadsPlaylistId, 24); // Fetch more for better sorting
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
                    currentView={currentMainView} // Use currentMainView
                    onViewChange={setCurrentMainView} // Set currentMainView
                    // currentSubView is no longer passed to Header as GroupsOverview is a modal
                    // onSubViewChange is no longer passed to Header
                    lastViewedChannelId={recentlyViewedIds[0]} // Pass the most recently viewed channel ID
                    onViewSpecificChannel={handleSelectChannel} // Pass the handler to view a specific channel
                    trackedChannels={trackedChannels} // Pass trackedChannels for "Channel Details" fallback logic
                    onOpenGroupsOverview={() => setIsGroupsOverviewModalOpen(true)} // New: Open GroupsOverviewModal
                    showNavigation={true}
                    minimal={false}
                    onRefresh={handleRefreshChannels}
                    isRefreshing={isRefreshing}
                />
                
                <main className="w-full px-4 md:px-8 py-8 flex flex-col items-center space-y-8">
                    {error && <ErrorDisplay message={error} />}
                    {isLoading ? <LoadingIndicator /> : (
                        <>
                            {currentMainView === 'channels' && (
                                <ChannelsView
                                    currentSubView={currentChannelsSubView} // Now always 'allChannels' for ChannelsView itself
                                    trackedChannels={trackedChannels}
                                    channelGroups={channelGroups}
                                    onAddChannel={handleAddChannel}
                                    onSelectChannel={handleSelectChannel}
                                    onRemoveChannel={handleRemoveChannel}
                                    onSaveGroup={handleSaveGroup}
                                    onDeleteGroup={handleDeleteGroup}
                                    isAdding={isAddingChannel}
                                    apiKeySet={apiKeySet}
                                    settings={appSettings}
                                    // Pass setters for channelGroups to allow creation/deletion within ChannelsView
                                    setChannelGroups={setChannelGroups} 
                                    setEditingGroup={setEditingGroup} // Pass setEditingGroup
                                    setIsGroupModalOpen={setIsGroupModalOpen} // Pass setIsGroupModalOpen
                                />
                            )}
                            {currentMainView === 'movies' && (
                                <MoviesView 
                                    movies={movies}
                                    channels={trackedChannels} // Pass trackedChannels for channel options
                                    onAddMovies={handleAddMovies}
                                    onUpdateMovie={handleUpdateMovie}
                                    onBulkUpdateMovieStatus={handleBulkUpdateMovieStatus}
                                    onSortChange={(val) => {}} // Dummy as sort is internal
                                    onDeleteMovie={handleDeleteMovie}
                                    settings={appSettings}
                                    setMovies={setMovies} // Pass setMovies for internal state updates
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
                                // 1. Delete all existing keys for the user and wait for it to complete.
                                await supabase
                                    .from('api_keys')
                                    .delete()
                                    .eq('user_id', session.user.id);
                                
                                // 2. If there are new keys to add, insert them and wait for completion.
                                if (keys.length > 0) {
                                    const { error: insertError } = await supabase
                                        .from('api_keys')
                                        .insert(keys.map(k => ({ 
                                            user_id: session.user.id, 
                                            key_value: k, 
                                            status: 'unknown' 
                                        })));
                                    
                                    if (insertError) throw insertError;
                                }
                    
                                // 3. Only after the database operations are successful, update the local state.
                                // This ensures the UI reflects the persisted state.
                                setApiKeysState(keys.map(k => ({
                                    value: k,
                                    status: 'unknown' // Reset status on save as they will be re-validated.
                                })));
                    
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
                        onSave={handleSaveGroup}
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

                    {/* New: GroupsOverviewModal */}
                    <GroupsOverviewModal 
                        isOpen={isGroupsOverviewModalOpen}
                        onClose={() => setIsGroupsOverviewModalOpen(false)}
                        groups={channelGroups}
                        channels={trackedChannels}
                        onEditGroup={(group) => {
                            setEditingGroup(group);
                            setIsGroupModalOpen(true);
                            setIsGroupsOverviewModalOpen(false); // Close this modal when opening GroupSettingsModal
                        }}
                        onDeleteGroup={handleDeleteGroup}
                        onCreateGroup={() => {
                            setEditingGroup(null);
                            setIsGroupModalOpen(true);
                            setIsGroupsOverviewModalOpen(false); // Close this modal when opening GroupSettingsModal
                        }}
                        settings={appSettings}
                    />
                </>
            )}
        </>
    );
};

// FIX: Export the App component as a default export
export default App;