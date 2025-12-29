
import React, { useState } from 'react';
import type { ChannelStats } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import { MiniVideoDisplay } from './MiniVideoDisplay';
import { CircularCheckbox } from './CircularCheckbox'; 
import { SortableHeader } from './SortableHeader'; 

interface ChannelTableProps {
    channels: ChannelStats[];
    sortConfig: { key: string; direction: 'asc' | 'desc' };
    onSortChange: (key: any) => void;
    onSelect: (channelId: string) => void;
    onRemove: (channelId: string) => void;
    visibleColumns: string[];
    selectedIds: string[];
    onToggleRow: (id: string) => void;
    onToggleAll: () => void;
    isAllSelected: boolean;
}

const ModernStat: React.FC<{ value: number, max: number, label: string, gradientClass: string, rawValue: string }> = ({ value, max, label, gradientClass, rawValue }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex flex-col gap-1.5 w-full min-w-[100px]">
            <div className="px-0.5" title={parseInt(rawValue, 10).toLocaleString()}>
                <span className="text-[10px] font-medium text-slate-100 tabular-nums">{label}</span>
            </div>
            <div className="w-full bg-slate-800/60 rounded-full h-1.5 relative overflow-hidden border border-white/5">
                <div
                    className={`${gradientClass} h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                ></div>
            </div>
        </div>
    );
}

const ChannelIdDisplay: React.FC<{ id: string }> = ({ id }) => {
    const [copied, setCopied] = useState(false);
    const copyId = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div 
            className="flex items-center gap-1.5 cursor-pointer no-row-click click-navigate group/copy" 
            onClick={copyId}
            title={copied ? "Copied!" : "Click to copy Channel ID"}
        >
            <span className="text-[10px] font-medium text-gray-300 opacity-80 group-hover/copy:opacity-100 transition-opacity">
                {id}
            </span>
            <svg 
                className={`ml-1 w-3 h-3 text-gray-500 opacity-0 group-hover/copy:opacity-100 transition-opacity ${copied ? 'text-green-400 opacity-100' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                strokeWidth={copied ? 3 : 2}
            >
                {copied ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                )}
            </svg>
        </div>
    );
};

export const ChannelTable: React.FC<ChannelTableProps> = ({ 
    channels, 
    sortConfig, 
    onSortChange, 
    onSelect, 
    visibleColumns,
    selectedIds,
    onToggleRow,
    onToggleAll,
    isAllSelected
}) => {
    const maxValues = React.useMemo(() => {
        if (channels.length === 0) return { subs: 0, views: 0, videos: 0 };
        return {
            subs: Math.max(...channels.map(c => parseInt(c.subscriberCount, 10) || 0), 1),
            views: Math.max(...channels.map(c => parseInt(c.viewCount, 10) || 0), 1),
            videos: Math.max(...channels.map(c => parseInt(c.videoCount, 10) || 0), 1),
        };
    }, [channels]);

    if (channels.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700 border-dashed">
                <p className="text-gray-400 text-sm">No channels match the current filter.</p>
            </div>
        );
    }

    const isVisible = (colId: string) => visibleColumns.includes(colId);

    return (
        <div className="overflow-x-auto bg-gray-800/40 rounded-xl shadow-xl border border-gray-700/50 font-sans">
            <table className="min-w-full border-separate border-spacing-0 table-fixed">
                <thead className="bg-[#111927]">
                    <tr>
                        <th className="px-4 py-3 w-12 text-center sticky left-0 z-10 bg-[#111927] border-b border-gray-700/50 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                            <CircularCheckbox checked={isAllSelected} onChange={onToggleAll} label="Select all channels" />
                        </th>
                        {isVisible('title') && (
                            <SortableHeader 
                                label="Channel Name" 
                                sortKey="title" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/5 border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                        )}
                        {isVisible('publishedAt') && (
                            <SortableHeader 
                                label="Created Date" 
                                sortKey="publishedAt" 
                                currentSort={sortConfig} 
                                onSort={onSortChange}
                                className="border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            />
                        )}
                        {isVisible('subscriberCount') && (
                            <SortableHeader 
                                label="Subscribers" 
                                sortKey="subscriberCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[130px] border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                            />
                        )}
                        {isVisible('viewCount') && (
                            <SortableHeader 
                                label="Total Views" 
                                sortKey="viewCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[130px] border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                            />
                        )}
                        {isVisible('videoCount') && (
                             <SortableHeader 
                                label="Total Videos" 
                                sortKey="videoCount" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-[130px] border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>}
                            />
                        )}
                        {isVisible('newestVideo') && (
                            <SortableHeader 
                                label="Newest Video" 
                                sortKey="newestVideoDate" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/6 border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0118 0Z" /></svg>}
                            />
                        )}
                        {isVisible('oldestVideo') && (
                            <SortableHeader 
                                label="Oldest Video" 
                                sortKey="oldestVideoDate" 
                                currentSort={sortConfig} 
                                onSort={onSortChange} 
                                className="w-1/6 border-b border-gray-700/50"
                                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0118 0Z" /></svg>}
                            />
                        )}
                    </tr>
                </thead>
                <tbody className="bg-transparent">
                    {channels.map((channel) => {
                        const isTerminated = channel.status === 'terminated';
                        const isSelected = selectedIds.includes(channel.id);

                        const isRecentlyActive = channel.newestVideo?.publishedAt 
                            ? (Date.now() - new Date(channel.newestVideo.publishedAt).getTime()) < 24 * 60 * 60 * 1000
                            : false;

                        return (
                            <tr 
                                key={channel.id} 
                                className={`hover:bg-white/[0.03] transition-all duration-200 group ${isTerminated ? 'opacity-60 bg-red-900/10' : ''} ${isSelected ? 'bg-indigo-900/20' : ''}`}
                                onClick={(e) => {
                                    if (!(e.target as HTMLElement).closest('.click-navigate')) {
                                        onToggleRow(channel.id);
                                    }
                                }}
                            >
                                <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 z-10 bg-[#0f172a] border-b border-gray-700/50">
                                    <CircularCheckbox 
                                        checked={isSelected} 
                                        onChange={() => onToggleRow(channel.id)} 
                                        onClick={(e) => e.stopPropagation()} 
                                        label={`Select ${channel.title}`}
                                    />
                                </td>
                                {isVisible('title') && (
                                    <td className="px-4 py-2.5 whitespace-nowrap border-b border-gray-700/50">
                                        <div className="flex items-center">
                                            <div 
                                                className="flex-shrink-0 h-10 w-10 relative cursor-pointer group/avatar no-row-click click-navigate"
                                                onClick={(e) => { e.stopPropagation(); !isTerminated && onSelect(channel.id); }}
                                            >
                                                <img className={`h-10 w-10 rounded-full border transition-all duration-300 ${isTerminated ? 'border-red-500 grayscale' : 'border-gray-600 group-hover/avatar:border-indigo-500 group-hover/avatar:scale-105'} ${isRecentlyActive ? 'active-pulse ring-2 ring-green-500/50' : ''}`} src={channel.thumbnailUrl} alt="" />
                                                {isRecentlyActive && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm z-10"></span>
                                                )}
                                                {isTerminated && (
                                                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1 rounded font-bold">DEAD</div>
                                                )}
                                                <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/avatar:opacity-100 rounded-full transition-opacity"></div>
                                            </div>
                                            <div className="ml-4 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <div 
                                                        className={`text-[13px] font-bold truncate max-w-[150px] transition-colors click-navigate leading-snug ${isTerminated ? 'text-red-400 cursor-not-allowed' : 'text-gray-200 group-hover:text-indigo-400 cursor-pointer'}`} 
                                                        onClick={() => !isTerminated && onSelect(channel.id)} 
                                                        title={isTerminated ? "Channel Terminated/Not Found" : channel.title}
                                                    >
                                                        {channel.title}
                                                    </div>
                                                    {isRecentlyActive && (
                                                        <div className="flex items-center flex-shrink-0 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                                                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                                                            <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">New</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <ChannelIdDisplay id={channel.id} />
                                            </div>
                                        </div>
                                    </td>
                                )}
                                {isVisible('publishedAt') && (
                                    <td className="px-4 py-2.5 whitespace-nowrap border-b border-gray-700/50">
                                        <div className="flex flex-col text-center">
                                            <span className="text-[10px] font-medium text-gray-300">{new Date(channel.publishedAt).toLocaleDateString()}</span>
                                            <span className="text-[8px] font-normal text-gray-500 opacity-80">{new Date(channel.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                )}
                                {isVisible('subscriberCount') && (
                                    <td className="px-4 py-2.5 align-middle border-b border-gray-700/50">
                                        <ModernStat 
                                            value={parseInt(channel.subscriberCount, 10)} 
                                            max={maxValues.subs} 
                                            label={formatNumber(channel.subscriberCount)}
                                            rawValue={channel.subscriberCount}
                                            gradientClass="bg-gradient-to-r from-indigo-500 to-violet-400"
                                        />
                                    </td>
                                )}
                                {isVisible('viewCount') && (
                                    <td className="px-4 py-2.5 align-middle border-b border-gray-700/50">
                                        <ModernStat 
                                            value={parseInt(channel.viewCount, 10) || 0} 
                                            max={maxValues.views} 
                                            label={formatNumber(channel.viewCount)}
                                            rawValue={channel.viewCount}
                                            gradientClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                                        />
                                    </td>
                                )}
                                {isVisible('videoCount') && (
                                     <td className="px-4 py-2.5 align-middle border-b border-gray-700/50">
                                        <ModernStat 
                                            value={parseInt(channel.videoCount, 10) || 0} 
                                            max={maxValues.videos} 
                                            label={formatNumber(channel.videoCount)}
                                            rawValue={channel.videoCount}
                                            gradientClass="bg-gradient-to-r from-purple-500 to-fuchsia-400"
                                        />
                                    </td>
                                )}
                                {isVisible('newestVideo') && (
                                    <td className="px-4 py-2.5 align-middle border-b border-gray-700/50">
                                        {isTerminated ? <span className="text-xs text-red-500 italic">Unavailable</span> : <MiniVideoDisplay video={channel.newestVideo} type="Newest" />}
                                    </td>
                                )}
                                {isVisible('oldestVideo') && (
                                    <td className="px-4 py-2.5 align-middle border-b border-gray-700/50">
                                        {isTerminated ? <span className="text-xs text-red-500 italic">Unavailable</span> : <MiniVideoDisplay video={channel.oldestVideo} type="Oldest" />}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
