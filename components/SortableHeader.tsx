import React from 'react';

interface SortableHeaderProps<T> {
    label: string;
    sortKey: T;
    currentSort: { key: T; direction: 'asc' | 'desc' };
    onSort: (key: T) => void;
    className?: string;
    align?: 'left' | 'right' | 'center';
    icon?: React.ReactNode;
}

export const SortableHeader = <T extends string | number | symbol>({
    label,
    sortKey,
    currentSort,
    onSort,
    className = "",
    align = 'center',
    icon,
}: SortableHeaderProps<T>) => {
    const isActive = currentSort.key === sortKey;
    
    return (
        <th 
            className={`px-4 py-3 text-sm font-medium text-gray-300 cursor-pointer hover:text-white hover:bg-white/5 transition-all whitespace-nowrap overflow-hidden ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'left' ? 'justify-start' : 'justify-center'}`}>
                <div className="flex items-center gap-1.5 opacity-90 min-w-0">
                    {icon && <span className="text-gray-400 group-hover:text-white flex-shrink-0">{icon}</span>}
                    <span className="truncate">{label}</span>
                </div>
                <div className="flex flex-col -space-y-1 w-2 flex-shrink-0">
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'asc' ? 'text-indigo-400' : 'text-gray-600'}`}>▲</span>
                    <span className={`text-[7px] leading-none transition-colors ${isActive && currentSort.direction === 'desc' ? 'text-indigo-400' : 'text-gray-600'}`}>▼</span>
                </div>
            </div>
        </th>
    );
};