
import React, { useState, useRef, useEffect } from 'react';

interface Option {
    id: string;
    label: string;
}

interface TagSelectProps {
    selectedIds: string[];
    options: Option[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
}

export const TagSelect: React.FC<TagSelectProps> = ({ selectedIds, options, onChange, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => 
        o.label.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !selectedIds.includes(o.id)
    );

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(sid => sid !== id));
    };

    const handleAdd = (id: string) => {
        onChange([...selectedIds, id]);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div 
                className="flex flex-wrap gap-1.5 p-1.5 min-h-[36px] bg-transparent hover:bg-white/5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedIds.length === 0 && (
                    <span className="text-gray-600 text-xs px-2 py-0.5 font-medium">{placeholder}</span>
                )}
                
                {selectedIds.slice(0, 2).map(id => {
                    const opt = options.find(o => o.id === id);
                    return (
                        <div key={id} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold border border-indigo-500/10">
                            <span className="max-w-[70px] truncate">{opt?.label || id}</span>
                            <button onClick={(e) => handleRemove(id, e)} className="hover:text-white rounded-full p-0.5 hover:bg-indigo-500/20">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    );
                })}
                
                {selectedIds.length > 2 && (
                    <span className="text-[10px] text-gray-500 font-medium px-1 flex items-center">+{selectedIds.length - 2} more</span>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-64 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl animate-fade-in-down">
                    <div className="p-2 border-b border-gray-700 bg-gray-900/30">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Find channel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-600"
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleAdd(opt.id)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-indigo-600/10 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                {opt.label}
                            </button>
                        )) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-500 italic">No channels found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
