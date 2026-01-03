import React, { useState, useMemo, useEffect } from 'react';
import { ChannelTable, MONETIZATION_OPTIONS, ENGAGEMENT_OPTIONS } from './ChannelTable';
import { MultiSelectDropdown, Option } from './MultiSelectDropdown';
import { AddChannelModal } from './AddChannelModal';
import { SummaryCards } from './SummaryCards';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { BulkActionBar } from './BulkActionBar';
import { StatusOverviewModal } from './StatusOverviewModal';
import type { ChannelStats, ChannelGroup, AppSettings, MonetizationStatus, EngagementStatus } from '../types';
import type { AddChannelResult } from '../hooks/useAppData';

type SortKey = 'title' | 'subscriberCount' | 'videoCount' | 'viewCount' | 'publishedAt' | 'addedAt' | 'newestVideoDate' | 'oldestVideoDate' | 'monetizationStatus' | 'engagementStatus';
type SortDirection = 'asc' | 'desc';

interface ChannelsViewProps {
    currentSubView: 'allChannels';
    trackedChannels: ChannelStats[];
    channelGroups: ChannelGroup[];
    onAddChannel: (channelInput: string) => Promise<AddChannelResult[]>;
    onSelectChannel: (channelId: string) => void;
    onRemoveChannel: (channelId: string) => void;
    onUpdateChannel: (id: string, updates: Partial<ChannelStats>) => void;
    onSaveGroup: (group: Omit<ChannelGroup, 'id' | 'createdAt'> & { id?: string; createdAt: string }) => void;
    onDeleteGroup: (groupId: string) => void;
    handleBulkUpdateChannels: (ids: string[], updates: Partial<ChannelStats>) => Promise<void>;
    isAdding: boolean;
    apiKeySet: boolean;
    settings: AppSettings;
    setChannelGroups: React.Dispatch<React.SetStateAction<ChannelGroup[]>>;
    setEditingGroup: React.Dispatch<React.SetStateAction<ChannelGroup | null>>;
    setIsGroupModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onOpenGroupsOverview: () => void;
}

const ALL_CHANNEL_COLUMNS: Option[] = [
    { id: 'title', label: 'Channel Name' },
    { id: 'isMonetized', label: 'Monetized', icon: <span className="text-xs">💸</span> },
    { id: 'engagementRate', label: 'Engagement', icon: <span className="text-xs">👍</span> },
    { id: 'publishedAt', label: 'Created Date' },
    { id: 'addedAt', label: 'Added Date' },
    { id: 'subscriberCount', label: 'Subscribers' },
    { id: 'viewCount', label: 'Total Views' },
    { id: 'videoCount', label: 'Total Videos' },
    { id: 'newestVideo', label: 'Newest Video' },
];

export const ChannelsView: React.FC<ChannelsViewProps> = ({
    trackedChannels, channelGroups, onAddChannel, onSelectChannel, onRemoveChannel, onUpdateChannel,
    onSaveGroup, handleBulkUpdateChannels, isAdding, apiKeySet, settings, setChannelGroups,
    setEditingGroup, setIsGroupModalOpen, onOpenGroupsOverview
}) => {
    const [channelSearchQuery, setChannelSearchQuery] = useState('');
    const [selectedGroupFilterIds, setSelectedGroupFilterIds] = useState<string[]>([]);
    const [selectedMonetizedFilters, setSelectedMonetizedFilters] = useState<string[]>([]);
    const [selectedEngagementFilters, setSelectedEngagementFilters] = useState<string[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const [visibleChannelColumns, setVisibleChannelColumns] = useState<string[]>(
        ALL_CHANNEL_COLUMNS.filter(c => c.id !== 'addedAt').map(c => c.id)
    );
    
    const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
    const [channelSortConfig, setChannelSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'subscriberCount', direction: 'desc' });
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeBulkMenu, setActiveBulkMenu] = useState<'group' | 'monetized' | 'engagement' | null>(null);
    const [pendingBulkValues, setPendingBulkValues] = useState<string[]>([]);

    const [isMonetizationOverviewOpen, setIsMonetizationOverviewOpen] = useState(false);
    const [isEngagementOverviewOpen, setIsEngagementOverviewOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeBulkMenu) setActiveBulkMenu(null);
                else if (selectedChannelIds.length > 0) setSelectedChannelIds([]);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [activeBulkMenu, selectedChannelIds]);

    const groupOptions: Option[] = useMemo(() => channelGroups.map(g => ({ 
        id: g.id, label: g.name, badge: g.channelIds.length
    })), [channelGroups]);

    const filteredAndSortedChannels = useMemo(() => {
        let result = trackedChannels.filter(channel => {
            const matchesSearch = channel.title.toLowerCase().includes(channelSearchQuery.toLowerCase()) || channel.id.includes(channelSearchQuery);
            const matchesGroup = selectedGroupFilterIds.length === 0 || channelGroups.some(g => selectedGroupFilterIds.includes(g.id) && g.channelIds.includes(channel.id));
            
            const matchesMonetized = selectedMonetizedFilters.length === 0 || 
                selectedMonetizedFilters.includes(channel.monetizationStatus || 'not_monetized');

            const matchesEngagement = selectedEngagementFilters.length === 0 || 
                selectedEngagementFilters.includes(channel.engagementStatus || 'good');

            return matchesSearch && matchesGroup && matchesMonetized && matchesEngagement;
        });

        result.sort((a, b) => {
            let valA: any;
            let valB: any;

            if (channelSortConfig.key === 'newestVideoDate') {
                valA = a.newestVideo?.publishedAt ? new Date(a.newestVideo.publishedAt).getTime() : 0;
                valB = b.newestVideo?.publishedAt ? new Date(b.newestVideo.publishedAt).getTime() : 0;
            } else {
                valA = a[channelSortConfig.key as keyof ChannelStats];
                valB = b[channelSortConfig.key as keyof ChannelStats];
            }

            if (['subscriberCount', 'viewCount', 'videoCount'].includes(channelSortConfig.key)) {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB as string).toLowerCase();
            }

            if (valA < valB) return channelSortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return channelSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [trackedChannels, channelSearchQuery, selectedGroupFilterIds, selectedMonetizedFilters, selectedEngagementFilters, channelGroups, channelSortConfig]);

    const handleConfirmDelete = () => {
        selectedChannelIds.forEach(id => onRemoveChannel(id));
        setSelectedChannelIds([]);
        setIsDeleteModalOpen(false);
    };

    const commitBulkAction = async () => {
        if (pendingBulkValues.length === 0) return;
        
        if (activeBulkMenu === 'group') {
            pendingBulkValues.forEach(groupId => {
                const targetGroup = channelGroups.find(g => g.id === groupId);
                if (targetGroup) {
                    const combinedChannelIds = Array.from(new Set([...targetGroup.channelIds, ...selectedChannelIds]));
                    onSaveGroup({ ...targetGroup, channelIds: combinedChannelIds });
                }
            });
        } else if (activeBulkMenu === 'monetized') {
            const status = pendingBulkValues[0] as MonetizationStatus;
            await handleBulkUpdateChannels(selectedChannelIds, { monetizationStatus: status });
        } else if (activeBulkMenu === 'engagement') {
            const status = pendingBulkValues[0] as EngagementStatus;
            await handleBulkUpdateChannels(selectedChannelIds, { engagementStatus: status });
        }
        
        setSelectedChannelIds([]);
        setActiveBulkMenu(null);
        setPendingBulkValues([]);
    };

    const togglePendingValue = (val: string) => {
        if (activeBulkMenu === 'group') {
            setPendingBulkValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
        } else {
            setPendingBulkValues([val]);
        }
    };

    return (
        <div className="w-full space-y-6 pb-20 relative">
            <div className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50 space-y-4 shadow-xl animate-fade-in">
                <div className="flex flex-row gap-4 items-center h-11">
                    <div className="relative flex-grow h-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input 
                            type="text" 
                            value={channelSearchQuery} 
                            onChange={(e) => setChannelSearchQuery(e.target.value)} 
                            placeholder="Search channels..." 
                            className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm font-medium outline-none" 
                        />
                    </div>
                    <MultiSelectDropdown 
                        label="Columns" 
                        options={ALL_CHANNEL_COLUMNS} 
                        selectedIds={visibleChannelColumns} 
                        onChange={setVisibleChannelColumns} 
                        className="w-40 h-full"
                    />
                    <button onClick={() => setIsAddModalOpen(true)} className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Add Channel
                    </button>
                </div>
                {/* Updated grid to grid-cols-6 for exactly 6 items per row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MultiSelectDropdown 
                        label="Groups" 
                        options={groupOptions} 
                        selectedIds={selectedGroupFilterIds} 
                        onChange={setSelectedGroupFilterIds} 
                        className="w-full h-11"
                        icon={<span className="text-xs">📂</span>}
                        onCreateClick={() => { setEditingGroup(null); setIsGroupModalOpen(true); }}
                        onManageClick={onOpenGroupsOverview}
                        manageCount={channelGroups.length}
                    />
                    <MultiSelectDropdown 
                        label="Monetized" 
                        options={MONETIZATION_OPTIONS.map(opt => ({ 
                            id: opt.id, label: opt.label, 
                            badge: trackedChannels.filter(c => (c.monetizationStatus || 'not_monetized') === opt.id).length 
                        }))} 
                        selectedIds={selectedMonetizedFilters} 
                        onChange={setSelectedMonetizedFilters} 
                        className="w-full h-11"
                        icon={<span className="text-xs">💸</span>}
                        onManageClick={() => setIsMonetizationOverviewOpen(true)}
                        manageCount={MONETIZATION_OPTIONS.length}
                    />
                    <MultiSelectDropdown 
                        label="Engagement" 
                        options={ENGAGEMENT_OPTIONS.map(opt => ({ 
                            id: opt.id, label: opt.label,
                            badge: trackedChannels.filter(c => (c.engagementStatus || 'good') === opt.id).length 
                        }))} 
                        selectedIds={selectedEngagementFilters} 
                        onChange={setSelectedEngagementFilters} 
                        className="w-full h-11"
                        icon={<span className="text-xs">👍</span>}
                        onManageClick={() => setIsEngagementOverviewOpen(true)}
                        manageCount={ENGAGEMENT_OPTIONS.length}
                    />
                </div>
            </div>
            
            <SummaryCards channels={filteredAndSortedChannels} />

            <ChannelTable 
                channels={filteredAndSortedChannels} 
                sortConfig={channelSortConfig} 
                onSortChange={(k) => setChannelSortConfig(p => ({ key: k, direction: p.key === k && p.direction === 'desc' ? 'asc' : 'desc' }))} 
                onSelect={onSelectChannel} 
                onRemove={onRemoveChannel} 
                onUpdateChannel={onUpdateChannel}
                visibleColumns={visibleChannelColumns} 
                selectedIds={selectedChannelIds} 
                onToggleRow={(id) => setSelectedChannelIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])} 
                onToggleAll={() => setSelectedChannelIds(selectedChannelIds.length === filteredAndSortedChannels.length ? [] : filteredAndSortedChannels.map(c => c.id))} 
                isAllSelected={filteredAndSortedChannels.length > 0 && selectedChannelIds.length === filteredAndSortedChannels.length} 
            />

            {selectedChannelIds.length > 0 && (
                <BulkActionBar count={selectedChannelIds.length} onClear={() => setSelectedChannelIds([])} onDelete={() => setIsDeleteModalOpen(true)}>
                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveBulkMenu(activeBulkMenu === 'group' ? null : 'group'); setPendingBulkValues([]); }} className={`flex items-center gap-2 text-sm font-bold ${activeBulkMenu === 'group' ? 'text-indigo-400' : 'text-gray-300'}`}>
                            <span>📂 Add Group</span>
                        </button>
                        {activeBulkMenu === 'group' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="max-h-48 overflow-y-auto py-1">
                                    {channelGroups.map(g => (
                                        <button key={g.id} onClick={() => togglePendingValue(g.id)} className={`w-full text-left px-4 py-2 text-xs transition-colors flex justify-between items-center ${pendingBulkValues.includes(g.id) ? 'bg-indigo-600/30 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                                            <span className="truncate">{g.name}</span>
                                            {pendingBulkValues.includes(g.id) && <span className="text-indigo-400 font-bold ml-2">✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={commitBulkAction} disabled={pendingBulkValues.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 transition-all">Apply Group</button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveBulkMenu(activeBulkMenu === 'monetized' ? null : 'monetized'); setPendingBulkValues([]); }} className={`flex items-center gap-2 text-sm font-bold ${activeBulkMenu === 'monetized' ? 'text-indigo-400' : 'text-gray-300'}`}>
                            <span>💸 Monetized</span>
                        </button>
                        {activeBulkMenu === 'monetized' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                {MONETIZATION_OPTIONS.map(opt => (
                                    <button key={opt.id} onClick={() => { togglePendingValue(opt.id); }} className={`w-full text-left px-4 py-2 text-xs transition-colors ${pendingBulkValues.includes(opt.id) ? 'bg-indigo-600/30 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                                <button onClick={commitBulkAction} disabled={pendingBulkValues.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2">Apply</button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveBulkMenu(activeBulkMenu === 'engagement' ? null : 'engagement'); setPendingBulkValues([]); }} className={`flex items-center gap-2 text-sm font-bold ${activeBulkMenu === 'engagement' ? 'text-indigo-400' : 'text-gray-300'}`}>
                            <span>👍 Engagement</span>
                        </button>
                        {activeBulkMenu === 'engagement' && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                {ENGAGEMENT_OPTIONS.map(opt => (
                                    <button key={opt.id} onClick={() => { togglePendingValue(opt.id); }} className={`w-full text-left px-4 py-2 text-xs transition-colors ${pendingBulkValues.includes(opt.id) ? 'bg-indigo-600/30 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                                <button onClick={commitBulkAction} disabled={pendingBulkValues.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2">Apply</button>
                            </div>
                        )}
                    </div>
                </BulkActionBar>
            )}

            <AddChannelModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddChannel={onAddChannel} isDisabled={!apiKeySet || isAdding} isAdding={isAdding} />
            <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} count={selectedChannelIds.length} itemName={'channel'} />
            
            <StatusOverviewModal 
                isOpen={isMonetizationOverviewOpen}
                onClose={() => setIsMonetizationOverviewOpen(false)}
                type="monetization"
                channels={trackedChannels}
                options={MONETIZATION_OPTIONS}
                onUpdateChannel={onUpdateChannel}
            />
            <StatusOverviewModal 
                isOpen={isEngagementOverviewOpen}
                onClose={() => setIsEngagementOverviewOpen(false)}
                type="engagement"
                channels={trackedChannels}
                options={ENGAGEMENT_OPTIONS}
                onUpdateChannel={onUpdateChannel}
            />
        </div>
    );
};