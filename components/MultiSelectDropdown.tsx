import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface Option {
    id: string;
    label: string;
    color?: string;
    icon?: React.ReactNode;
    badge?: string | number;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    icon?: React.ReactNode;
    className?: string;
    onCreateClick?: () => void;
    onManageClick?: () => void;
    manageCount?: number;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    label, 
    options, 
    selectedIds, 
    onChange,
    icon,
    className = "w-full",
    onCreateClick,
    onManageClick,
    manageCount = 0
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
    }, []);

    const updatePosition = useCallback(() => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const MENU_MAX_HEIGHT = 400; 

            let newPlacement: 'bottom' | 'top' = 'bottom';
            if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove > MENU_MAX_HEIGHT) { 
                newPlacement = 'top';
            }

            setPlacement(newPlacement);
            setMenuPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                closeMenu();
            }
        };
        
        const handleScroll = () => { if (isOpen) updatePosition(); };
        const handleResize = () => { if (isOpen) updatePosition(); };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true); 
            window.addEventListener('resize', handleResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, updatePosition, closeMenu]);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(item => item !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.id));
        }
    };

    const isAllSelected = options.length > 0 && selectedIds.length === options.length;

    const menuContent = (
        <div 
            ref={menuRef}
            className="fixed z-[9999] bg-[#1e293b] border-2 border-gray-700 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-fade-in"
            style={{
                top: placement === 'bottom' ? (menuPosition?.top ?? 0) + (menuPosition?.height ?? 0) + 8 : 'auto',
                bottom: placement === 'top' ? (window.innerHeight - (menuPosition?.top ?? 0)) + 8 : 'auto',
                left: menuPosition?.left ?? 0,
                width: Math.max(menuPosition?.width ?? 0, 260),
                maxHeight: '450px',
            }}
        >
            {/* Header with Create | Manage */}
            {(onCreateClick || onManageClick) && (
                <div className="flex border-b border-gray-700 h-10 shrink-0">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onCreateClick?.(); closeMenu(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-400 hover:bg-white/5 transition-colors border-r border-gray-700"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Create
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onManageClick?.(); closeMenu(); }}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:bg-white/5 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Manage ({manageCount})
                    </button>
                </div>
            )}

            <div className="p-2 border-b border-gray-700 bg-gray-900/30">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                {searchTerm === '' && options.length > 0 && (
                    <div 
                        onClick={handleSelectAll}
                        className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                            {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm text-white font-bold">Select All</span>
                    </div>
                )}

                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => {
                        const isSelected = selectedIds.includes(option.id);
                        return (
                            <div 
                                key={option.id}
                                onClick={() => toggleSelection(option.id)}
                                className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                {option.icon && <div className="text-gray-500 group-hover:text-white transition-colors mr-2 flex-shrink-0">{option.icon}</div>}
                                <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1 font-medium">{option.label}</span>
                                {option.badge !== undefined && (
                                    <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 group-hover:text-indigo-400 border border-white/5 transition-colors">
                                        ({option.badge})
                                    </span>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center italic">No results found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="truncate font-semibold">
                        {selectedIds.length === 0 
                            ? label 
                            : selectedIds.length === options.length 
                                ? `All ${label}`
                                : `${selectedIds.length} selected`}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && menuPosition && createPortal(menuContent, document.body)}
        </div>
    );
};