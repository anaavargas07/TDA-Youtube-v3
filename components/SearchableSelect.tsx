
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Option {
    id: string;
    label: string;
    colorClass?: string;
}

interface SearchableSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    variant?: 'default' | 'minimal';
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
    value, 
    options, 
    onChange, 
    placeholder = "Select...", 
    className = "",
    variant = 'default' 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
    
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);

    const updatePosition = useCallback(() => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const MENU_HEIGHT = 220;

            let newPlacement: 'bottom' | 'top' = 'bottom';
            if (spaceBelow < MENU_HEIGHT && spaceAbove > spaceBelow) {
                newPlacement = 'top';
            }

            setPlacement(newPlacement);
            setMenuPosition({
                top: newPlacement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
                left: rect.left,
                width: rect.width
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current && 
                !containerRef.current.contains(event.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        
        const handleScroll = () => {
            if (isOpen) {
                updatePosition();
            }
        };

        if (isOpen) {
            updatePosition();
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true); 
            window.addEventListener('resize', handleScroll);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen, updatePosition]);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

    let buttonClasses = `w-full flex items-center justify-between px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent hover:border-white/10 active:scale-95 normal-case `;
    
    if (variant === 'minimal') {
        buttonClasses += `bg-gray-800/50 text-gray-200`;
    } else {
        buttonClasses += selectedOption?.colorClass || 'bg-gray-800 text-gray-300';
    }

    const MenuContent = (
        <div 
            ref={menuRef}
            className="fixed z-[9999] bg-[#1e293b] border-2 border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up"
            style={{
                top: menuPosition?.top,
                left: menuPosition?.left,
                width: 240,
                transformOrigin: placement === 'bottom' ? 'top center' : 'bottom center',
                transform: placement === 'top' ? 'translateY(-100%)' : 'none'
            }}
        >
            <div className="p-2 border-b border-gray-700 bg-black/20">
                <input
                    type="text"
                    autoFocus
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 normal-case"
                    onKeyDown={(e) => e.stopPropagation()}
                />
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                    <button
                        key={opt.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(opt.id);
                            setIsOpen(false);
                            setSearchTerm('');
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-all duration-200 flex items-center gap-3 normal-case ${opt.id === value ? 'bg-indigo-600/20 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                        {opt.colorClass && <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${opt.colorClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-gray-400'}`}></span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.id === value && <span className="ml-auto text-indigo-400 font-bold">✓</span>}
                    </button>
                )) : (
                    <div className="px-3 py-4 text-center text-xs text-gray-500 italic">No matches found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={buttonClasses}
            >
                <div className="flex items-center gap-2 truncate flex-1 justify-center">
                    {variant === 'minimal' && selectedOption && selectedOption.colorClass && (
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedOption.colorClass.split(' ').find(c => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-gray-400'}`}></span>
                    )}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                
                <svg className={`w-3 h-3 ml-1 transition-transform opacity-50 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(MenuContent, document.body)}
        </div>
    );
};
