
import React, { useState, useMemo } from 'react';
import { ChannelStats, VideoStat, SortOrder, SortDirection } from '../types';
import { ChannelHeader } from './ChannelHeader';
import { VideoTable } from './VideoTable';
import { VideoFilterControls, VideoFilters } from './VideoFilterControls';
import { GrowthChart } from './GrowthChart';


interface DashboardProps {
    channelStats: ChannelStats;
    initialVideos: VideoStat[];
    sortOrder: SortOrder;
    onSortOrderChange: (order: SortOrder) => void;
    videosPerPage: number;
    onVideosPerPageChange: (value: number) => void;
    onLoadMore: () => void;
    hasNextPage: boolean;
    isLoadingMore: boolean;
    onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    channelStats, 
    initialVideos,
    sortOrder,
    onSortOrderChange,
    videosPerPage,
    onVideosPerPageChange,
    onLoadMore,
    hasNextPage,
    isLoadingMore,
    onBack
}) => {
    const [activeTab, setActiveTab] = useState<'videos' | 'growth'>('videos');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filters, setFilters] = useState<VideoFilters>({
        keyword: '',
        startDate: '',
        endDate: '',
        minViews: '',
        minLikes: '',
        datePreset: 'all'
    });

    const handleSort = (newOrder: SortOrder) => {
        if (newOrder === sortOrder) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            onSortOrderChange(newOrder);
            setSortDirection('desc');
        }
    };

    const filteredAndSortedVideos = useMemo(() => {
        let videos = [...initialVideos];

        // Apply filters
        if (filters.keyword) {
            videos = videos.filter(v => v.title.toLowerCase().includes(filters.keyword.toLowerCase()));
        }
        if (filters.startDate) {
            videos = videos.filter(v => new Date(v.publishedAt) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            videos = videos.filter(v => new Date(v.publishedAt) <= new Date(filters.endDate));
        }
        if (filters.minViews) {
            const min = parseInt(filters.minViews, 10);
            if (!isNaN(min)) {
                videos = videos.filter(v => parseInt(v.viewCount, 10) >= min);
            }
        }
         if (filters.minLikes) {
            const min = parseInt(filters.minLikes, 10);
            if (!isNaN(min)) {
                videos = videos.filter(v => (parseInt(v.likeCount, 10) || 0) >= min);
            }
        }

        // Apply sorting
        return videos.sort((a, b) => {
            let comparison = 0;
            switch (sortOrder) {
                case 'viewCount':
                    comparison = parseInt(b.viewCount, 10) - parseInt(a.viewCount, 10);
                    break;
                case 'likeCount':
                    comparison = (parseInt(b.likeCount, 10) || 0) - (parseInt(a.likeCount, 10) || 0);
                    break;
                case 'date':
                default:
                    comparison = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                    break;
            }
            return sortDirection === 'desc' ? comparison : -comparison;
        });
    }, [initialVideos, filters, sortOrder, sortDirection]);


    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">
            <ChannelHeader stats={channelStats} />

             <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`${
                            activeTab === 'videos'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-bold text-base transition-colors flex items-center gap-2`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Latest videos
                    </button>
                    <button
                         onClick={() => setActiveTab('growth')}
                         className={`${
                            activeTab === 'growth'
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-bold text-base transition-colors flex items-center gap-2`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                        Growth chart
                    </button>
                </nav>
            </div>
            
            {activeTab === 'videos' && (
                <>
                    {initialVideos.length > 0 ? (
                        <div className="space-y-4">
                            <VideoFilterControls filters={filters} onFilterChange={setFilters} />

                            <VideoTable 
                                videos={filteredAndSortedVideos} 
                                sortOrder={sortOrder}
                                sortDirection={sortDirection}
                                onSortChange={handleSort} 
                            />

                            {hasNextPage && (
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={onLoadMore}
                                        disabled={isLoadingMore}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center text-sm"
                                    >
                                        {isLoadingMore ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Loading...
                                            </>
                                        ) : (
                                            'Load more'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="text-center py-12 px-6 bg-gray-800/50 rounded-2xl">
                            <h3 className="text-xl font-bold text-white">No videos found</h3>
                            <p className="text-gray-400 mt-2 text-sm">This channel may not have any public videos available.</p>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'growth' && (
                <GrowthChart history={channelStats.history} />
            )}
        </div>
    );
};
