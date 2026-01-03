
import React from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-toast-in">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${
                type === 'success' 
                ? 'bg-emerald-500/90 border-emerald-400/50 text-white' 
                : 'bg-red-500/90 border-red-400/50 text-white'
            }`}>
                {type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
                <span className="text-sm font-bold tracking-tight">{message}</span>
            </div>
        </div>
    );
};
