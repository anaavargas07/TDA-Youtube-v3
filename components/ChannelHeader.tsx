
import React, { useMemo, useState } from 'react';
import { ChannelStats } from '../types';
import { formatNumber } from '../utils/helpers';

interface ChannelHeaderProps {
    stats: ChannelStats;
}

const CopyableInfo: React.FC<{ label: string, value: string, icon?: React.ReactNode, isHandle?: boolean }> = ({ label, value, icon, isHandle }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative flex flex-col">
            {copied && (
                <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg animate-fade-in z-10 whitespace-nowrap">
                    COPIED!
                </div>
            )}
            
            <div 
                onClick={handleCopy}
                className="flex items-center gap-1.5 cursor-pointer group/copy transition-all py-0.5"
                title={`Click to copy ${label}`}
            >
                <div className="flex-shrink-0 opacity-50 group-hover/copy:opacity-100 transition-opacity">
                    {icon}
                </div>
                
                <div className={`${isHandle ? 'min-w-[100px]' : 'min-w-[150px]'} flex items-center`}>
                    <span className={`text-[11px] font-bold transition-colors select-none truncate ${isHandle ? 'text-indigo-400 group-hover/copy:text-indigo-300' : 'text-gray-500 font-mono group-hover/copy:text-gray-300'}`}>
                        {value}
                    </span>
                    <svg className={`ml-1.5 w-2.5 h-2.5 text-indigo-500/50 opacity-0 group-hover/copy:opacity-100 transition-opacity flex-shrink-0 ${copied ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({ stats }) => {
    const isRecentlyActive = useMemo(() => {
        if (!stats.newestVideo?.publishedAt) return false;
        const pubDate = new Date(stats.newestVideo.publishedAt).getTime();
        const now = Date.now();
        return (now - pubDate) < 24 * 60 * 60 * 1000;
    }, [stats.newestVideo]);

    const youtubeUrl = `https://www.youtube.com/channel/${stats.id}`;
    const handle = stats.customUrl.startsWith('@') ? stats.customUrl : `@${stats.customUrl}`;

    return (
        <div className="bg-gray-800/40 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-5 border border-white/5 shadow-xl backdrop-blur-sm">
            <div className="relative flex-shrink-0">
                <img 
                    src={stats.thumbnailUrl} 
                    alt={`${stats.title} logo`}
                    className={`w-20 h-20 rounded-full border-2 shadow-lg transition-all duration-500 ${isRecentlyActive ? 'active-pulse border-green-500/50 scale-105' : 'border-indigo-500/50'}`}
                />
                {isRecentlyActive && (
                    <div className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                        <span className="relative w-4 h-4 bg-green-500 rounded-full border-2 border-[#0f172a] shadow-lg flex items-center justify-center">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                        </span>
                    </div>
                )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2 overflow-hidden">
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    {/* YouTube Link */}
                    <a 
                        href={youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-1 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-full transition-all duration-300 border border-red-500/20"
                        title="Open on YouTube"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </a>
                    
                    <h1 className="text-xl font-black text-white tracking-tight leading-none truncate max-w-[200px] md:max-w-md">{stats.title}</h1>
                    
                    {isRecentlyActive && (
                        <div className="flex items-center flex-shrink-0 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                            <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse mr-1"></span>
                            <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">New</span>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
                    <CopyableInfo 
                        label="Handle" 
                        value={handle} 
                        isHandle={true}
                        icon={<svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>} 
                    />
                    
                    <CopyableInfo 
                        label="ID" 
                        value={stats.id} 
                        icon={<svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                    />
                </div>

                <p className="text-gray-400 text-[11px] line-clamp-1 max-w-xl opacity-70 italic">{stats.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-center items-center min-w-[70px]">
                    <p className="text-base font-black text-white tabular-nums">{formatNumber(stats.subscriberCount)}</p>
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Subs</p>
                </div>
                 <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-center items-center min-w-[70px]">
                    <p className="text-base font-black text-white tabular-nums">{formatNumber(stats.viewCount)}</p>
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Views</p>
                </div>
                 <div className="bg-white/5 p-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex flex-col justify-center items-center min-w-[70px]">
                    <p className="text-base font-black text-white tabular-nums">{formatNumber(stats.videoCount)}</p>
                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-wider">Videos</p>
                </div>
            </div>
        </div>
    )
};
