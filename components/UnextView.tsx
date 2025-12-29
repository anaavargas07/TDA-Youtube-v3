
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { MultiSelectDropdown, Option as MultiOption } from './MultiSelectDropdown';
import { AddMovieModal } from './AddMovieModal';
import { MovieSummaryCards } from './MovieSummaryCards';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Movie, MovieStatus, ChannelStats, AppSettings } from '../types';

interface UnextViewProps {
    movies: Movie[];
    channels: ChannelStats[];
    onAddMovies: (names: string) => void;
    onUpdateMovie: (id: string, updates: Partial<Movie>) => void;
    onBulkUpdateMovieStatus: (ids: string[], status: MovieStatus) => void;
    onDeleteMovie: (id: string) => void;
    settings: AppSettings;
}

type SortKey = 'name' | 'addedAt' | 'status' | 'note';
type SortDirection = 'asc' | 'desc';

export const STATUS_OPTIONS: { id: MovieStatus; label: MovieStatus; colorClass: string; hex: string }[] = [
    { id: 'Playlist', label: 'Playlist', colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20', hex: '#60a5fa' },
    { id: 'Download', label: 'Download', colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20', hex: '#c084fc' },
    { id: 'Copyright Check', label: 'Copyright Check', colorClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', hex: '#facc15' },
    { id: 'Visual Copyright', label: 'Visual Copyright', colorClass: 'text-orange-400 bg-orange-400/10 border-orange-400/20', hex: '#fb923c' },
    { id: 'Audio Copyright', label: 'Audio Copyright', colorClass: 'text-pink-400 bg-pink-400/10 border-pink-400/20', hex: '#f472b6' },
    { id: 'Strike Check', label: 'Strike Check', colorClass: 'text-red-400 bg-red-400/10 border-red-400/20', hex: '#f87171' },
    { id: 'Done', label: 'Done', colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', hex: '#34d399' },
];

const NoteInput: React.FC<{ initialValue: string, onSave: (val: string) => void }> = ({ initialValue, onSave }) => {
    const [value, setValue] = useState(initialValue);
    
    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
        if (value !== initialValue) {
            onSave(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // FIX: Cast currentTarget to HTMLElement to access the 'blur' method.
            (e.currentTarget as HTMLElement).blur();
        }
    };

    return (
        <div className="relative group/note w-full">
            <input 
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Add a note..."
                className="w-full bg-transparent border border-transparent hover:border-gray-700 focus:border-indigo-500 rounded px-2 py-1 text-xs text-gray-300 focus:text-white placeholder-gray-600 focus:outline-none transition-all"
            />
            {!value && (
                <svg className="w-3 h-3 text-gray-600 absolute right-2 top-1.5 pointer-events-none group-hover/note:opacity-100 opacity-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            )}
        </div>
    );
};

const getChannelColorClass = (id: string) => {
    const colors = [
        'text-red-400 bg-red-400/10 border-red-400/20',
        'text-orange-400 bg-orange-400/10 border-orange-400/20',
        'text-amber-400 bg-amber-400/10 border-amber-400/20',
        'text-green-400 bg-green-400/10 border-green-400/20',
        'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        'text-teal-400 bg-teal-400/10 border-teal-400/20',
        'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
        'text-sky-400 bg-sky-400/10 border-sky-400/20',
        'text-blue-400 bg-blue-400/10 border-blue-400/20',
        'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
        'text-violet-400 bg-violet-400/10 border-violet-400/20',
        'text-purple-400 bg-purple-400/10 border-purple-400/20',
        'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
        'text-pink-400 bg-pink-400/10 border-pink-400/20',
        'text-rose-400 bg-rose-400/10 border-rose-400/20',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const CircularCheckbox: React.FC<{ checked: boolean, onChange: () => void, onClick?: (e: React.MouseEvent) => void }> = ({ checked, onChange, onClick }) => (
    <div className="relative flex items-center justify-center" onClick={onClick}>
        <input 
            type="checkbox" 
            checked={checked}
            onChange={onChange}
            className="peer appearance-none h-5 w-5 border-2 border-gray-600 rounded-full bg-gray-800/50 checked:bg-indigo-500 checked:border-indigo-500 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 transition-all duration-200 cursor-pointer"
        />
        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </div>
);

const SortableHeader: React.FC<{
    label: string;
    sortKey: SortKey;
    currentSort: { key: SortKey; direction: SortDirection };
    onSort: (key: SortKey) => void;
    className?: string;
    align?: 'left' | 'right' | 'center';
    icon?: React.ReactNode;
}> = ({ label, sortKey, currentSort, onSort, className = "", align = 'left', icon }) => {
    const isSorted = currentSort.key === sortKey;
    
    return (
        <th 
            className={`px-2 py-2 text-sm font-medium text-gray-300 cursor-pointer hover:text-white hover:bg-gray-700/50 transition-colors ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                <div className="flex items-center gap-2">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className={`text-indigo-400 transition-opacity ${isSorted ? 'opacity-100' : 'opacity-0'}`}>
                    {currentSort.direction === 'asc' ? '▲' : '▼'}
                </span>
            </div>
        </th>
    );
};

interface BulkDropdownProps {
    label: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const BulkDropdown: React.FC<BulkDropdownProps> = ({ 
    label, 
    icon, 
    isOpen, 
    onToggle, 
    children 
}) => {
    return (
        <div className="relative">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`text-gray-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${isOpen ? 'bg-gray-700 text-white' : ''}`}
            >
                {icon}
                {label}
            </button>
            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-slide-up z-50">
                    {children}
                </div>
            )}
        </div>
    )
}

const ALL_MOVIE_COLUMNS = [
    { id: 'name', label: 'Movie' },
    { id: 'status', label: 'Status' },
    { id: 'addedAt', label: 'Added' },
    { id: '3d', label: '3D Channel' },
    { id: '2d', label: '2D Channel' },
    { id: 'note', label: 'Note' },
];

export const UnextView: React.FC<UnextViewProps> = ({ movies, channels, onAddMovies, onUpdateMovie, onBulkUpdateMovieStatus, onDeleteMovie, settings }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'addedAt', direction: 'desc' });
    const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_MOVIE_COLUMNS.map(c => c.id));
    
    const [activeBulkMenu, setActiveBulkMenu] = useState<'status' | '3d' | '2d' | null>(null);
    const [bulkSearchTerm, setBulkSearchTerm] = useState('');
    const [pendingBulkValue, setPendingBulkValue] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selected3DIds, setSelected3DIds] = useState<string[]>([]);
    const [selected2DIds, setSelected2DIds] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [timeFilter, setTimeFilter] = useState<string[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = settings.rowsPerPage || 100;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selected3DIds, selected2DIds, selectedStatuses, timeFilter]);

    const channelOptions = useMemo(() => channels.map(c => ({
        id: c.id, label: c.title
    })), [channels]);

    const singleSelectChannelOptions = useMemo(() => channels.map(c => ({
        id: c.id, 
        label: c.title,
        colorClass: getChannelColorClass(c.id)
    })), [channels]);

    const statusDropdownOptions: MultiOption[] = useMemo(() => STATUS_OPTIONS.map(s => ({
        id: s.id, label: s.label, color: s.hex
    })), []);

    const timeOptions: MultiOption[] = [
        { id: 'today', label: 'Added Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

    useEffect(() => {
        const handleClickOutside = () => {
            setActiveBulkMenu(null);
            setPendingBulkValue(null);
        };
        if(activeBulkMenu) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeBulkMenu]);


    const filteredAndSortedMovies = useMemo(() => {
        let result = movies.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const movie3DIds = m.channel3DIds || (m.channel3DId ? [m.channel3DId] : []);
            const movie2DIds = m.channel2DIds || (m.channel2DId ? [m.channel2DId] : []);
            
            const matches3D = selected3DIds.length === 0 || movie3DIds.some(id => selected3DIds.includes(id));
            const matches2D = selected2DIds.length === 0 || movie2DIds.some(id => selected2DIds.includes(id));
            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(m.status);

            let matchesTime = true;
            if (timeFilter.length > 0) {
                const addedDate = new Date(m.addedAt);
                const now = new Date();
                if (timeFilter.includes('today')) {
                    matchesTime = addedDate.toDateString() === now.toDateString();
                } else if (timeFilter.includes('7d')) {
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    matchesTime = addedDate >= sevenDaysAgo;
                } else if (timeFilter.includes('30d')) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    matchesTime = addedDate >= thirtyDaysAgo;
                }
            }

            return matchesSearch && matches3D && matches2D && matchesStatus && matchesTime;
        });

        result.sort((a, b) => {
            if (sortConfig.key === 'status') {
                const rankA = STATUS_OPTIONS.findIndex(opt => opt.id === a.status);
                const rankB = STATUS_OPTIONS.findIndex(opt => opt.id === b.status);
                
                const valA = rankA === -1 ? 999 : rankA;
                const valB = rankB === -1 ? 999 : rankB;

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            let valA: any = a[sortConfig.key as keyof Movie];
            let valB: any = b[sortConfig.key as keyof Movie];

            if (sortConfig.key === 'addedAt') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = (valB || '').toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [movies, searchQuery, selected3DIds, selected2DIds, selectedStatuses, timeFilter, sortConfig]);

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleToggleAll = () => {
        if (selectedIds.length === filteredAndSortedMovies.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAndSortedMovies.map(m => m.id));
        }
    };

    const handleToggleRow = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const commitBulkStatusChange = () => {
        if (pendingBulkValue) {
            onBulkUpdateMovieStatus(selectedIds, pendingBulkValue as MovieStatus);
            setActiveBulkMenu(null);
            setPendingBulkValue(null);
        }
    };

    const commitBulkChannelAdd = (type: '3D' | '2D') => {
        if (pendingBulkValue) {
            const channelId = pendingBulkValue;
            const selectedMovies = movies.filter(m => selectedIds.includes(m.id));
            
            selectedMovies.forEach(movie => {
                if (type === '3D') {
                    onUpdateMovie(movie.id, { channel3DIds: [channelId] });
                } else {
                    onUpdateMovie(movie.id, { channel2DIds: [channelId] });
                }
            });
            
            setActiveBulkMenu(null);
            setBulkSearchTerm('');
            setPendingBulkValue(null);
        }
    };

    const filteredBulkChannels = channelOptions.filter(c => c.label.toLowerCase().includes(bulkSearchTerm.toLowerCase()));

    const isVisible = (colId: string) => visibleColumns.includes(colId);

    const totalItems = filteredAndSortedMovies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedMovies = filteredAndSortedMovies.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const confirmDelete = () => {
        selectedIds.forEach(id => onDeleteMovie(id));
        setSelectedIds([]);
    };

    return (
        <div className="space-y-6 animate-fade-in w-full pb-20">
            {/* Header & Controls */}
            <div className="bg-gray-800/20 p-4 rounded-xl border border-gray-700/50 space-y-4 shadow-xl">
                <div className="flex flex-row gap-4 items-center h-12">
                    <div className="relative flex-grow h-full">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by movie name..."
                            className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>

                    <MultiSelectDropdown 
                        label="Columns"
                        options={ALL_MOVIE_COLUMNS}
                        selectedIds={visibleColumns}
                        onChange={setVisibleColumns}
                        className="w-40 h-full"
                        icon={<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2 2" /></svg>}
                    />

                    <div className="flex items-center gap-2 h-full">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-500 shadow-lg shadow-indigo-500/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            Add Movie
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <MultiSelectDropdown 
                        label="Time"
                        options={timeOptions}
                        selectedIds={timeFilter}
                        onChange={setTimeFilter}
                        className="w-full"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                    <MultiSelectDropdown 
                        label="Status"
                        options={statusDropdownOptions}
                        selectedIds={selectedStatuses}
                        onChange={setSelectedStatuses}
                        className="w-full"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round"/></svg>}
                    />
                </div>
            </div>

            <MovieSummaryCards movies={movies} />

            {/* Pagination Top Bar */}
            {totalItems > itemsPerPage && (
                <div className="flex justify-between items-center bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-white">{totalItems}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 bg-gray-900 rounded text-sm text-gray-300 border border-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="overflow-x-auto bg-gray-800/40 rounded-lg shadow-xl border border-gray-700/50">
                <table className="min-w-full divide-y divide-gray-700/50 table-fixed">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-2 py-2 w-12 text-center sticky left-0 z-10 bg-gray-900/50">
                                <div className="flex items-center justify-center">
                                    <CircularCheckbox 
                                        checked={filteredAndSortedMovies.length > 0 && selectedIds.length === filteredAndSortedMovies.length}
                                        onChange={handleToggleAll}
                                    />
                                </div>
                            </th>
                            {isVisible('name') && (
                                <SortableHeader 
                                    label="Movie" 
                                    sortKey="name" 
                                    currentSort={sortConfig} 
                                    onSort={handleSort} 
                                    className="w-[250px] min-w-[200px]"
                                    icon={<svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>}
                                />
                            )}
                            {isVisible('status') && (
                                <SortableHeader 
                                    label="Status" 
                                    sortKey="status" 
                                    currentSort={sortConfig} 
                                    onSort={handleSort} 
                                    align="center" 
                                    className="w-[160px] min-w-[160px]"
                                    icon={<svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                                />
                            )}
                            {isVisible('addedAt') && (
                                <SortableHeader 
                                    label="Added" 
                                    sortKey="addedAt" 
                                    currentSort={sortConfig} 
                                    onSort={handleSort} 
                                    className="w-[120px] min-w-[120px]"
                                    icon={<svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                />
                            )}
                            {isVisible('3d') && (
                                <th className="px-2 py-2 text-center text-sm font-medium text-gray-300 w-[180px] min-w-[180px]">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        3D Channel
                                    </div>
                                </th>
                            )}
                            {isVisible('2d') && (
                                <th className="px-2 py-2 text-center text-sm font-medium text-gray-300 w-[180px] min-w-[180px]">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                        2D Channel
                                    </div>
                                </th>
                            )}
                            {isVisible('note') && (
                                <th className="px-2 py-2 text-left text-sm font-medium text-gray-300 w-auto min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Note
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                        {paginatedMovies.length > 0 ? paginatedMovies.map((movie) => {
                             const isSelected = selectedIds.includes(movie.id);
                             const channel3DId = movie.channel3DIds?.[0] || movie.channel3DId || '';
                             const channel2DId = movie.channel2DIds?.[0] || movie.channel2DId || '';

                             return (
                                <tr 
                                    key={movie.id} 
                                    className={`hover:bg-gray-700/30 transition-colors group ${isSelected ? 'bg-indigo-900/20 hover:bg-indigo-900/30' : ''}`}
                                    onClick={(e) => {
                                        if (!(e.target as HTMLElement).closest('button, input, .no-row-click')) {
                                            handleToggleRow(movie.id);
                                        }
                                    }}
                                >
                                    <td className="px-2 py-1.5 align-middle sticky left-0 z-10 bg-inherit">
                                        <div className="absolute inset-0 bg-gray-900/50 -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center justify-center">
                                            <CircularCheckbox 
                                                checked={isSelected}
                                                onChange={() => handleToggleRow(movie.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </td>
                                    {isVisible('name') && (
                                        <td className="px-2 py-1.5 align-middle">
                                            <div className="font-bold text-gray-200 group-hover:text-indigo-400 transition-colors truncate text-sm" title={movie.name}>
                                                {movie.name}
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('status') && (
                                        <td className="px-2 py-1.5 align-middle text-center no-row-click">
                                            <div className="flex justify-center w-full">
                                                <SearchableSelect 
                                                    value={movie.status}
                                                    options={STATUS_OPTIONS}
                                                    onChange={(val) => onUpdateMovie(movie.id, { status: val as MovieStatus })}
                                                    className="w-[140px]"
                                                    variant="default" 
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('addedAt') && (
                                        <td className="px-2 py-1.5 align-middle">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-300">{new Date(movie.addedAt).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">{new Date(movie.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('3d') && (
                                        <td className="px-2 py-1.5 align-middle text-center no-row-click">
                                            <div className="flex justify-center w-full">
                                                <SearchableSelect 
                                                    value={channel3DId}
                                                    options={singleSelectChannelOptions}
                                                    onChange={(id) => onUpdateMovie(movie.id, { channel3DIds: [id] })}
                                                    placeholder="Select 3D..."
                                                    className="w-[160px]"
                                                    variant="minimal" 
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('2d') && (
                                        <td className="px-2 py-1.5 align-middle text-center no-row-click">
                                            <div className="flex justify-center w-full">
                                                <SearchableSelect 
                                                    value={channel2DId}
                                                    options={singleSelectChannelOptions}
                                                    onChange={(id) => onUpdateMovie(movie.id, { channel2DIds: [id] })}
                                                    placeholder="Select 2D..."
                                                    className="w-[160px]"
                                                    variant="minimal" 
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('note') && (
                                        <td className="px-2 py-1.5 align-middle no-row-click">
                                            <NoteInput 
                                                initialValue={movie.note || ''}
                                                onSave={(val) => onUpdateMovie(movie.id, { note: val })}
                                            />
                                        </td>
                                    )}
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={visibleColumns.length + 1} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" />
                                        </svg>
                                        <p className="text-lg font-medium">No movies found</p>
                                        <p className="text-sm opacity-60">Try adjusting filters or add a new movie.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Bottom Bar */}
            {totalItems > itemsPerPage && (
                <div className="flex justify-between items-center bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
                    <div className="text-sm text-gray-400">
                        Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-white">{totalItems}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 bg-gray-900 rounded text-sm text-gray-300 border border-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
                    <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6">
                        <div className="flex items-center gap-2 border-r border-gray-600 pr-6">
                            <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                            <span className="text-sm font-medium text-white">selected</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <BulkDropdown 
                                label="Status"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                isOpen={activeBulkMenu === 'status'}
                                onToggle={() => { setActiveBulkMenu(activeBulkMenu === 'status' ? null : 'status'); setPendingBulkValue(null); }}
                            >
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {STATUS_OPTIONS.map(status => (
                                        <button
                                            key={status.id}
                                            onClick={(e) => { e.stopPropagation(); setPendingBulkValue(status.id); }}
                                            className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 justify-between ${pendingBulkValue === status.id ? 'bg-indigo-900/50 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.hex }}></span>
                                                {status.label}
                                            </div>
                                            {pendingBulkValue === status.id && <span className="text-indigo-400 font-bold">✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-gray-700 bg-gray-900/50">
                                    <button onClick={(e) => { e.stopPropagation(); commitBulkStatusChange(); }} disabled={!pendingBulkValue} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded transition-all">Save</button>
                                </div>
                            </BulkDropdown>

                             <BulkDropdown 
                                label="3D"
                                icon={<span className="text-[10px] font-bold border border-current px-0.5 rounded">3D</span>}
                                isOpen={activeBulkMenu === '3d'}
                                onToggle={() => { setActiveBulkMenu(activeBulkMenu === '3d' ? null : '3d'); setBulkSearchTerm(''); setPendingBulkValue(null); }}
                            >
                                <div className="p-2 border-b border-gray-700" onClick={e => e.stopPropagation()}>
                                    <input type="text" autoFocus placeholder="Find channel..." value={bulkSearchTerm} onChange={e => setBulkSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                                </div>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                    {filteredBulkChannels.length > 0 ? filteredBulkChannels.map(c => (
                                        <button key={c.id} onClick={(e) => { e.stopPropagation(); setPendingBulkValue(c.id); }} className={`w-full text-left px-4 py-2 text-xs transition-colors flex justify-between items-center ${pendingBulkValue === c.id ? 'bg-indigo-900/50 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                                            <span className="truncate pr-2">{c.label}</span>
                                            {pendingBulkValue === c.id && <span className="text-indigo-400 font-bold flex-shrink-0">✓</span>}
                                        </button>
                                    )) : <div className="p-2 text-xs text-gray-500 text-center">No channel found</div>}
                                </div>
                                <div className="p-2 border-t border-gray-700 bg-gray-900/50">
                                    <button onClick={(e) => { e.stopPropagation(); commitBulkChannelAdd('3D'); }} disabled={!pendingBulkValue} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded transition-all">Save</button>
                                </div>
                            </BulkDropdown>

                            <BulkDropdown 
                                label="2D"
                                icon={<span className="text-[10px] font-bold border border-current px-0.5 rounded">2D</span>}
                                isOpen={activeBulkMenu === '2d'}
                                onToggle={() => { setActiveBulkMenu(activeBulkMenu === '2d' ? null : '2d'); setBulkSearchTerm(''); setPendingBulkValue(null); }}
                            >
                                <div className="p-2 border-b border-gray-700" onClick={e => e.stopPropagation()}>
                                    <input type="text" autoFocus placeholder="Find channel..." value={bulkSearchTerm} onChange={e => setBulkSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                                </div>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                    {filteredBulkChannels.length > 0 ? filteredBulkChannels.map(c => (
                                        <button key={c.id} onClick={(e) => { e.stopPropagation(); setPendingBulkValue(c.id); }} className={`w-full text-left px-4 py-2 text-xs transition-colors flex justify-between items-center ${pendingBulkValue === c.id ? 'bg-indigo-900/50 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                                            <span className="truncate pr-2">{c.label}</span>
                                            {pendingBulkValue === c.id && <span className="text-indigo-400 font-bold flex-shrink-0">✓</span>}
                                        </button>
                                    )) : <div className="p-2 text-xs text-gray-500 text-center">No channel found</div>}
                                </div>
                                <div className="p-2 border-t border-gray-700 bg-gray-900/50">
                                    <button onClick={(e) => { e.stopPropagation(); commitBulkChannelAdd('2D'); }} disabled={!pendingBulkValue} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-1.5 rounded transition-all">Save</button>
                                </div>
                            </BulkDropdown>

                            <button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-medium transition-colors pl-4 border-l border-gray-600 ml-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>

                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-gray-400 hover:text-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
                                title="Cancel Selection"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AddMovieModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddMovies={onAddMovies}
            />

            <DeleteConfirmModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                count={selectedIds.length}
                itemName="movie"
            />
        </div>
    );
};