
import React, { useState } from 'react';
import { ApiKey, KeyStatus } from '../types';
import { maskApiKey } from '../utils/helpers';

interface ApiKeyManagerProps {
    apiKeys: ApiKey[];
    onApiKeysChange: (keys: string[]) => void;
    onRevalidateAll: () => void;
    isDisabled: boolean;
}

const getStatusTitle = (status: KeyStatus, error?: string): string => {
    switch (status) {
        case 'valid': return 'Valid';
        case 'invalid': return `Invalid: ${error || 'Unknown reason'}`;
        case 'checking': return 'Checking...';
        case 'quota_exceeded': return `Valid, but quota exceeded. Will be skipped.`;
        default: return 'Unknown status';
    }
};

const StatusIndicator: React.FC<{ status: KeyStatus, error?: string }> = ({ status, error }) => {
    const baseClasses = "w-3 h-3 rounded-full flex-shrink-0";
    const title = getStatusTitle(status, error);

    switch (status) {
        case 'valid':
            return <div className={`${baseClasses} bg-green-500`} title={title}></div>;
        case 'invalid':
            return <div className={`${baseClasses} bg-red-500`} title={title}></div>;
        case 'checking':
            return <div className={`${baseClasses} bg-yellow-500 animate-pulse`} title={title}></div>;
        case 'quota_exceeded':
            return <div className={`${baseClasses} bg-orange-500`} title={title}></div>;
        default:
            return <div className={`${baseClasses} bg-gray-500`} title={title}></div>;
    }
};

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ apiKeys, onApiKeysChange, onRevalidateAll, isDisabled }) => {
    const [newKeysInput, setNewKeysInput] = useState('');
    const [isGuideVisible, setIsGuideVisible] = useState(false);
    
    const handleAddKeys = () => {
        const keyInputs = newKeysInput.split('\n').map(k => k.trim()).filter(Boolean);
        if (keyInputs.length === 0) return;

        const existingKeyValues = new Set(apiKeys.map(k => k.value));
        const keysToAdd = keyInputs.filter(k => !existingKeyValues.has(k));
        
        if (keysToAdd.length > 0) {
            const updatedKeyStrings = [...apiKeys.map(k => k.value), ...keysToAdd];
            onApiKeysChange(updatedKeyStrings);
            setNewKeysInput('');
        }
    };
    
    const handleRemoveKey = (keyToRemove: string) => {
        const updatedKeyStrings = apiKeys.filter(k => k.value !== keyToRemove).map(k => k.value);
        onApiKeysChange(updatedKeyStrings);
    };

    return (
        <div className="w-full max-w-2xl bg-gray-800/70 border border-indigo-500/50 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-start">
                 <div>
                    <h2 className="text-xl font-bold text-white">YouTube API Keys</h2>
                    <p className="text-sm text-gray-300 mt-1">
                        Manage your pool of YouTube Data API keys. The app will automatically rotate keys.
                    </p>
                </div>
                 <button onClick={onRevalidateAll} className="text-xs text-gray-400 hover:text-white flex items-center space-x-1" disabled={isDisabled || apiKeys.length === 0}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
                    <span>Validate All</span>
                </button>
            </div>
            
            <div className="space-y-3">
                <label htmlFor="add-api-key" className="block text-sm font-medium text-gray-300">Add New Key(s)</label>
                <div className="flex space-x-2">
                    <textarea
                        id="add-api-key"
                        rows={3}
                        value={newKeysInput}
                        onChange={(e) => setNewKeysInput(e.target.value)}
                        placeholder="Paste one or more API keys here, separated by new lines."
                        disabled={isDisabled}
                        className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 resize-y"
                    />
                    <button
                        onClick={handleAddKeys}
                        disabled={!newKeysInput.trim() || isDisabled}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Add
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                 <h3 className="text-lg font-semibold text-white">Active Keys ({apiKeys.length})</h3>
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-2 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    {apiKeys.length > 0 ? (
                        apiKeys.map(({ value, status, error }) => (
                            <div key={value} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg group">
                                <div className="flex items-center space-x-3">
                                    <StatusIndicator status={status} error={error} />
                                    <span className="font-mono text-sm text-gray-300">{maskApiKey(value)}</span>
                                    {(status === 'invalid' || status === 'quota_exceeded') && <span className="text-xs text-red-400">{error}</span>}
                                </div>
                                <button 
                                    onClick={() => handleRemoveKey(value)}
                                    disabled={isDisabled}
                                    className="text-red-500 hover:text-red-400 text-xs font-bold opacity-50 group-hover:opacity-100 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
                                    aria-label={`Remove key ending in ${value.slice(-4)}`}
                                >
                                    REMOVE
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 text-sm py-4">No API keys configured. Please add one to begin.</p>
                    )}
                </div>
            </div>
             <div>
                <button onClick={() => setIsGuideVisible(!isGuideVisible)} className="text-sm text-indigo-400 hover:text-indigo-300">
                     {isGuideVisible ? '▲ Hide Guide' : '▼ How to get a YouTube API Key?'}
                </button>
                 {isGuideVisible && (
                    <div className="text-xs text-gray-300 bg-gray-900/50 p-3 mt-2 rounded-lg space-y-2 max-h-60 overflow-y-auto border border-gray-700">
                        <p className="font-bold text-white">Follow these steps to get your API key:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Cloud Console</a> and create or select a project.</li>
                            <li>Go to the <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">YouTube Data API v3 Library Page</a>, make sure you're in the right project, and click "Enable".</li>
                            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Credentials</a> page, click "+ CREATE CREDENTIALS" and select "API key".</li>
                            <li>Copy the key, paste it into the box above, and click "Add".</li>
                            <li className="font-semibold text-amber-400">Important: The default API quota is 10,000 units per day. Most read operations cost 1 unit, but searches cost 100 units. Be mindful of your usage.</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
};