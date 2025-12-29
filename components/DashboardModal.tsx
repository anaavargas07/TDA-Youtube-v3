
import React, { useState, useMemo, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { ChannelStats, VideoStat, ChannelGroup, SortOrder } from '../types';

interface DashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    channelStats: ChannelStats;
    initialVideos: VideoStat[];
    isLoading: boolean;
    allChannels: ChannelStats[];
    channelGroups: ChannelGroup[];
    recentlyViewedIds: string[];
    onSwitchChannel: (id: string) => void;
    sortOrder: SortOrder;
    onSortOrderChange: (order: SortOrder) => void;
}

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse font-sans">
        <div className="bg-gray-800/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-white/5">
            <div className="w-28 h-28 rounded-full bg-gray-700"></div>
            <div className="flex-1 space-y-4 text-center md:text-left w-full">
                <div className="h-7 bg-gray-700 rounded-lg w-1/2 mx-auto md:mx-0"></div>
                <div className="h-3.5 bg-gray-700 rounded-lg w-1/4 mx-auto md:mx-0"></div>
                <div className="h-10 bg-gray-700 rounded-xl w-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-700/50 h-16 w-20 rounded-xl"></div>
                ))}
            </div>
        </div>
        <div className="bg-gray-800/40 h-48 rounded-2xl border border-white/5"></div>
        <div className="bg-gray-800/40 rounded-2xl h-64 border border-white/5 overflow-hidden"></div>
    </div>
);

const SidebarSection: React.FC<{ title: string, icon?: React.ReactNode }> = ({ title, icon }) => (
    <div className="px-4 py-1.5 mt-4 first:mt-0 font-sans">
        <div className="flex items-center gap-2 mb-1.5">
            {icon}
            <h3 className="text-[10px] font-black text-gray-500 tracking-wider">{title}</h3>
        </div>
    </div>
);

const ChannelNavItem: React.FC<{ 
    channel: ChannelStats, 
    isActive: boolean, 
    onSelect: () => void 
}> = ({ channel, isActive, onSelect }) => {
    const isTerminated = channel.status === 'terminated';
    const isRecentlyActive = useMemo(() => {
        if (!channel.newestVideo?.publishedAt) return false;
        const pubDate = new Date(channel.newestVideo.publishedAt).getTime();
        const now = Date.now();
        return (now - pubDate) < 24 * 60 * 60 * 1000;
    }, [channel.newestVideo]);

    return (
        <button
            disabled={isActive || isTerminated}
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-4 py-2 transition-all group relative font-sans ${
                isActive 
                    ? 'bg-indigo-600/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            } ${isTerminated ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
        >
            {isActive && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.8)]"></div>}
            
            <div className="relative">
                <img 
                    src={channel.thumbnailUrl} 
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                        isActive ? 'border-indigo-500 scale-110' : 'border-gray-700'
                    } ${isRecentlyActive ? 'active-pulse ring-1 ring-green-500/40' : ''}`} 
                    alt="" 
                />
                {isRecentlyActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-[#0f172a] shadow-sm"></span>
                )}
            </div>

            <div className="text-left min-w-0 flex-1">
                <p className="text-[11px] font-bold truncate leading-none group-hover:text-white transition-colors">{channel.title}</p>
                {/* Updated opacity and color for better visibility */}
                <p className="text-[9px] text-gray-300 opacity-60 font-mono truncate mt-0.5">{channel.id}</p>
            </div>
            
            {isRecentlyActive && !isActive && (
                <div className="flex items-center">
                    <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    <span className="text-[7px] font-black text-green-500 tracking-tighter">New</span>
                </div>
            )}
        </button>
    );
};


export const DashboardModal: React.FC<DashboardModalProps> = ({ 
    isOpen, 
    onClose, 
    channelStats, 
    initialVideos,
    isLoading,
    allChannels,
    channelGroups,
    recentlyViewedIds,
    onSwitchChannel,
    sortOrder,
    onSortOrderChange
}) => {
    const [sidebarSearch, setSidebarSearch] = useState('');

    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const sidebarData = useMemo(() => {
        const search = sidebarSearch.toLowerCase();
        const filteredChannels = allChannels.filter(c => 
            c.title.toLowerCase().includes(search) || 
            c.id.toLowerCase().includes(search)
        );
        const recent = recentlyViewedIds
            .map(id => filteredChannels.find(c => c.id === id))
            .filter((c): c is ChannelStats => !!c);
        const grouped = channelGroups.map(group => ({
            ...group,
            channels: filteredChannels.filter(c => group.channelIds.includes(c.id))
        })).filter(g => g.channels.length > 0);
        const allGroupedIds = new Set(channelGroups.flatMap(g => g.channelIds));
        const others = filteredChannels.filter(c => !allGroupedIds.has(c.id));
        return { recent, grouped, others };
    }, [allChannels, channelGroups, recentlyViewedIds, sidebarSearch]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-2 md:p-4 animate-fade-in"
            onClick={onClose}
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-[120] bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-90 hover:rotate-90 group"
                title="Close Dashboard"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div 
                className="bg-[#0f172a] w-full max-w-[98vw] h-[95vh] rounded-[2.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex relative font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-black/20 backdrop-blur-3xl">
                    <div className="p-5 border-b border-white/5 bg-gray-900/10">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="Search..."
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors duration-200 outline-none"
                            />
                            <svg className="absolute right-3 top-2.5 w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                        {sidebarData.recent.length > 0 && (
                            <>
                                <SidebarSection 
                                    title="Recent History" 
                                    icon={<svg className="w-2.5 h-2.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
                                />
                                {sidebarData.recent.map(channel => (
                                    <ChannelNavItem 
                                        key={`recent-${channel.id}`}
                                        channel={channel}
                                        isActive={channel.id === channelStats.id}
                                        onSelect={() => onSwitchChannel(channel.id)}
                                    />
                                ))}
                            </>
                        )}
                        {sidebarData.grouped.map(group => (
                            <React.Fragment key={group.id}>
                                <SidebarSection 
                                    title={group.name} 
                                    icon={<svg className="w-2.5 h-2.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>}
                                />
                                {group.channels.map(channel => (
                                    <ChannelNavItem 
                                        key={`group-${group.id}-${channel.id}`}
                                        channel={channel}
                                        isActive={channel.id === channelStats.id}
                                        onSelect={() => onSwitchChannel(channel.id)}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                        {sidebarData.others.length > 0 && (
                            <>
                                <SidebarSection 
                                    title="Other Channels" 
                                    icon={<svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>}
                                />
                                {sidebarData.others.map(channel => (
                                    <ChannelNavItem 
                                        key={`other-${channel.id}`}
                                        channel={channel}
                                        isActive={channel.id === channelStats.id}
                                        onSelect={() => onSwitchChannel(channel.id)}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col relative min-w-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 scroll-smooth bg-gradient-to-br from-transparent to-indigo-950/5">
                        {isLoading ? (
                            <DashboardSkeleton />
                        ) : (
                            <Dashboard 
                                channelStats={channelStats} 
                                initialVideos={initialVideos}
                                sortOrder={sortOrder} 
                                onSortOrderChange={onSortOrderChange}
                                videosPerPage={12} 
                                onVideosPerPageChange={() => {}}
                                onLoadMore={() => {}} 
                                hasNextPage={false} 
                                isLoadingMore={false}
                                onBack={onClose} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};