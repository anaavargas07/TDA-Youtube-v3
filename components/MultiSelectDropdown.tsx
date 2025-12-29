import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom'; // Add this import

export interface Option {
    id: string;
    label: string;
    color?: string; // Optional color dot
    icon?: React.ReactNode;
}

interface MultiSelectDropdownProps {
    label: string;
    options: Option[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    icon?: React.ReactNode;
    className?: string; // Added to support custom widths
    footer?: React.ReactNode; // New prop for custom footer actions
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
    label, 
    options, 
    selectedIds, 
    onChange,
    icon,
    className = "w-full md:w-56", // Default fallback
    footer
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the button and its container
    
    // New: State and refs for portal positioning
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
    const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the button itself
    const menuRef = useRef<HTMLDivElement>(null); // Ref for the portal menu container

    const updatePosition = useCallback(() => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const MENU_MAX_HEIGHT = 280; // Estimate max height of the dropdown list + search/footer

            let newPlacement: 'bottom' | 'top' = 'bottom';
            if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove > MENU_MAX_HEIGHT) { 
                newPlacement = 'top';
            } else if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove < MENU_MAX_HEIGHT) {
                // If not enough space either side, prioritize bottom, but ensure it's not off-screen
                newPlacement = 'bottom';
            }

            setPlacement(newPlacement);
            setMenuPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height // Store height explicitly
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node) &&
                menuRef.current && !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        
        const handleScroll = () => {
            if (isOpen) updatePosition();
        };
        const handleResize = () => {
            if (isOpen) updatePosition();
        };

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
    }, [isOpen, updatePosition]);

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
                width: menuPosition?.width ?? 0,
                maxHeight: '280px',
                minWidth: '200px', // Ensure a minimum width for readability
            }}
        >
            {/* Search Input */}
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

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                {/* Select All Option */}
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
                                {/* Hiển thị icon của option nếu có */}
                                {option.icon && (
                                    <div className="text-gray-500 group-hover:text-white transition-colors mr-2 flex-shrink-0">
                                        {option.icon}
                                    </div>
                                )}
                                {option.color && (
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: option.color }}></span>
                                )}
                                <span className="text-sm text-gray-300 group-hover:text-white truncate">{option.label}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>
                )}
            </div>

            {/* Custom Footer Action */}
            {footer && (
                <div className="border-t border-gray-700 bg-gray-900/50">
                    {footer}
                </div>
            )}
        </div>
    );


    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef} // Apply ref to the button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="truncate">
                        {selectedIds.length === 0 
                            ? label 
                            : selectedIds.length === options.length 
                                ? `All ${label.replace('All ', '')}`
                                : `${selectedIds.length} selected`}
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && menuPosition && createPortal(menuContent, document.body)} {/* Render using portal */}
        </div>
    );
};