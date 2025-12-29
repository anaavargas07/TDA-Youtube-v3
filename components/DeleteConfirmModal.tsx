
import React, { useEffect } from 'react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    count?: number;
    itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Deletion",
    message,
    count,
    itemName = "item"
}) => {
    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100]"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 m-4 transform transition-all animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    
                    <p className="text-gray-400 text-sm mb-6">
                        {message || `Are you sure you want to delete ${count ? count : 'this'} ${itemName}${count && count > 1 ? 's' : ''}? This action cannot be undone.`}
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-600"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { onConfirm(); onClose(); }}
                            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                        >
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
