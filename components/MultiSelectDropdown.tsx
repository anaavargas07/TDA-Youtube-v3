
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

export interface Option {
    id: string;
    label: string;
    color?: string; // Optional color dot (deprecated in UI but kept in interface for compatibility)
    icon?: React.ReactNode;
    badge?: string | number; // New field for channel counts or info
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    icon?: React.ReactNode;
    className?: string;
    header?: React.ReactNode | ((close: () => void) => React.ReactNode); // Support render prop
    footer?: React.ReactNode | ((close: () => void) => React.ReactNode); // Support render prop
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    label, 
    options, 
    selectedIds, 
    onChange,
    icon,
    className = "w-full md:w-56",
    header,
    footer
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
            const MENU_MAX_HEIGHT = 320; 

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
                width: Math.max(menuPosition?.width ?? 0, 220),
                maxHeight: '350px',
            }}
        >
            <div className="p-2 border-b border-gray-700">
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

            {header && (
                <div className="border-b border-gray-700 bg-gray-900/50">
                    {typeof header === 'function' ? header(closeMenu) : header}
                </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                {searchTerm === '' && options.length > 0 && (
                    <div 
                        onClick={handleSelectAll}
                        className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer group"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-500 group-hover:border-gray-400'}`}>
                            {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm text-white font-medium">Select All</span>
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
                                <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">{option.label}</span>
                                {option.badge !== undefined && (
                                    <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gray-800/80 text-gray-500 group-hover:text-indigo-400 border border-white/5 transition-colors shadow-sm">
                                        ({option.badge})
                                    </span>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                )}
            </div>

            {footer && (
                <div className="border-t border-gray-700 bg-gray-900/50">
                    {typeof footer === 'function' ? footer(closeMenu) : footer}
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="truncate">
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
