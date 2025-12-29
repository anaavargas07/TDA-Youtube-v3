import React, { useState, useMemo, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { MultiSelectDropdown, Option as MultiOption } from './MultiSelectDropdown';
import { AddMovieModal } from './AddMovieModal';
import { MovieSummaryCards } from './MovieSummaryCards';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { BulkActionBar } from './BulkActionBar'; // Import BulkActionBar
import { CircularCheckbox } from './CircularCheckbox'; // Import from new file
import { SortableHeader } from './SortableHeader'; // Import from new file
import type { Movie, MovieStatus, ChannelStats, AppSettings } from '../types';

type SortKey = 'name' | 'addedAt' | 'status' | 'note';
type SortDirection = 'asc' | 'desc';

interface MoviesViewProps {
    movies: Movie[];
    channels: ChannelStats[];
    onAddMovies: (names: string) => void;
    onUpdateMovie: (id: string, updates: Partial<Movie>) => void;
    onBulkUpdateMovieStatus: (ids: string[], status: MovieStatus) => void; // Kept for appData interaction
    onDeleteMovie: (id: string) => void; // Kept for appData interaction
    settings: AppSettings;
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>; // Added setter to enable internal movie state manipulation
}

export const STATUS_OPTIONS: { id: MovieStatus; label: string; colorClass: string; hex: string }[] = [
    { id: 'Playlist', label: 'Playlist', colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20', hex: '#60a5fa' },
    { id: 'Download', label: 'Download', colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20', hex: '#c084fc' },
    { id: 'Copyright Check', label: 'Copyright Check', colorClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', hex: '#facc15' },
    { id: 'Visual Copyright', label: 'Visual Copyright', colorClass: 'text-orange-400 bg-orange-400/10 border-orange-400/20', hex: '#fb923c' },
    { id: 'Audio Copyright', label: 'Audio Copyright', colorClass: 'text-pink-400 bg-pink-400/10 border-pink-400/20', hex: '#f472b6' },
    { id: 'Strike Check', label: 'Strike Check', colorClass: 'text-red-400 bg-red-400/10 border-red-400/20', hex: '#f87171' },
    { id: 'Done', label: 'Done', colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', hex: '#34d399' },
];

const ALL_MOVIE_COLUMNS = [
    { id: 'name', label: 'Movie Title' },
    { id: 'status', label: 'Status' },
    { id: 'addedAt', label: 'Added At' },
    { id: '3d', label: '3D Chan.' },
    { id: '2d', label: '2D Chan.' },
    { id: 'note', label: 'Note' },
];

const NoteInput: React.FC<{ initialValue: string, onSave: (val: string) => void }> = ({ initialValue, onSave }) => {
    const [value, setValue] = useState(initialValue);
    useEffect(() => { setValue(initialValue); }, [initialValue]);
    const handleBlur = () => { if (value !== initialValue) onSave(value); };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') (e.currentTarget as HTMLElement).blur(); };

    return (
        <input 
            type="text" 
            value={value} 
            onChange={(e) => setValue(e.target.value)} 
            onBlur={handleBlur} 
            onKeyDown={handleKeyDown} 
            onClick={(e) => e.stopPropagation()} 
            placeholder="Add a note..."
            className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-indigo-500 rounded px-2 py-1 text-xs text-gray-300 focus:text-white placeholder-gray-600 focus:outline-none transition-all"
        />
    );
};

const getChannelColorClass = (id: string) => {
    const colors = ['text-red-400 bg-red-400/10', 'text-orange-400 bg-orange-400/10', 'text-emerald-400 bg-emerald-400/10', 'text-blue-400 bg-blue-400/10', 'text-indigo-400 bg-indigo-400/10', 'text-purple-400 bg-purple-400/10'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length] + ' border border-white/5';
};

const BulkDropdown: React.FC<{
    label: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ label, icon, isOpen, onToggle, children }) => {
    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`text-gray-300 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors px-3 py-1.5 rounded-lg ${isOpen ? 'bg-gray-700 text-white' : ''}`}
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

export const MoviesView: React.FC<MoviesViewProps> = ({ movies, channels, onAddMovies, onUpdateMovie, onBulkUpdateMovieStatus, onDeleteMovie, settings, setMovies }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]); // Movie selection
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

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (activeBulkMenu) {
                    setActiveBulkMenu(null);
                    setPendingBulkValue(null);
                } else if (selectedIds.length > 0) {
                    setSelectedIds([]);
                }
            }
        };
        const handleClickOutside = () => {
            if (activeBulkMenu) {
                setActiveBulkMenu(null);
                setPendingBulkValue(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleEscape);
            window.removeEventListener('click', handleClickOutside);
        };
    }, [activeBulkMenu, selectedIds.length]);

    const singleSelectChannelOptions = useMemo(() => channels.map(c => ({ id: c.id, label: c.title, colorClass: getChannelColorClass(c.id) })), [channels]);
    const statusDropdownOptions: MultiOption[] = useMemo(() => STATUS_OPTIONS.map(s => ({ id: s.id, label: s.label, color: s.hex })), []);

    const timeOptions: MultiOption[] = [
        { id: 'today', label: 'Added Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
    ];

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
            setSelectedIds([]);
            setActiveBulkMenu(null);
            setPendingBulkValue(null);
        }
    };

    const commitBulkChannelAdd = (type: '3D' | '2D') => {
        if (pendingBulkValue) {
            const channelId = pendingBulkValue;
            setMovies(prev => prev.map(m => {
                if (selectedIds.includes(m.id)) {
                    if (type === '3D') return { ...m, channel3DIds: [channelId], channel3DId: channelId };
                    else return { ...m, channel2DIds: [channelId], channel2DId: channelId };
                }
                return m;
            }));
            selectedIds.forEach(movieId => {
                if (type === '3D') onUpdateMovie(movieId, { channel3DIds: [channelId] });
                else onUpdateMovie(movieId, { channel2DIds: [channelId] });
            });
            setSelectedIds([]);
            setActiveBulkMenu(null);
            setBulkSearchTerm('');
            setPendingBulkValue(null);
        }
    };

    const filteredBulkChannels = useMemo(() => {
        if (!bulkSearchTerm) return singleSelectChannelOptions;
        return singleSelectChannelOptions.filter(c => c.label.toLowerCase().includes(bulkSearchTerm.toLowerCase()));
    }, [bulkSearchTerm, singleSelectChannelOptions]);

    const isVisible = (colId: string) => visibleColumns.includes(colId);
    const totalItems = filteredAndSortedMovies.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedMovies = filteredAndSortedMovies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const confirmDelete = () => {
        setMovies(prev => prev.filter(m => !selectedIds.includes(m.id)));
        selectedIds.forEach(id => onDeleteMovie(id));
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
    };

    return (
        <div className="w-full space-y-6 animate-fade-in pb-20">
            <div className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/50 space-y-4 shadow-xl">
                <div className="flex flex-row gap-4 items-center h-11">
                    <div className="relative flex-grow h-full">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by movie name..."
                            className="w-full h-full pl-11 pr-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                        />
                    </div>
                    <MultiSelectDropdown 
                        label="Columns"
                        options={ALL_MOVIE_COLUMNS}
                        selectedIds={visibleColumns}
                        onChange={setVisibleColumns}
                        className="w-40 h-full"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 102 0 002 2h2a2 2 0 00-2 2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 00-2 2" /></svg>}
                    />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap border border-indigo-500 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Add Movie
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <MultiSelectDropdown 
                        label="Time"
                        options={timeOptions}
                        selectedIds={timeFilter}
                        onChange={setTimeFilter}
                        className="w-full h-11"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    />
                    <MultiSelectDropdown 
                        label="Status"
                        options={statusDropdownOptions}
                        selectedIds={selectedStatuses}
                        onChange={setSelectedStatuses}
                        className="w-full h-11"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 00-2-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth="2" strokeLinecap="round"/></svg>}
                    />
                    <MultiSelectDropdown 
                        label="3D Channels"
                        options={singleSelectChannelOptions}
                        selectedIds={selected3DIds}
                        onChange={setSelected3DIds}
                        className="w-full h-11"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    />
                    <MultiSelectDropdown 
                        label="2D Channels"
                        options={singleSelectChannelOptions}
                        selectedIds={selected2DIds}
                        onChange={setSelected2DIds}
                        className="w-full h-11"
                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                    />
                </div>
            </div>

            <div className="space-y-6">
                <MovieSummaryCards movies={movies} />

                {totalItems > itemsPerPage && (
                    <div className="flex justify-between items-center bg-gray-800/40 p-3 rounded-xl border border-gray-700/50 shadow-sm">
                        <div className="text-xs text-gray-400 font-medium">
                            Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-white">{totalItems}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white disabled:opacity-30 transition-all">Prev</button>
                            <span className="px-3 py-1 bg-gray-900/50 rounded-lg text-xs text-gray-300 border border-gray-700 font-bold">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-white disabled:opacity-30 transition-all">Next</button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto bg-gray-800/40 rounded-xl shadow-xl border border-gray-700/50">
                    <table className="min-w-full divide-y divide-gray-700/50 table-fixed">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center sticky left-0 z-10 bg-inherit shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                                    <CircularCheckbox checked={filteredAndSortedMovies.length > 0 && selectedIds.length === filteredAndSortedMovies.length} onChange={handleToggleAll} label="Select all movies" />
                                </th>
                                {isVisible('name') && (
                                    <SortableHeader label="Movie Title" sortKey="name" currentSort={sortConfig} onSort={handleSort} className="w-[250px] min-w-[200px]" icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>} />
                                )}
                                {isVisible('status') && (
                                    <SortableHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} align="center" className="w-[160px] min-w-[160px]" icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} />
                                )}
                                {isVisible('addedAt') && (
                                    <SortableHeader label="Added At" sortKey="addedAt" currentSort={sortConfig} onSort={handleSort} className="w-[120px] min-w-[120px]" icon={<svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                                )}
                                {isVisible('3d') && (
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 w-[180px] min-w-[180px] whitespace-nowrap overflow-hidden"><div className="flex items-center justify-center gap-2 opacity-90 truncate"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>3D Chan.</div></th>
                                )}
                                {isVisible('2d') && (
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 w-[180px] min-w-[180px] whitespace-nowrap overflow-hidden"><div className="flex items-center justify-center gap-2 opacity-90 truncate"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>2D Chan.</div></th>
                                )}
                                {isVisible('note') && (
                                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-300 w-auto min-w-[200px] whitespace-nowrap overflow-hidden"><div className="flex items-center justify-center gap-2 opacity-90 truncate"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Note</div></th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {paginatedMovies.length > 0 ? paginatedMovies.map((movie) => {
                                 const isSelected = selectedIds.includes(movie.id);
                                 const channel3DId = movie.channel3DIds?.[0] || movie.channel3DId || '';
                                 const channel2DId = movie.channel2DIds?.[0] || movie.channel2DId || '';
                                 return (
                                    <tr key={movie.id} className={`hover:bg-white/[0.03] transition-colors group ${isSelected ? 'bg-indigo-900/20' : ''}`} onClick={(e) => { if (!(e.target as HTMLElement).closest('button, input, .no-row-click')) handleToggleRow(movie.id); }}>
                                        <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 z-10 bg-inherit"><CircularCheckbox checked={isSelected} onChange={() => handleToggleRow(movie.id)} onClick={(e) => e.stopPropagation()} /></td>
                                        {isVisible('name') && <td className="px-4 py-2.5 align-middle"><div className="text-[13px] font-bold text-gray-200 group-hover:text-indigo-400 transition-colors truncate leading-snug">{movie.name}</div></td>}
                                        {isVisible('status') && <td className="px-4 py-2.5 align-middle text-center no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={movie.status} options={STATUS_OPTIONS} onChange={(val) => onUpdateMovie(movie.id, { status: val as MovieStatus })} className="w-[140px]" variant="default" /></div></td>}
                                        {isVisible('addedAt') && <td className="px-4 py-2.5 align-middle"><div className="flex flex-col text-center"><span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{new Date(movie.addedAt).toLocaleDateString()}</span><span className="text-[8px] text-gray-500 opacity-60 whitespace-nowrap">{new Date(movie.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div></td>}
                                        {isVisible('3d') && <td className="px-4 py-2.5 align-middle text-center no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={channel3DId} options={singleSelectChannelOptions} onChange={(id) => onUpdateMovie(movie.id, { channel3DIds: [id] })} placeholder="Select 3D..." className="w-[160px]" variant="minimal" /></div></td>}
                                        {isVisible('2d') && <td className="px-4 py-2.5 align-middle text-center no-row-click"><div className="flex justify-center w-full"><SearchableSelect value={channel2DId} options={singleSelectChannelOptions} onChange={(id) => onUpdateMovie(movie.id, { channel2DIds: [id] })} placeholder="Select 2D..." className="w-[160px]" variant="minimal" /></div></td>}
                                        {isVisible('note') && <td className="px-4 py-2.5 align-middle no-row-click"><NoteInput initialValue={movie.note || ''} onSave={(val) => onUpdateMovie(movie.id, { note: val })} /></td>}
                                    </tr>
                                 );
                            }) : (
                                <tr><td colSpan={visibleColumns.length + 1} className="px-6 py-20 text-center text-gray-500 italic">No movies found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <BulkActionBar count={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={() => setIsDeleteModalOpen(true)}>
                    <BulkDropdown label="Status" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} isOpen={activeBulkMenu === 'status'} onToggle={() => { setActiveBulkMenu(activeBulkMenu === 'status' ? null : 'status'); setPendingBulkValue(null); }}>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">{STATUS_OPTIONS.map(status => (
                            <button key={status.id} onClick={(e) => { e.stopPropagation(); setPendingBulkValue(status.id); }} className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center gap-2 justify-between ${pendingBulkValue === status.id ? 'bg-indigo-900/50 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.hex }}></span>{status.label}</div>{pendingBulkValue === status.id && <span className="text-indigo-400 font-bold">✓</span>}</button>
                        ))}</div>
                        <div className="p-2 border-t border-gray-700 bg-gray-900/50"><button onClick={(e) => { e.stopPropagation(); commitBulkStatusChange(); }} disabled={!pendingBulkValue} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-1.5 rounded transition-all">Save</button></div>
                    </BulkDropdown>
                </BulkActionBar>
            )}

            <AddMovieModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddMovies={onAddMovies} />
            <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} count={selectedIds.length} itemName="movie" />
        </div>
    );
};