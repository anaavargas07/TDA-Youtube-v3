
import React, { useState, useMemo, useEffect } from 'react';
import type { ChannelStats } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { SortableHeader } from './SortableHeader';

interface StatusOverviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'monetization' | 'engagement';
    channels: ChannelStats[];
    options: { id: string; label: string; colorClass: string }[];
    onUpdateChannel: (id: string, updates: any) => void;
}

export const StatusOverviewModal: React.FC<StatusOverviewModalProps> = ({ 
    isOpen, onClose, type, channels, options, onUpdateChannel 
}) => {
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const filteredChannels = useMemo(() => {
        return channels.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
            const currentStatus = type === 'monetization' 
                ? (c.monetizationStatus || 'not_monetized') 
                : (c.engagementStatus || 'good');
            const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(currentStatus);
            return matchesSearch && matchesStatus;
        });
    }, [channels, search, selectedStatus, type]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[120] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0f172a] w-full max-w-4xl h-[85vh] rounded-[2rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gray-900/20">
                    <div>
                        <h2 className="text-2xl font-bold text-white capitalize">Manage {type} Status</h2>
                        <p className="text-xs text-gray-500">Quickly overview and update status for all channels.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 bg-gray-900/30 flex gap-4 items-center">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Search channel..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {options.map(opt => {
                            const count = channels.filter(c => (type === 'monetization' ? c.monetizationStatus || 'not_monetized' : c.engagementStatus || 'good') === opt.id).length;
                            const isActive = selectedStatus.includes(opt.id);
                            return (
                                <button 
                                    key={opt.id}
                                    onClick={() => setSelectedStatus(prev => isActive ? prev.filter(i => i !== opt.id) : [...prev, opt.id])}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2 ${isActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    {opt.label}
                                    <span className={`px-1.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-gray-700'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <table className="w-full border-separate border-spacing-0">
                        <thead className="sticky top-0 z-10 bg-[#0f172a]">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Channel</th>
                                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/5 w-[200px]">Current Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredChannels.map(channel => (
                                <tr key={channel.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={channel.thumbnailUrl} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-200">{channel.title}</p>
                                                <p className="text-[10px] text-gray-500 font-mono">{channel.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-center">
                                            <SearchableSelect 
                                                value={type === 'monetization' ? (channel.monetizationStatus || 'not_monetized') : (channel.engagementStatus || 'good')}
                                                options={options}
                                                onChange={(val) => onUpdateChannel(channel.id, type === 'monetization' ? { monetizationStatus: val } : { engagementStatus: val })}
                                                className="w-full max-w-[180px]"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredChannels.length === 0 && (
                        <div className="py-20 text-center text-gray-500 italic">No channels found matching the filter.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
