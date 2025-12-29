
import React, { useState, useRef, useEffect } from 'react';

export interface VideoFilters {
    keyword: string;
    startDate: string;
    endDate: string;
    minViews: string;
    minLikes: string;
    datePreset: string;
}

interface VideoFilterControlsProps {
    filters: VideoFilters;
    onFilterChange: (filters: VideoFilters) => void;
}

const PRESETS = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'custom', label: 'Date Range' },
];

export const VideoFilterControls: React.FC<VideoFilterControlsProps> = ({ filters, onFilterChange }) => {
    const [isDateOpen, setIsDateOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, [e.target.name]: e.target.value });
    };

    const applyPreset = (presetId: string) => {
        const now = new Date();
        let start = '';
        let end = '';

        switch (presetId) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                start = today.toISOString().split('T')[0];
                break;
            case 'this_week':
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
                const startOfWeek = new Date(now.setDate(diff));
                start = startOfWeek.toISOString().split('T')[0];
                break;
            case 'last_30_days':
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                start = thirtyDaysAgo.toISOString().split('T')[0];
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                break;
            default:
                break;
        }

        onFilterChange({ 
            ...filters, 
            datePreset: presetId, 
            startDate: start, 
            endDate: end 
        });
        if (presetId !== 'custom') setIsDateOpen(false);
    };

    const handleClearFilters = () => {
        onFilterChange({
            keyword: '',
            startDate: '',
            endDate: '',
            minViews: '',
            minLikes: '',
            datePreset: 'all'
        });
    };
    
    const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== 'all');

    return (
        <div className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Keyword */}
                <div className="flex-1 relative h-11">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleInputChange}
                        placeholder="Search video titles..."
                        className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                    />
                </div>

                {/* Date Dropdown */}
                <div className="relative w-full lg:w-56 h-11" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className="flex items-center justify-between w-full h-full px-4 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    >
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>{PRESETS.find(p => p.id === filters.datePreset)?.label || 'Filter Date'}</span>
                        </div>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isDateOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isDateOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                            <div className="py-1">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset.id)}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${filters.datePreset === preset.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        {preset.label}
                                        {filters.datePreset === preset.id && <span className="font-bold">✓</span>}
                                    </button>
                                ))}
                            </div>
                            
                            {filters.datePreset === 'custom' && (
                                <div className="p-3 border-t border-gray-700 bg-black/20 space-y-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start Date</p>
                                        <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-xs text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">End Date</p>
                                        <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-xs text-white" />
                                    </div>
                                    <button onClick={() => setIsDateOpen(false)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 rounded-lg mt-1">Apply Range</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Min Metrics */}
                <div className="flex gap-2 w-full lg:w-auto h-11">
                    <div className="relative flex-1 lg:w-32">
                        <input
                            type="number"
                            name="minViews"
                            value={filters.minViews}
                            onChange={handleInputChange}
                            placeholder="Min Views"
                            className="w-full h-full px-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm font-medium"
                        />
                    </div>
                    <div className="relative flex-1 lg:w-32">
                        <input
                            type="number"
                            name="minLikes"
                            value={filters.minLikes}
                            onChange={handleInputChange}
                            placeholder="Min Likes"
                            className="w-full h-full px-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Clear Actions */}
                {hasActiveFilters && (
                    <button
                        onClick={handleClearFilters}
                        className="h-11 px-4 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
};
