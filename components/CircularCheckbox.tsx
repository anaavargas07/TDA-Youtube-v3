import React from 'react';

interface CircularCheckboxProps {
    checked: boolean;
    onChange: () => void;
    onClick?: (e: React.MouseEvent) => void;
    label?: string; // Optional label for accessibility or display
}

export const CircularCheckbox: React.FC<CircularCheckboxProps> = ({ checked, onChange, onClick, label }) => (
    <label className="relative flex items-center justify-center cursor-pointer" onClick={onClick} aria-label={label}>
        <input 
            type="checkbox" 
            checked={checked}
            onChange={onChange}
            className="peer appearance-none h-5 w-5 border-2 border-gray-600 rounded-full bg-gray-800/50 checked:bg-indigo-500 checked:border-indigo-500 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 transition-all duration-200"
        />
        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    </label>
);
