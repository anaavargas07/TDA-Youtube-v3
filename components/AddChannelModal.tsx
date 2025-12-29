
import React, { useEffect } from 'react';
import { ChannelInput } from './ChannelInput';
import type { AddChannelResult } from '../hooks/useAppData';

interface AddChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddChannel: (channelInput: string) => Promise<AddChannelResult[]>;
    isDisabled: boolean;
    isAdding: boolean;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({ isOpen, onClose, onAddChannel, isDisabled, isAdding }) => {
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 m-4 relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white">Add New Channels</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-0">
                    <ChannelInput 
                        onAddChannel={onAddChannel}
                        isDisabled={isDisabled}
                        isAdding={isAdding}
                    />
                </div>
            </div>
        </div>
    );
};
