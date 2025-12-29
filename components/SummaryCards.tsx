
import React from 'react';
import { formatNumber } from '../utils/helpers';
import type { ChannelStats } from '../types';

interface SummaryCardsProps {
    channels: ChannelStats[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ channels }) => {
    const totalChannels = channels.length;
    
    const totalSubs = channels.reduce((acc, curr) => acc + (parseInt(curr.subscriberCount, 10) || 0), 0);
    const totalViews = channels.reduce((acc, curr) => acc + (parseInt(curr.viewCount, 10) || 0), 0);
    const totalVideos = channels.reduce((acc, curr) => acc + (parseInt(curr.videoCount, 10) || 0), 0);

    // Calculate "Active" channels (just a mockup logic: published a video in last 30 days - 
    // real logic requires checking latest video date which we might not have for all channels efficiently here without more API calls. 
    // For now, let's assume all valid channels are active).
    const activeChannels = channels.length; 

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total Channels</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalChannels)}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total Subscribers</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalSubs)}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total Views</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalViews)}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total Videos</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalVideos)}</p>
                </div>
            </div>
        </div>
    );
};
