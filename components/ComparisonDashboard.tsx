import React, { useState, useMemo } from 'react';
import type { ChannelComparisonData, ChannelGroup, VideoStat } from '../types';
import { formatNumber, formatRelativeTime, exportToCsv } from '../utils/helpers';
import { MiniVideoDisplay } from './MiniVideoDisplay';

const StatBar: React.FC<{ value: number, max: number, label: string }> = ({ value, max, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="w-full bg-gray-700 rounded-full h-6 relative">
            <div
                className="bg-indigo-600 h-6 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-start pl-3 text-sm font-semibold text-white">
                {label}
            </span>
        </div>
    );
}

const SortableHeader: React.FC<{
    title: string;
    sortKey: keyof ChannelComparisonData | 'newestVideoDate' | 'oldestVideoDate';
    sortConfig: any;
    setSortConfig: (config: any) => void;
    className?: string;
}> = ({ title, sortKey, sortConfig, setSortConfig, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = isSorted ? sortConfig.direction : 'none';

    const handleClick = () => {
        let newDirection: 'ascending' | 'descending' = 'descending';
        if (isSorted && sortConfig.direction === 'descending') {
            newDirection = 'ascending';
        }
        setSortConfig({ key: sortKey, direction: newDirection });
    };

    return (
        <th scope="col" className={`px-6 py-3 text-center text-sm font-medium text-gray-300 ${className}`}>
            <button onClick={handleClick} className="flex items-center justify-center gap-1 group w-full">
                <span>{title}</span>
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}>
                    {direction === 'descending' ? '▼' : '▲'}
                </span>
            </button>
        </th>
    );
};

interface ComparisonDashboardProps {
    group: ChannelGroup;
    data: ChannelComparisonData[];
    onBack: () => void;
    dateRange: { start: string, end: string } | null;
    onDateRangeChange: (range: { start: string, end: string } | null) => void;
    isHighQuotaFeaturesEnabled: boolean;
    onToggleHighQuotaFeatures: (isEnabled: boolean) => void;
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ group, data, onBack, dateRange, onDateRangeChange, isHighQuotaFeaturesEnabled, onToggleHighQuotaFeatures }) => {
    const [localDateRange, setLocalDateRange] = useState(dateRange ?? { start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'ascending' | 'descending' }>({ key: 'subscriberCount', direction: 'descending' });

    const handleApplyFilter = () => {
        if (localDateRange.start && localDateRange.end) {
            onDateRangeChange(localDateRange);
        }
    };
    
    const handleClearFilter = () => {
        setLocalDateRange({ start: '', end: '' });
        onDateRangeChange(null);
    }
    
    const handleSetPreset = (days: number | 'thisMonth' | 'lastMonth') => {
        let end = new Date();
        let start = new Date();
        if(typeof days === 'number') {
            start.setDate(end.getDate() - days);
        } else if (days === 'thisMonth') {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        } else if (days === 'lastMonth') {
            end = new Date(end.getFullYear(), end.getMonth(), 0);
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        }
        setLocalDateRange({ start: formatDate(start), end: formatDate(end) });
    };

    const handleExport = () => {
        const filename = `YouTube_Comparison_${group.name.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        const dataToExport = sortedData.map(channel => ({
            channelTitle: channel.title,
            createdDate: new Date(channel.publishedAt).toLocaleDateString(),
            channelHandle: channel.customUrl,
            subscribers: parseInt(channel.subscriberCount, 10),
            views: parseInt(channel.viewCount, 10),
            videos: parseInt(channel.videoCount, 10),
            newestVideoTitle: channel.newestVideo?.title ?? 'N/A',
            newestVideoDate: channel.newestVideo?.publishedAt ? new Date(channel.newestVideo.publishedAt).toLocaleDateString() : 'N/A',
            oldestVideoTitle: channel.oldestVideo?.title ?? 'N/A',
            oldestVideoDate: channel.oldestVideo?.publishedAt ? new Date(channel.oldestVideo.publishedAt).toLocaleDateString() : 'N/A',
        }));
        exportToCsv(filename, dataToExport);
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;
        
        return [...data].sort((a, b) => {
            let aValue: any;
            let bValue: any;
            const key = sortConfig.key;

            if (key === 'newestVideoDate') {
                aValue = a.newestVideo?.publishedAt ? new Date(a.newestVideo.publishedAt).getTime() : 0;
                bValue = b.newestVideo?.publishedAt ? new Date(b.newestVideo.publishedAt).getTime() : 0;
            } else if (key === 'oldestVideoDate') {
                aValue = a.oldestVideo?.publishedAt ? new Date(a.oldestVideo.publishedAt).getTime() : 0;
                bValue = b.oldestVideo?.publishedAt ? new Date(b.oldestVideo.publishedAt).getTime() : 0;
            } else if (key === 'publishedAt') {
                aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            } else {
                 aValue = a[key as keyof ChannelComparisonData];
                 bValue = b[key as keyof ChannelComparisonData];
            }

            if (aValue === null || aValue === undefined) aValue = -1;
            if (bValue === null || bValue === undefined) bValue = -1;

            if (['subscriberCount', 'viewCount', 'videoCount'].includes(key)) {
                aValue = parseInt(aValue, 10) || 0;
                bValue = parseInt(bValue, 10) || 0;
            }
            
            if (aValue < bValue) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }, [data, sortConfig]);

    const maxValues = React.useMemo(() => {
        if (data.length === 0) return { subs: 0, views: 0, videos: 0 };
        return {
            subs: Math.max(...data.map(c => parseInt(c.subscriberCount, 10) || 0)),
            views: Math.max(...data.map(c => parseInt(c.viewCount, 10) || 0)),
            videos: Math.max(...data.map(c => parseInt(c.videoCount, 10) || 0)),
        };
    }, [data]);

    return (
        <div className="w-full max-w-7xl mx-auto mt-2 space-y-8">
            <div className="flex items-center justify-between">
                <button 
                    onClick={onBack}
                    className="flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to All Channels
                </button>
                <h1 className="text-3xl font-bold text-white text-center">
                    Comparison: <span className="text-indigo-400">{group.name}</span>
                </h1>
                 <button 
                    onClick={handleExport}
                    disabled={data.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export to CSV
                </button>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
                {isHighQuotaFeaturesEnabled ? (
                    <div className="space-y-3">
                        <div className="md:flex justify-between items-center">
                            <div className="flex-1 mb-3 md:mb-0">
                                <h3 className="text-lg font-semibold text-white">Date Range Filter</h3>
                                <p className="text-xs text-amber-400 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    High API quota usage feature is active.
                                </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                                <input type="date" value={localDateRange.start} onChange={e => setLocalDateRange(p => ({ ...p, start: e.target.value }))} className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white" />
                                <span className="text-gray-400">to</span>
                                <input type="date" value={localDateRange.end} onChange={e => setLocalDateRange(p => ({ ...p, end: e.target.value }))} className="bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white" />
                                <button onClick={handleApplyFilter} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Apply</button>
                                {dateRange && <button onClick={handleClearFilter} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg text-sm">Clear</button>}
                                <button onClick={() => onToggleHighQuotaFeatures(false)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm">Disable</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-700/50">
                            <span className="text-sm text-gray-300">Presets:</span>
                            <button onClick={() => handleSetPreset(7)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded-md">Last 7 Days</button>
                            <button onClick={() => handleSetPreset(30)} className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded-md">Last 30 Days</button>
                            <button onClick={() => handleSetPreset('thisMonth')} className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded-md">This Month</button>
                            <button onClick={() => handleSetPreset('lastMonth')} className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded-md">Last Month</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Enable Date Range Comparison</h3>
                            <p className="text-sm text-gray-400">Warning: This feature is extremely API quota-intensive.</p>
                        </div>
                        <button onClick={() => onToggleHighQuotaFeatures(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                            Enable
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto bg-gray-800/50 rounded-lg shadow-lg">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <SortableHeader title="Channel" sortKey="title" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/4" />
                            <SortableHeader title="Created" sortKey="publishedAt" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="Subscribers" sortKey="subscriberCount" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/6" />
                            <SortableHeader title={dateRange ? 'Views In Range' : 'Total Views'} sortKey="viewCount" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/6" />
                            <SortableHeader title={dateRange ? 'Videos In Range' : 'Total Videos'} sortKey="videoCount" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/6" />
                            <SortableHeader title={dateRange ? 'Newest In Range' : 'Newest Video'} sortKey="newestVideoDate" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/5" />
                            <SortableHeader title={dateRange ? 'Oldest In Range' : 'Oldest Video'} sortKey="oldestVideoDate" sortConfig={sortConfig} setSortConfig={setSortConfig} className="w-1/5" />
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {sortedData.map((channel) => (
                            <tr key={channel.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12">
                                            <img className="h-12 w-12 rounded-full" src={channel.thumbnailUrl} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-bold text-white">{channel.title}</div>
                                            <div className="text-sm text-indigo-400">{channel.customUrl.startsWith('@') ? channel.customUrl : `@${channel.customUrl}`}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {new Date(channel.publishedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <StatBar value={parseInt(channel.subscriberCount, 10)} max={maxValues.subs} label={formatNumber(channel.subscriberCount)} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatBar value={parseInt(channel.viewCount, 10)} max={maxValues.views} label={formatNumber(channel.viewCount)} />
                                </td>
                                <td className="px-6 py-4">
                                    <StatBar value={parseInt(channel.videoCount, 10)} max={maxValues.videos} label={formatNumber(channel.videoCount)} />
                                </td>
                                <td className="px-6 py-4">
                                    <MiniVideoDisplay video={channel.newestVideo} type="Newest" />
                                </td>
                                <td className="px-6 py-4">
                                    <MiniVideoDisplay video={channel.oldestVideo} type="Oldest" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};