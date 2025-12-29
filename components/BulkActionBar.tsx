
import React from 'react';
import { createPortal } from 'react-dom';

interface BulkActionBarProps {
    count: number;
    onClear: () => void;
    onDelete: () => void;
    children?: React.ReactNode;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, onClear, onDelete, children }) => {
    return createPortal(
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-slide-up w-fit max-w-[95vw]">
            <div className="bg-[#1e293b]/95 backdrop-blur-xl border-2 border-gray-500/50 rounded-full px-8 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-8 whitespace-nowrap">
                {/* Count & Label */}
                <div className="flex items-center gap-3 pr-2">
                    <div className="flex items-center justify-center bg-indigo-600 text-white text-[11px] font-black h-5 min-w-[20px] px-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                        {count}
                    </div>
                    <span className="text-white text-sm font-bold">Selected</span>
                </div>

                {/* Vertical Separator */}
                <div className="w-px h-6 bg-gray-700"></div>

                {/* Specific Actions (Children: Status, 3D, 2D) */}
                {children && (
                    <>
                        <div className="flex items-center gap-8">
                            {children}
                        </div>
                        <div className="w-px h-6 bg-gray-700"></div>
                    </>
                )}

                {/* Main Actions: Delete & Cancel */}
                <div className="flex items-center gap-8 pl-2">
                    <button 
                        onClick={onDelete}
                        className="text-[#f87171] hover:text-red-400 text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>

                    <button 
                        onClick={onClear}
                        className="text-gray-400 hover:text-white text-sm font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                    >
                        <svg className="w-4 h-4 text-red-500/80 group-hover:text-red-500 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
