import React from 'react';
import type { ChannelGroup, ChannelStats } from '../types';

interface GroupCardProps {
    group: ChannelGroup;
    channels: ChannelStats[];
    onSelect: (groupId: string) => void;
    onEdit: (group: ChannelGroup) => void;
    onDelete: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, channels, onSelect, onEdit, onDelete }) => {
    const groupChannels = channels.filter(c => group.channelIds.includes(c.id));

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg group flex flex-col justify-between transition-transform transform hover:-translate-y-1 hover:shadow-indigo-500/20">
            <div className="p-4 flex flex-col items-center text-center flex-grow">
                <div className="flex -space-x-4">
                    {groupChannels.slice(0, 4).map((channel, index) => (
                        <img
                            key={channel.id}
                            className="w-16 h-16 border-2 border-gray-900 rounded-full"
                            src={channel.thumbnailUrl}
                            alt={channel.title}
                            style={{ zIndex: 4 - index }}
                        />
                    ))}
                </div>
                <h3 className="text-xl font-bold text-white mt-4" title={group.name}>
                    {group.name}
                </h3>
                <p className="text-sm text-gray-400">{group.channelIds.length} {group.channelIds.length === 1 ? 'channel' : 'channels'}</p>
            </div>
             <div className="grid grid-cols-3 gap-px bg-gray-700">
                <button 
                    onClick={() => onDelete(group.id)}
                    className="bg-gray-800 hover:bg-red-900/50 text-red-400 hover:text-red-300 font-semibold p-3 transition-colors text-sm"
                    aria-label={`Delete group ${group.name}`}
                >
                    Delete
                </button>
                <button 
                    onClick={() => onEdit(group)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold p-3 transition-colors text-sm"
                    aria-label={`Edit group ${group.name}`}
                >
                    Edit
                </button>
                <button 
                    onClick={() => onSelect(group.id)}
                    className="bg-gray-800 hover:bg-indigo-900/50 text-indigo-400 hover:text-indigo-300 font-semibold p-3 transition-colors text-sm"
                    aria-label={`View comparison for ${group.name}`}
                >
                    Compare
                </button>
            </div>
        </div>
    );
};
