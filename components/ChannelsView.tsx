import React, { useState, useMemo, useEffect } from 'react';
import { ChannelTable } from './ChannelTable';
// import { GroupsView } from './GroupsView'; // Removed, now handled by GroupsOverviewModal
// FIX: Import specific SortKey and SortDirection types from GroupsView to avoid conflict
import { SortKey as GroupsViewSortKey, SortDirection as GroupsViewSortDirection } from './GroupsOverviewModal'; // Adjusted import
import { MultiSelectDropdown, Option } from './MultiSelectDropdown';
import { AddChannelModal } from './AddChannelModal';
import { SummaryCards } from './SummaryCards';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { BulkActionBar } from './BulkActionBar';
import type { ChannelStats, ChannelGroup, AppSettings } from '../types';
import type { AddChannelResult } from '../hooks/useAppData';

type SortKey = 'title' | 'subscriberCount' | 'videoCount' | 'viewCount' | 'publishedAt' | 'newestVideoDate' | 'oldestVideoDate';
type SortDirection = 'asc' | 'desc';

interface ChannelsViewProps {
    currentSubView: 'allChannels'; // Simplified: now only 'allChannels' is managed here
    trackedChannels: ChannelStats[];
    channelGroups: ChannelGroup[];
    onAddChannel: (channelInput: string) => Promise<AddChannelResult[]>;
    onSelectChannel: (channelId: string) => void;
    onRemoveChannel: (channelId: string) => void;
    onSaveGroup: (group: Omit<ChannelGroup, 'id' | 'createdAt'> & { id?: string; createdAt: string }) => void;
    onDeleteGroup: (groupId: string) => void;
    isAdding: boolean;
    apiKeySet: boolean;
    settings: AppSettings;
    setChannelGroups: React.Dispatch<React.SetStateAction<ChannelGroup[]>>; // Passed from App.tsx
    setEditingGroup: React.Dispatch<React.SetStateAction<ChannelGroup | null>>; // Passed from App.tsx
    setIsGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>; // Passed from App.tsx
}

const ALL_CHANNEL_COLUMNS: Option[] = [
    { id: 'title', label: 'Channel Name', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
    { id: 'publishedAt', label: 'Created Date', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> },
    { id: 'subscriberCount', label: 'Subscribers', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0a5.995 5.995 0 0 0-4.058-2.532M6 18.719a5.971 5.971 0 0 1 .941-3.197m0 0a5.995 5.995 0 0 1 4.058-2.532M0 0a5.995 5.995 0 0 1 4.058-2.532M15 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg> },
    { id: 'viewCount', label: 'Total Views', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 016 0Z" /></svg> },
    { id: 'videoCount', label: 'Total Videos', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg> },
    { id: 'newestVideo', label: 'Newest Video', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0118 0Z" /></svg> },
    { id: 'oldestVideo', label: 'Oldest Video', icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0118 0Z" /></svg> },
];

const ALL_GROUP_COLUMNS: Option[] = [ // Moved here for ChannelsView's MultiSelectDropdown
    { id: 'name', label: 'Group Name' },
    { id: 'createdAt', label: 'Created At' },
    { id: 'channelCount', label: 'Channels' },
];

const timeOptions: Option[] = [ // Moved here for ChannelsView's MultiSelectDropdown
    { id: 'today', label: 'Created Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
];

export const ChannelsView: React.FC<ChannelsViewProps> = ({
    currentSubView, // Now always 'allChannels' here
    trackedChannels, channelGroups, onAddChannel, onSelectChannel, onRemoveChannel,
    onSaveGroup, onDeleteGroup, isAdding, apiKeySet, settings, setChannelGroups,
    setEditingGroup, setIsGroupModalOpen
}) => {
    // States for All Channels view
    const [channelSearchQuery, setChannelSearchQuery] = useState('');
    const [selectedGroupFilterIds, setSelectedGroupFilterIds] = useState<string[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [visibleChannelColumns, setVisibleChannelColumns] = useState<string[]>(ALL_CHANNEL_COLUMNS.map(c => c.id));
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [channelSortConfig, setChannelSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'subscriberCount', direction: 'desc' });
    
    // Shared states for bulk actions (only for channels now)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeBulkMenu, setActiveBulkMenu] = useState<'group' | null>(null);
    const [bulkSearchTerm, setBulkSearchTerm] = useState('');
    const [pendingBulkValues, setPendingBulkValues] = useState<string[]>([]);

    // Reset selection and bulk action menus when switching sub-views
    useEffect(() => {
        setSelectedChannelIds([]);
        setActiveBulkMenu(null);
        setPendingBulkValues([]);
    }, [currentSubView]);

    // Close bulk menus or clear selection on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeBulkMenu) {
                    setActiveBulkMenu(null);
                } else if (selectedChannelIds.length > 0) {
                    setSelectedChannelIds([]);
                } 
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [activeBulkMenu, selectedChannelIds]);


    const groupOptions: Option[] = useMemo(() => channelGroups.map(g => ({ 
        id: g.id, 
        label: g.name, 
        color: '#4f46e5',
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.625-4.016a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016Z" /></svg>
    })), [channelGroups]);

    // Filtered and sorted channels for ChannelTable
    const filteredAndSortedChannels = useMemo(() => {
        let result = trackedChannels.filter(channel => {
            const matchesSearch = channel.title.toLowerCase().includes(channelSearchQuery.toLowerCase()) || channel.id.includes(channelSearchQuery);
            const matchesGroup = selectedGroupFilterIds.length === 0 || channelGroups.some(g => selectedGroupFilterIds.includes(g.id) && g.channelIds.includes(channel.id));
            return matchesSearch && matchesGroup;
        });

        result.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (channelSortConfig.key === 'newestVideoDate') {
                valA = a.newestVideo?.publishedAt ? new Date(a.newestVideo.publishedAt).getTime() : 0;
                valB = b.newestVideo?.publishedAt ? new Date(b.newestVideo.publishedAt).getTime() : 0;
            } else if (channelSortConfig.key === 'oldestVideoDate') {
                valA = a.oldestVideo?.publishedAt ? new Date(a.oldestVideo.publishedAt).getTime() : 0;
                valB = b.oldestVideo?.publishedAt ? new Date(b.oldestVideo.publishedAt).getTime() : 0;
            } else if (channelSortConfig.key === 'publishedAt') {
                valA = new Date(a.publishedAt).getTime();
                valB = new Date(b.publishedAt).getTime();
            } else {
                valA = a[channelSortConfig.key as keyof ChannelStats];
                valB = b[channelSortConfig.key as keyof ChannelStats];
            }

            if (['subscriberCount', 'viewCount', 'videoCount'].includes(channelSortConfig.key)) {
                valA = parseInt(valA as string, 10) || 0;
                valB = parseInt(valB as string, 10) || 0;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB as string).toLowerCase();
            }

            if (valA < valB) return channelSortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return channelSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [trackedChannels, channelSearchQuery, selectedGroupFilterIds, channelGroups, channelSortConfig]);


    const handleConfirmDelete = () => {
        // Now only handles channel deletion
        selectedChannelIds.forEach(id => onRemoveChannel(id));
        setSelectedChannelIds([]);
        setIsDeleteModalOpen(false);
    };

    const commitBulkAction = () => {
        if (pendingBulkValues.length === 0 || currentSubView !== 'allChannels') return;
        
        if (activeBulkMenu === 'group') {
            pendingBulkValues.forEach(groupId => {
                const targetGroup = channelGroups.find(g => g.id === groupId);
                if (targetGroup) {
                    const combinedChannelIds = Array.from(new Set([...targetGroup.channelIds, ...selectedChannelIds]));
                    onSaveGroup({ ...targetGroup, channelIds: combinedChannelIds }); // Use onSaveGroup for update
                }
            });
            setSelectedChannelIds([]);
        }
        
        setActiveBulkMenu(null);
        setPendingBulkValues([]);
    };

    const togglePendingValue = (val: string) => {
        if (activeBulkMenu === 'group') { // Only 'group' bulk action for channels
            setPendingBulkValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
        } else {
            setPendingBulkValues([val]);
        }
    };

    const renderQuickCreateGroupButton = () => (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                setEditingGroup(null); // Clear any existing group for new creation
                setIsGroupModalOpen(true);
                setActiveBulkMenu(null); // Close bulk menu if open
                setPendingBulkValues([]); // Clear pending values
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-all"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Quick Create Group
        </button>
    );

    return (
        <div className="w-full space-y-6 pb-20 relative">
            {/* Filter & Add Controls */}
            <div className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50 space-y-4 shadow-xl animate-fade-in">
                <div className="flex flex-row gap-4 items-center h-11">
                    <div className="relative flex-grow h-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text" 
                            value={channelSearchQuery} 
                            onChange={(e) => setChannelSearchQuery(e.target.value)} 
                            placeholder="Search channels by name or ID..." 
                            className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium" 
                        />
                    </div>
                    <MultiSelectDropdown 
                        label="Columns" 
                        options={ALL_CHANNEL_COLUMNS} 
                        selectedIds={visibleChannelColumns} 
                        onChange={setVisibleChannelColumns} 
                        className="w-40 h-full"
                        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>}
                    />
                    <button onClick={() => setIsAddModalOpen(true)} className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Channel
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <MultiSelectDropdown 
                        label="Groups" 
                        options={groupOptions} 
                        selectedIds={selectedGroupFilterIds} 
                        onChange={setSelectedGroupFilterIds} 
                        className="w-full h-11"
                        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
                        footer={renderQuickCreateGroupButton()}
                    />
                </div>
            </div>
            
            {/* Summary Cards */}
            <div className="animate-fade-in">
                <SummaryCards channels={filteredAndSortedChannels} />
            </div>

            {/* Channel Table */}
            <div className="animate-fade-in">
                <ChannelTable 
                    channels={filteredAndSortedChannels} 
                    sortConfig={channelSortConfig} 
                    onSortChange={(k) => setChannelSortConfig(p => ({ key: k, direction: p.key === k && p.direction === 'desc' ? 'asc' : 'desc' }))} 
                    onSelect={onSelectChannel} 
                    onRemove={onRemoveChannel} 
                    visibleColumns={visibleChannelColumns} 
                    selectedIds={selectedChannelIds} 
                    onToggleRow={(id) => setSelectedChannelIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} 
                    onToggleAll={() => setSelectedChannelIds(selectedChannelIds.length === filteredAndSortedChannels.length ? [] : filteredAndSortedChannels.map(c => c.id))} 
                    isAllSelected={filteredAndSortedChannels.length > 0 && selectedChannelIds.length === filteredAndSortedChannels.length} 
                />
            </div>

            {selectedChannelIds.length > 0 && (
                <BulkActionBar count={selectedChannelIds.length} onClear={() => setSelectedChannelIds([])} onDelete={() => setIsDeleteModalOpen(true)}>
                    <div className="relative">
                        <button onClick={() => { setActiveBulkMenu(activeBulkMenu === 'group' ? null : 'group'); setBulkSearchTerm(''); setPendingBulkValues([]); }} className={`flex items-center gap-2 transition-all hover:scale-105 ${activeBulkMenu === 'group' ? 'text-indigo-400' : 'text-gray-300 hover:text-white'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            <span className="text-sm font-bold">Add Group</span>
                        </button>
                        {activeBulkMenu === 'group' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-gray-700 bg-black/20">
                                    <input type="text" autoFocus placeholder="Search Group..." value={bulkSearchTerm} onChange={e => setBulkSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/50" />
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {channelGroups.length > 0 ? (
                                        <>
                                            {channelGroups.filter(g => g.name.toLowerCase().includes(bulkSearchTerm.toLowerCase())).map(g => (
                                                <button key={g.id} onClick={() => togglePendingValue(g.id)} className={`w-full text-left px-4 py-2 text-xs truncate flex justify-between items-center transition-colors ${pendingBulkValues.includes(g.id) ? 'bg-indigo-600/30 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                                                    {g.name}
                                                    {pendingBulkValues.includes(g.id) && <span className="text-indigo-400 font-bold ml-2">✓</span>}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-[10px] text-gray-500 italic">No groups found</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-1 border-t border-gray-700 bg-gray-900/50">
                                    {renderQuickCreateGroupButton()}
                                </div>
                                {channelGroups.length > 0 && (
                                    <button onClick={commitBulkAction} disabled={pendingBulkValues.length === 0} className="m-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Add to {pendingBulkValues.length} {pendingBulkValues.length === 1 ? 'Group' : 'Groups'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </BulkActionBar>
            )}

            <AddChannelModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddChannel={onAddChannel} isDisabled={!apiKeySet || isAdding} isAdding={isAdding} />
            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleConfirmDelete} 
                count={selectedChannelIds.length} 
                itemName={'channel'} 
            />
        </div>
    );
};