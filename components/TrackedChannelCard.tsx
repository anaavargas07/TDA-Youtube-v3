
import React from 'react';
import type { ChannelStats } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/helpers';

interface TrackedChannelCardProps {
    channel: ChannelStats;
    onSelect: (channelId: string) => void;
    onRemove: (channelId: string) => void;
}

export const TrackedChannelCard: React.FC<TrackedChannelCardProps> = ({ channel, onSelect, onRemove }) => {
    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg group flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-indigo-500/20">
            <div className="p-4 flex flex-col items-center text-center flex-grow">
                <img 
                    src={channel.thumbnailUrl} 
                    alt={`${channel.title} logo`}
                    className="w-24 h-24 rounded-full border-4 border-gray-700 group-hover:border-indigo-500 transition-colors"
                />
                <h3 className="text-lg font-bold text-white mt-4 line-clamp-2" title={channel.title}>
                    {channel.title}
                </h3>
                <p className="text-sm text-indigo-400">{channel.customUrl.startsWith('@') ? channel.customUrl : `@${channel.customUrl}`}</p>
                
                <div className="my-2 text-center">
                    <p className="text-xs text-gray-500">
                        Since: {new Date(channel.publishedAt).toLocaleDateString()}
                    </p>
                    {channel.lastRefreshedAt && (
                        <div 
                            className="mt-1 text-xs text-gray-400 flex items-center gap-1.5 justify-center" 
                            title={`Last scanned: ${new Date(channel.lastRefreshedAt).toLocaleString()}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            <span>{formatRelativeTime(new Date(channel.lastRefreshedAt).toISOString())}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-around w-full mt-auto text-sm">
                    <div className="text-center">
                        <p className="font-bold text-white">{formatNumber(channel.subscriberCount)}</p>
                        <p className="text-xs text-gray-400">Subs</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-white">{formatNumber(channel.videoCount)}</p>
                        <p className="text-xs text-gray-400">Videos</p>
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-px bg-gray-700">
                <button 
                    onClick={() => onRemove(channel.id)}
                    className="bg-gray-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 font-semibold p-3 transition-colors text-sm"
                >
                    Remove
                </button>
                <button 
                    onClick={() => onSelect(channel.id)}
                    className="bg-gray-800 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300 font-semibold p-3 transition-colors text-sm"
                >
                    View Dashboard
                </button>
            </div>
        </div>
    );
};