import React, { useState } from 'react';
import { VideoStat, SortOrder, SortDirection } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import { SortableHeader } from './SortableHeader'; // Import from new file

interface VideoTableProps {
    videos: VideoStat[];
    sortOrder: SortOrder;
    sortDirection: SortDirection;
    onSortChange: (order: SortOrder) => void;
}

const StatBar: React.FC<{ value: number, max: number, label: string, colorClass?: string }> = ({ value, max, label, colorClass = "bg-indigo-500" }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex flex-col gap-1.5 w-full min-w-[100px]">
            <div className="px-0.5">
                <span className="text-[10px] font-bold text-slate-100 tabular-nums">{label}</span>
            </div>
            <div className="w-full bg-slate-800/60 rounded-full h-1.5 relative overflow-hidden border border-white/5">
                <div
                    className={`${colorClass} h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                ></div>
            </div>
        </div>
    );
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button 
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-all duration-300 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-white hover:bg-white/10 opacity-0 group-hover/title:opacity-100 shadow-sm'}`}
            title={copied ? "Copied!" : "Copy Title"}
        >
            {copied ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002h8a2 2 0 002-2v-2" />
                </svg>
            )}
        </button>
    );
};

export const VideoTable: React.FC<VideoTableProps> = ({ videos, sortOrder, sortDirection, onSortChange }) => {
    const maxValues = React.useMemo(() => {
        if (videos.length === 0) return { views: 0, likes: 0, comments: 0 };
        return {
            views: Math.max(...videos.map(v => parseInt(v.viewCount, 10) || 0), 1),
            likes: Math.max(...videos.map(v => parseInt(v.likeCount, 10) || 0), 1),
            comments: Math.max(...videos.map(v => parseInt(v.commentCount, 10) || 0), 1),
        };
    }, [videos]);

    return (
        <div className="w-full overflow-hidden bg-slate-900/40 backdrop-blur-md rounded-xl shadow-2xl border border-white/5 font-sans">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full divide-y divide-slate-800/50 table-fixed border-collapse">
                    <thead className="bg-slate-950/30">
                        <tr>
                            <th className="px-4 py-2.5 text-center text-sm font-medium text-slate-300 w-auto min-w-[280px] whitespace-nowrap overflow-hidden">
                                <div className="flex items-center justify-center gap-2.5 opacity-90 truncate">
                                    <div className="p-1 bg-indigo-500/10 rounded-lg flex-shrink-0">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="truncate">Video Details</span>
                                </div>
                            </th>
                            <SortableHeader 
                                label="Published" 
                                sortKey="date" 
                                currentSort={{ key: sortOrder, direction: sortDirection }}
                                onSort={onSortChange}
                                className="w-[110px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round"/></svg>}
                            />
                            <SortableHeader 
                                label="Views" 
                                sortKey="viewCount" 
                                currentSort={{ key: sortOrder, direction: sortDirection }}
                                onSort={onSortChange}
                                className="w-[140px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
                            />
                            <SortableHeader 
                                label="Likes" 
                                sortKey="likeCount" 
                                currentSort={{ key: sortOrder, direction: sortDirection }}
                                onSort={onSortChange}
                                className="w-[140px]"
                                icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5 10m7-10h-2M5 10h2v10H5V10z" strokeLinecap="round"/></svg>}
                            />
                            <th className="px-4 py-2.5 text-center text-sm font-medium text-slate-300 w-[100px] whitespace-nowrap overflow-hidden">
                                <div className="flex items-center justify-center gap-2 opacity-90 truncate">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                    <span className="truncate">Stats</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30">
                        {videos.map((video) => {
                            return (
                                <tr key={video.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-4">
                                            <a 
                                                href={`https://www.youtube.com/watch?v=${video.id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="relative flex-shrink-0 w-24 aspect-video rounded-xl border border-white/5 group-hover:border-indigo-500/50 group-hover:scale-105 transition-all shadow-lg overflow-hidden"
                                            >
                                                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors"></div>
                                            </a>
                                            <div className="min-w-0 flex-1 relative group/title">
                                                <div className="flex items-center gap-2">
                                                    <a 
                                                        href={`https://www.youtube.com/watch?v=${video.id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[13px] font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate block leading-snug"
                                                        title={video.title}
                                                    >
                                                        {video.title}
                                                    </a>
                                                    <CopyButton text={video.title} />
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-800/40 rounded border border-white/5">SHORTS</span>
                                                    <span className="text-[10px] text-slate-600 font-mono tracking-tighter opacity-70">ID: {video.id}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-slate-200 whitespace-nowrap">{formatRelativeTime(video.publishedAt)}</span>
                                            <span className="text-[8px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">{new Date(video.publishedAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <StatBar 
                                            value={parseInt(video.viewCount, 10) || 0} 
                                            max={maxValues.views} 
                                            label={formatNumber(video.viewCount)} 
                                            colorClass="bg-gradient-to-r from-emerald-500 to-teal-400"
                                        />
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <StatBar 
                                            value={parseInt(video.likeCount, 10) || 0} 
                                            max={maxValues.likes} 
                                            label={formatNumber(video.likeCount)} 
                                            colorClass="bg-gradient-to-r from-rose-500 to-pink-400"
                                        />
                                    </td>
                                    <td className="px-4 py-2.5 align-middle">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-extrabold text-slate-300 tabular-nums">{formatNumber(video.commentCount)}</span>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter whitespace-nowrap">Comments</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};