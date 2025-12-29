
import React, { useState, useEffect, useMemo } from 'react';
import type { ChannelGroup, ChannelStats } from '../types';
import { formatNumber } from '../utils/helpers';

interface GroupSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (group: Omit<ChannelGroup, 'id' | 'createdAt'> & { id?: string; createdAt: string }) => void;
    existingGroup?: ChannelGroup | null;
    allChannels: ChannelStats[];
}

type SortKey = 'title' | 'subscriberCount' | 'videoCount' | 'addedAt';
type SortDirection = 'asc' | 'desc';

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ isOpen, onClose, onSave, existingGroup, allChannels }) => {
    const [name, setName] = useState('');
    const [selectedChannelIds, setSelectedChannelIds] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: SortDirection}>({ key: 'title', direction: 'asc' });

    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            if (existingGroup) {
                setName(existingGroup.name);
                setSelectedChannelIds(new Set(existingGroup.channelIds));
            } else {
                setName('');
                setSelectedChannelIds(new Set());
            }
            // Reset sort on open
            setSortConfig({ key: 'title', direction: 'asc' });
        }
    }, [existingGroup, isOpen]);

    const sortedChannels = useMemo(() => {
        return [...allChannels].sort((a, b) => {
            if (sortConfig.key === 'title') {
                const comparison = a.title.localeCompare(b.title);
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            } else if (sortConfig.key === 'subscriberCount') {
                const aSubs = parseInt(a.subscriberCount, 10);
                const bSubs = parseInt(b.subscriberCount, 10);
                return sortConfig.direction === 'asc' ? aSubs - bSubs : bSubs - aSubs;
            } else if (sortConfig.key === 'videoCount') {
                 const aVideos = parseInt(a.videoCount, 10);
                 const bVideos = parseInt(b.videoCount, 10);
                 return sortConfig.direction === 'asc' ? aVideos - bVideos : bVideos - aVideos;
            } else { // addedAt
                const aDate = a.addedAt || 0;
                const bDate = b.addedAt || 0;
                return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
            }
        });
    }, [allChannels, sortConfig]);

    if (!isOpen) return null;

    const handleToggleChannel = (channelId: string) => {
        const newSet = new Set(selectedChannelIds);
        if (newSet.has(channelId)) {
            newSet.delete(channelId);
        } else {
            newSet.add(channelId);
        }
        setSelectedChannelIds(newSet);
    };
    
    const handleSelectAll = () => {
        setSelectedChannelIds(new Set(allChannels.map(c => c.id)));
    };

    const handleUnselectAll = () => {
        setSelectedChannelIds(new Set());
    };

    const handleSortChange = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleSave = () => {
        if (!name.trim()) {
            const nameInput = document.getElementById('groupName');
            nameInput?.focus();
            nameInput?.classList.add('ring-2', 'ring-red-500');
            setTimeout(() => nameInput?.classList.remove('ring-2', 'ring-red-500'), 2000);
            return;
        }
        // FIX: Add the missing 'createdAt' property to satisfy the 'onSave' prop type.
        onSave({
            id: existingGroup?.id,
            name: name.trim(),
            channelIds: Array.from(selectedChannelIds),
            createdAt: existingGroup?.createdAt || new Date().toISOString(),
        });
        onClose();
    };
    
    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'desc' ? '▼' : '▲';
    };

    return (
         <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-modal-title"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl border border-indigo-500/30 m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="group-modal-title" className="text-xl font-bold">
                        {existingGroup ? 'Edit Group' : 'Create New Group'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label htmlFor="groupName" className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
                        <input
                            id="groupName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Main Competitors"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <div>
                                <h3 className="text-sm font-medium text-gray-300">Select Channels ({selectedChannelIds.size} selected)</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleSelectAll} disabled={allChannels.length === 0} className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">Select All</button>
                                <button onClick={handleUnselectAll} disabled={allChannels.length === 0} className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50">Unselect All</button>
                            </div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg border border-gray-700">
                             <div className="flex items-center p-2 text-xs font-semibold text-gray-400 border-b border-gray-700">
                                <div className="flex-grow flex items-center pl-12">
                                    <button onClick={() => handleSortChange('title')} className="hover:text-white">Name {getSortIndicator('title')}</button>
                                </div>
                                <div className="w-24 text-right">
                                    <button onClick={() => handleSortChange('subscriberCount')} className="hover:text-white">Subs {getSortIndicator('subscriberCount')}</button>
                                </div>
                                <div className="w-24 text-right">
                                     <button onClick={() => handleSortChange('videoCount')} className="hover:text-white">Videos {getSortIndicator('videoCount')}</button>
                                </div>
                                <div className="w-28 text-right pr-2">
                                    <button onClick={() => handleSortChange('addedAt')} className="hover:text-white">Date Added {getSortIndicator('addedAt')}</button>
                                </div>
                            </div>
                            <div className="space-y-1 p-1 max-h-60 overflow-y-auto">
                                {sortedChannels.length > 0 ? sortedChannels.map(channel => (
                                    <label key={channel.id} className="flex items-center p-2 rounded-md hover:bg-gray-700/50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannelIds.has(channel.id)}
                                            onChange={() => handleToggleChannel(channel.id)}
                                            className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                                        />
                                        <div className="flex items-center flex-grow ml-3 overflow-hidden">
                                            <img src={channel.thumbnailUrl} alt={channel.title} className="w-8 h-8 rounded-full mr-3 flex-shrink-0" />
                                            <span className="text-sm font-medium text-white truncate" title={channel.title}>{channel.title}</span>
                                        </div>
                                        <div className="w-24 text-right text-sm text-gray-300 flex-shrink-0">{formatNumber(channel.subscriberCount)}</div>
                                        <div className="w-24 text-right text-sm text-gray-300 flex-shrink-0">{formatNumber(channel.videoCount)}</div>
                                        <div className="w-28 text-right text-xs text-gray-400 pr-2 flex-shrink-0">{channel.addedAt ? new Date(channel.addedAt).toLocaleDateString() : 'N/A'}</div>
                                    </label>
                                )) : (
                                    <p className="text-sm text-gray-500 text-center py-4">No channels tracked yet. Add channels on the main dashboard first.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-lg">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg mr-2">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                        Save Group
                    </button>
                </div>
            </div>
        </div>
    );
};