
import React from 'react';
import { formatNumber } from '../utils/helpers';
import type { Movie } from '../types';

interface MovieSummaryCardsProps {
    movies: Movie[];
}

const STATUS_METADATA = [
    { id: 'Playlist', label: 'Playlist', color: 'bg-blue-500/10 text-blue-500', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'Download', label: 'Download', color: 'bg-purple-500/10 text-purple-500', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'Copyright Check', label: 'Copyright Check', color: 'bg-yellow-500/10 text-yellow-500', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'Visual Copyright', label: 'Visual Copyright', color: 'bg-orange-500/10 text-orange-500', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { id: 'Audio Copyright', label: 'Audio Copyright', color: 'bg-pink-500/10 text-pink-500', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
    { id: 'Strike Check', label: 'Strike Check', color: 'bg-red-500/10 text-red-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'Done', label: 'Done', color: 'bg-emerald-500/10 text-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const MovieSummaryCards: React.FC<MovieSummaryCardsProps> = ({ movies }) => {
    const totalMovies = movies.length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-3 shadow-sm group hover:border-indigo-500/50 transition-colors min-w-0">
                <div className="p-2 bg-indigo-500/10 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] text-gray-500 font-bold truncate">Total</p>
                    <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(totalMovies)}</p>
                </div>
            </div>

            {STATUS_METADATA.map((status) => {
                const count = movies.filter(m => m.status === status.id).length;
                return (
                    <div key={status.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 flex items-center gap-3 shadow-sm group hover:bg-gray-700/20 transition-all min-w-0">
                        <div className={`p-2 ${status.color} rounded-lg flex-shrink-0`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={status.icon} />
                            </svg>
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <p className="text-[10px] text-gray-400 font-bold truncate" title={status.label}>{status.label}</p>
                            <p className="text-xl font-black text-white tabular-nums leading-none mt-0.5">{formatNumber(count)}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
