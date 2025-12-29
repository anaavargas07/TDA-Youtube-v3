
import React from 'react';
import { ApiKey } from '../types';
import { maskApiKey } from '../utils/helpers';

interface TopBarProps {
    trackedChannelsCount: number;
    apiKeys: ApiKey[];
    currentKeyIndex: number;
    sessionQuota: number;
    dailyQuota: number;
    dailyQuotaLimit: number;
}

export const TopBar: React.FC<TopBarProps> = ({ trackedChannelsCount, apiKeys, currentKeyIndex, sessionQuota, dailyQuota, dailyQuotaLimit }) => {
    
    const totalKeys = apiKeys.length;
    const activeKeys = apiKeys.filter(k => k.status === 'valid').length;
    const currentKey = apiKeys[currentKeyIndex]?.value || 'N/A';
    const currentKeyStatus = apiKeys[currentKeyIndex]?.status || 'unknown';
    const dailyQuotaPercentage = dailyQuotaLimit > 0 ? (dailyQuota / dailyQuotaLimit) * 100 : 0;

    const getStatusInfo = (status: string): { color: string, text: string } => {
        switch(status) {
            case 'valid': return { color: 'text-green-400', text: 'Valid' };
            case 'checking': return { color: 'text-yellow-400', text: 'Checking' };
            case 'quota_exceeded': return { color: 'text-orange-400', text: 'Quota' };
            case 'invalid': return { color: 'text-red-400', text: 'Invalid' };
            default: return { color: 'text-gray-400', text: 'Unknown' };
        }
    };

    const { color: statusColor, text: statusText } = getStatusInfo(currentKeyStatus);

    return (
        <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md h-8 z-50 text-xs text-gray-400 flex items-center justify-between px-4 border-b border-indigo-500/20 shadow-lg">
            {/* Left Section */}
            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    <span>Tracked: <span className="font-bold text-indigo-400">{trackedChannelsCount}</span></span>
                </span>
            </div>

            {/* Right Section: Keys and Quotas */}
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l1-1 1-1 1.257-1.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                    <span>Keys: <span className="font-bold text-green-400">{activeKeys}</span><span className="text-gray-500">/{totalKeys}</span></span>
                </span>
                
                <span title={`Current key status: ${statusText}`}>
                    Current Key: <span className={`font-mono ${statusColor}`}>{maskApiKey(currentKey)}</span>
                </span>

                <span className="w-px h-4 bg-gray-600"></span>

                <div className="flex items-center gap-1.5" title={`Session quota usage: ${sessionQuota.toLocaleString()} units`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Session:</span>
                    <span className="text-amber-400 font-mono font-semibold">{sessionQuota.toLocaleString()}</span>
                </div>

                 <div className="flex items-center gap-1.5" title={`Daily quota usage: ${dailyQuota.toLocaleString()} / ${dailyQuotaLimit.toLocaleString()} units`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                    <span>Daily:</span>
                    <div className="w-20 bg-gray-700 rounded-full h-2.5 relative border border-gray-600">
                        <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(dailyQuotaPercentage, 100)}%` }}></div>
                    </div>
                    <span className="text-indigo-400 font-mono font-semibold">{`${dailyQuota.toLocaleString()} / ${dailyQuotaLimit.toLocaleString()}`}</span>
                </div>
            </div>
        </div>
    );
};
