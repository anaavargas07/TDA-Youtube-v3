
import React, { useState, useEffect } from 'react';

interface AddMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMovies: (names: string) => void;
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({ isOpen, onClose, onAddMovies }) => {
    const [inputValue, setInputValue] = useState('');

    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onAddMovies(inputValue);
            setInputValue('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 m-4 relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white">Add New Movies</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-400 text-sm">Enter movie names (one per line). Each line will create a new tracking entry.</p>
                    <textarea
                        rows={6}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Movie Name 1&#10;Movie Name 2&#10;Movie Name 3..."
                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-600 resize-none transition-all"
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
                        <button 
                            onClick={handleSubmit}
                            disabled={!inputValue.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                        >
                            Confirm Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
