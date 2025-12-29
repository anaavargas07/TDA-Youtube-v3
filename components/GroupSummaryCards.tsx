
import React from 'react';
import { formatNumber } from '../utils/helpers';
import type { ChannelGroup, ChannelStats } from '../types';

interface GroupSummaryCardsProps {
    groups: ChannelGroup[];
    channels: ChannelStats[];
}

export const GroupSummaryCards: React.FC<GroupSummaryCardsProps> = ({ groups, channels }) => {
    const totalGroups = groups.length;
    
    const uniqueChannelsInGroups = new Set(groups.flatMap(g => g.channelIds));
    const totalChannelsTracked = channels.length;
    const channelsNotInCategory = channels.filter(c => !uniqueChannelsInGroups.has(c.id)).length;
    
    // Average channels per group
    const avgPerGroup = totalGroups > 0 ? (groups.reduce((acc, g) => acc + g.channelIds.length, 0) / totalGroups).toFixed(1) : "0";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total Groups</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalGroups)}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">In Categories</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(uniqueChannelsInGroups.size)}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Avg. Size</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{avgPerGroup}</p>
                </div>
            </div>

            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Not Categorized</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(channelsNotInCategory)}</p>
                </div>
            </div>
        </div>
    );
};
