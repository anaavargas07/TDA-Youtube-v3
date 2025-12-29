
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { GroupSummaryCards } from './GroupSummaryCards';
import { MultiSelectDropdown, Option } from './MultiSelectDropdown';
import { BulkActionBar } from './BulkActionBar';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CircularCheckbox } from './CircularCheckbox';
import { SortableHeader } from './SortableHeader';
import type { ChannelGroup, ChannelStats, AppSettings } from '../types';

interface GroupsOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    groups: ChannelGroup[];
    channels: ChannelStats[];
    onEditGroup: (group: ChannelGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    onCreateGroup: () => void;
    settings: AppSettings;
}

export type SortKey = 'name' | 'channelCount' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

const ALL_GROUP_COLUMNS: Option[] = [
    { id: 'name', label: 'Group Name' },
    { id: 'createdAt', label: 'Created At' },
    { id: 'channelCount', label: 'Channels' },
];

const timeOptions: Option[] = [
    { id: 'today', label: 'Created Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
];

export const GroupsOverviewModal: React.FC<GroupsOverviewModalProps> = ({ 
    isOpen, onClose, 
    groups, channels, onEditGroup, onDeleteGroup, onCreateGroup 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_GROUP_COLUMNS.map(c => c.id));
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setSelectedGroupIds([]);
        }
    }, [isOpen, groups]);

    const filteredAndSortedGroups = useMemo(() => {
        let result = groups.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesTime = true;
            if (timeFilter.length > 0) {
                const createdAt = new Date(g.createdAt);
                const now = new Date();
                if (timeFilter.includes('today')) {
                    matchesTime = createdAt.toDateString() === now.toDateString();
                } else if (timeFilter.includes('7d')) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    matchesTime = createdAt >= sevenDaysAgo;
                } else if (timeFilter.includes('30d')) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    matchesTime = createdAt >= thirtyDaysAgo;
                }
            }

            return matchesSearch && matchesTime;
        });

        result.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            if (sortConfig.key === 'createdAt') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (sortConfig.key === 'channelCount') {
                valA = a.channelIds.length;
                valB = b.channelIds.length;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [groups, searchQuery, timeFilter, sortConfig]);

    const isVisible = (colId: string) => visibleColumns.includes(colId);

    const handleSortChange = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleToggleAll = () => {
        if (selectedGroupIds.length === filteredAndSortedGroups.length) {
            setSelectedGroupIds([]);
        } else {
            setSelectedGroupIds(filteredAndSortedGroups.map(g => g.id));
        }
    };

    const handleToggleRow = (id: string) => {
        setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const confirmDelete = useCallback(() => {
        selectedGroupIds.forEach(id => onDeleteGroup(id));
        setSelectedGroupIds([]);
        setIsDeleteModalOpen(false);
    }, [selectedGroupIds, onDeleteGroup]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-2 md:p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-[120] bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-90 hover:rotate-90 group"
                title="Close Groups Overview"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div 
                className="bg-[#0f172a] w-full max-w-[98vw] h-[95vh] rounded-[2.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 scroll-smooth bg-gradient-to-br from-transparent to-indigo-950/5">
                    <h1 className="text-3xl font-bold text-white text-center mb-8">
                        Groups <span className="text-indigo-400">Overview</span>
                    </h1>

                    <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-700/50 space-y-4 shadow-xl">
                        <div className="flex flex-row gap-4 items-center h-11">
                            <div className="relative flex-grow h-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search groups..."
                                    className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                                />
                            </div>

                            <MultiSelectDropdown 
                                label="Columns"
                                options={ALL_GROUP_COLUMNS}
                                selectedIds={visibleColumns}
                                onChange={setVisibleColumns}
                                className="w-40 h-full"
                            />

                            <button
                                onClick={() => onCreateGroup()} 
                                className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Add Group
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <GroupSummaryCards groups={groups} channels={channels} />
                    </div>

                    <div className="overflow-x-auto bg-gray-800/40 rounded-xl shadow-xl border border-gray-700/50">
                        <table className="min-w-full divide-y divide-gray-700/50 table-fixed">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-2.5 w-12 text-center sticky left-0 z-10 bg-inherit">
                                        <CircularCheckbox 
                                            checked={filteredAndSortedGroups.length > 0 && selectedGroupIds.length === filteredAndSortedGroups.length}
                                            onChange={handleToggleAll}
                                        />
                                    </th>
                                    {isVisible('name') && (
                                        <SortableHeader 
                                            label="Group Name" 
                                            sortKey="name" 
                                            currentSort={sortConfig} 
                                            onSort={handleSortChange}
                                            align="left"
                                        />
                                    )}
                                    {isVisible('createdAt') && (
                                        <SortableHeader 
                                            label="Created At" 
                                            sortKey="createdAt" 
                                            currentSort={sortConfig} 
                                            onSort={handleSortChange}
                                        />
                                    )}
                                    {isVisible('channelCount') && (
                                        <SortableHeader 
                                            label="Channels" 
                                            sortKey="channelCount" 
                                            currentSort={sortConfig} 
                                            onSort={handleSortChange} 
                                            align="center"
                                        />
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {filteredAndSortedGroups.length > 0 ? filteredAndSortedGroups.map((group) => {
                                    const isSelected = selectedGroupIds.includes(group.id);
                                    return (
                                        <tr 
                                            key={group.id} 
                                            className={`hover:bg-white/[0.03] transition-all duration-200 group ${isSelected ? 'bg-indigo-900/20' : ''}`}
                                            onClick={() => handleToggleRow(group.id)}
                                        >
                                            <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                                                <CircularCheckbox 
                                                    checked={isSelected}
                                                    onChange={() => handleToggleRow(group.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            {isVisible('name') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: group.color || '#4f46e5' }}></div>
                                                            <span 
                                                                className="text-[13px] font-bold text-gray-200 group-hover:text-indigo-400 transition-colors cursor-pointer leading-snug truncate"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onEditGroup(group);
                                                                }}
                                                            >
                                                                {group.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 opacity-80 pl-6">ID: {group.id.slice(0,8)}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {isVisible('createdAt') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="flex flex-col text-center">
                                                        <span className="text-[10px] font-medium text-gray-300">{new Date(group.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-[8px] font-normal text-gray-500 opacity-80">{new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {isVisible('channelCount') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                                                        {group.channelIds.length}
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                            No groups found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {selectedGroupIds.length > 0 && (
                    <BulkActionBar 
                        count={selectedGroupIds.length} 
                        onClear={() => setSelectedGroupIds([])} 
                        onDelete={() => setIsDeleteModalOpen(true)} 
                    />
                )}

                <DeleteConfirmModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    count={selectedGroupIds.length}
                    itemName="group"
                />
            </div>
        </div>
    );
};
