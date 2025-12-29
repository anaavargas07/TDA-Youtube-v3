
import React, { useState } from 'react';
import type { AddChannelResult } from '../hooks/useAppData';

interface ChannelInputProps {
    onAddChannel: (channelInput: string) => Promise<AddChannelResult[]>;
    isDisabled: boolean;
    isAdding: boolean;
}

export const ChannelInput: React.FC<ChannelInputProps> = ({ onAddChannel, isDisabled, isAdding }) => {
    const [inputValue, setInputValue] = useState('');
    const [results, setResults] = useState<AddChannelResult[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setResults([]); // Clear previous results
            const res = await onAddChannel(inputValue);
            setResults(res);
            // If all were successful, we could clear input, but keeping it for now in case user wants to re-check
            if (res.every(r => r.status === 'success')) {
                setInputValue('');
            }
        }
    };

    return (
        <div className="w-full">
            <div className="p-6">
                <p className="text-gray-400 text-sm mb-4">
                    Paste one or more YouTube channel URLs, IDs (UC...), or Handles (@name) below. Put each channel on a new line.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <textarea
                        rows={5}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isDisabled || isAdding}
                        placeholder={`https://www.youtube.com/@Google\nUC_x5XG1OV2P6uZZ5FSM9Ttw\nMrBeast`}
                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 resize-none transition-colors"
                    />
                    
                    {/* Status Results Display */}
                    {results.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-3 border border-gray-800">
                            {results.map((res, idx) => (
                                <div key={idx} className={`flex items-center justify-between text-xs p-2 rounded-lg ${res.status === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                    <div className="flex items-center gap-2 truncate">
                                        {res.status === 'success' ? (
                                            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        )}
                                        <span className="font-bold text-gray-300 truncate">{res.channelTitle || res.identifier}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold ${res.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                        {res.status === 'success' ? 'Added Successfully' : res.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isDisabled || !inputValue.trim() || isAdding}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center min-w-[150px]"
                        >
                            {isAdding ? (
                                <div className="flex items-center gap-2">
                                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                     </svg>
                                     <span>Adding...</span>
                                </div>
                            ) : (
                                'Add Channels'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
