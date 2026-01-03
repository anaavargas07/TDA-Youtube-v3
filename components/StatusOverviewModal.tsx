
import React, { useState, useMemo, useEffect } from 'react';
import type { ChannelStats } from '../types';
import { MultiSelectDropdown, Option } from './MultiSelectDropdown';
import { CircularCheckbox } from './CircularCheckbox';
import { SortableHeader } from './SortableHeader';
import { formatNumber } from '../utils/helpers';

interface StatusOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'monetization' | 'engagement';
    channels: ChannelStats[];
    options: { id: string; label: string; colorClass: string }[];
    onUpdateChannel: (id: string, updates: any) => void;
}

type SortKey = 'name' | 'channelCount' | 'type';
type SortDirection = 'asc' | 'desc';

const ALL_STATUS_COLUMNS: Option[] = [
    { id: 'name', label: 'Status Name' },
    { id: 'type', label: 'Category Type' },
    { id: 'channelCount', label: 'Channels' },
];

export const StatusOverviewModal: React.FC<StatusOverviewModalProps> = ({ 
    isOpen, onClose, type, channels, options
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'channelCount', direction: 'desc' });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_STATUS_COLUMNS.map(c => c.id));
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const statusData = useMemo(() => {
        const total = channels.length || 1;
        const data = options.map(opt => {
            const filtered = channels.filter(c => 
                (type === 'monetization' ? c.monetizationStatus || 'not_monetized' : c.engagementStatus || 'good') === opt.id
            );
            return {
                id: opt.id,
                name: opt.label,
                colorClass: opt.colorClass,
                channelCount: filtered.length,
                type: type.toUpperCase(),
                percentage: ((filtered.length / total) * 100).toFixed(1)
            };
        });

        // Search filter
        let result = data.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

        // Sort logic
        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB as string).toLowerCase();
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [channels, options, type, searchQuery, sortConfig]);

    const isVisible = (colId: string) => visibleColumns.includes(colId);

    if (!isOpen) return null;

    const titlePrimary = type === 'monetization' ? 'Monetized' : 'Engagement';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-2 md:p-4 animate-fade-in" onClick={onClose}>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-[120] bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-90 hover:rotate-90"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="bg-[#0f172a] w-full max-w-[98vw] h-[95vh] rounded-[2.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative font-sans" onClick={e => e.stopPropagation()}>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 scroll-smooth bg-gradient-to-br from-transparent to-indigo-950/5">
                    
                    <h1 className="text-3xl font-bold text-white text-center mb-8">
                        {titlePrimary} <span className="text-indigo-400">Overview</span>
                    </h1>

                    {/* Toolbar - 100% Clone of Group Overview */}
                    <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-700/50 space-y-4 shadow-xl">
                        <div className="flex flex-row gap-4 items-center h-11">
                            <div className="relative flex-grow h-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${type} statuses...`} 
                                    className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 text-sm font-medium outline-none" 
                                />
                            </div>
                            <MultiSelectDropdown 
                                label="All Columns" 
                                options={ALL_STATUS_COLUMNS} 
                                selectedIds={visibleColumns} 
                                onChange={setVisibleColumns} 
                                className="w-40 h-full"
                            />
                            <button className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                Quick Assign
                            </button>
                        </div>
                    </div>

                    {/* Stat Cards - 100% Clone Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8">
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <p className="text-[10px] text-gray-500 font-bold truncate">Total Channels</p>
                                <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(channels.length)}</p>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <p className="text-[10px] text-gray-500 font-bold truncate">Average Size</p>
                                <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{(channels.length / options.length).toFixed(1)}</p>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <p className="text-[10px] text-gray-500 font-bold truncate">Status Count</p>
                                <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{options.length}</p>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <p className="text-[10px] text-gray-500 font-bold truncate">Categorized</p>
                                <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">100%</p>
                            </div>
                        </div>
                    </div>

                    {/* Table - 100% Clone Layout */}
                    <div className="overflow-x-auto bg-gray-800/40 rounded-xl shadow-xl border border-gray-700/50">
                        <table className="min-w-full divide-y divide-gray-700/50 table-fixed">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-2.5 w-12 text-center sticky left-0 z-10 bg-inherit border-b border-white/5">
                                        <CircularCheckbox 
                                            checked={selectedIds.length === statusData.length && statusData.length > 0}
                                            onChange={() => setSelectedIds(selectedIds.length === statusData.length ? [] : statusData.map(s => s.id))}
                                        />
                                    </th>
                                    {isVisible('name') && (
                                        <SortableHeader 
                                            label="Status Name" sortKey="name" 
                                            currentSort={sortConfig} 
                                            onSort={(k) => setSortConfig({ key: k as SortKey, direction: sortConfig.key === k && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                            align="left"
                                            className="border-b border-white/5"
                                        />
                                    )}
                                    {isVisible('type') && (
                                        <SortableHeader 
                                            label="Type" sortKey="type" 
                                            currentSort={sortConfig} 
                                            onSort={(k) => setSortConfig({ key: k as SortKey, direction: sortConfig.key === k && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                            className="border-b border-white/5"
                                        />
                                    )}
                                    {isVisible('channelCount') && (
                                        <SortableHeader 
                                            label="Channels" sortKey="channelCount" 
                                            currentSort={sortConfig} 
                                            onSort={(k) => setSortConfig({ key: k as SortKey, direction: sortConfig.key === k && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                            align="center"
                                            className="border-b border-white/5"
                                        />
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {statusData.map((stat) => {
                                    const isSelected = selectedIds.includes(stat.id);
                                    const colorHex = stat.colorClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-gray-400';
                                    
                                    return (
                                        <tr 
                                            key={stat.id} 
                                            className={`hover:bg-white/[0.03] transition-all duration-200 group ${isSelected ? 'bg-indigo-900/20' : ''}`}
                                            onClick={() => setSelectedIds(prev => prev.includes(stat.id) ? prev.filter(i => i !== stat.id) : [...prev, stat.id])}
                                        >
                                            <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 z-10 bg-inherit">
                                                <CircularCheckbox checked={isSelected} onChange={() => {}} />
                                            </td>
                                            {isVisible('name') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm ${colorHex.replace('bg-', 'bg-')}`}></div>
                                                            <span className="text-[13px] font-bold text-gray-200 group-hover:text-indigo-400 transition-colors leading-snug truncate">
                                                                {stat.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 opacity-80 pl-6 uppercase">ID: {stat.id.toUpperCase()}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {isVisible('type') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                    <span className="text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">{stat.type}</span>
                                                </td>
                                            )}
                                            {isVisible('channelCount') && (
                                                <td className="px-4 py-2.5 whitespace-nowrap text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                                                        {stat.channelCount}
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
