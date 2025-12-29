
import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from './ApiKeyManager';
import { AppSettings, ApiKey } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    
    // API Key Props
    apiKeys: ApiKey[];
    onApiKeysChange: (keys: string[]) => void;
    onRevalidateAll: () => void;
    
    // App Settings Props
    settings: AppSettings;
    onSettingsChange: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    apiKeys,
    onApiKeysChange,
    onRevalidateAll,
    settings,
    onSettingsChange
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'api_keys'>('general');

    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleRefreshIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value, 10);
        onSettingsChange({ ...settings, refreshInterval: val });
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val > 0) {
            onSettingsChange({ ...settings, rowsPerPage: val });
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl border border-indigo-500/30 m-4 flex flex-col md:flex-row overflow-hidden h-[80vh] md:h-[600px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 bg-gray-900/80 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white">Settings</h2>
                        <p className="text-xs text-gray-500 mt-1">Configure your dashboard</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('api_keys')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'api_keys' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l1-1 1-1 1.257-1.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" />
                            </svg>
                            API Key Management
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-gray-800">
                    <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
                        <h3 className="text-lg font-bold text-white">
                            {activeTab === 'general' ? 'General Settings' : 'API Key Management'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                        {activeTab === 'general' && (
                            <div className="space-y-8 max-w-xl">
                                {/* Auto Refresh Section */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Auto-Refresh Interval</label>
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <p className="text-xs text-gray-400 mb-3">Automatically refresh channel statistics in the background. (0 = Disabled)</p>
                                        <select 
                                            value={settings.refreshInterval} 
                                            onChange={handleRefreshIntervalChange}
                                            className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                                        >
                                            <option value={0}>Disabled (Manual Refresh)</option>
                                            <option value={5 * 60 * 1000}>Every 5 minutes</option>
                                            <option value={30 * 60 * 1000}>Every 30 minutes</option>
                                            <option value={60 * 60 * 1000}>Every 1 hour</option>
                                            <option value={3 * 60 * 60 * 1000}>Every 3 hours</option>
                                            <option value={6 * 60 * 60 * 1000}>Every 6 hours</option>
                                            <option value={24 * 60 * 60 * 1000}>Every 24 hours</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Pagination Section */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">Rows Per Page</label>
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <p className="text-xs text-gray-400 mb-3">Default number of rows displayed in Channels and Movies tables.</p>
                                        <input 
                                            type="number" 
                                            value={settings.rowsPerPage}
                                            onChange={handleRowsPerPageChange}
                                            min={10}
                                            max={500}
                                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-2">Recommended: 100 for better performance.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'api_keys' && (
                            <ApiKeyManager 
                                apiKeys={apiKeys}
                                onApiKeysChange={onApiKeysChange}
                                onRevalidateAll={onRevalidateAll}
                                isDisabled={false}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
