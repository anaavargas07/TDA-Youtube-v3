import React from 'react';
import { VideoStat } from '../types';
import { formatNumber, formatRelativeTime } from '../utils/helpers';
import { StatIcon } from './StatIcon';

interface VideoCardProps {
    video: VideoStat;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    return (
        <a 
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg group transition-transform transform hover:-translate-y-1 hover:shadow-indigo-500/20"
        >
            <div className="aspect-video relative">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/70 group-hover:text-white transition-colors" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <div className="p-4 space-y-2">
                <h3 className="text-base font-semibold text-white line-clamp-2" title={video.title}>{video.title}</h3>
                <p className="text-xs text-gray-400">{formatRelativeTime(video.publishedAt)}</p>
                <div className="flex justify-between items-center pt-2 text-sm">
                    <StatIcon type="views" value={formatNumber(video.viewCount)} />
                    <StatIcon type="likes" value={formatNumber(video.likeCount)} />
                    <StatIcon type="comments" value={formatNumber(video.commentCount)} />
                </div>
            </div>
        </a>
    )
}
