
import React from 'react';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="w-full max-w-4xl mx-auto bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mt-6" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline" style={{ whiteSpace: 'pre-wrap' }}>{message}</span>
        </div>
    );
};
