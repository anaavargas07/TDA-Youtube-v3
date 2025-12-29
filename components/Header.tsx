import React, { useState, useRef, useMemo } from 'react'; // Import useRef and useMemo
import { UserProfile, ChannelStats } from '../types';

interface HeaderProps {
    onOpenSettings: () => void;
    onOpenAccount: () => void;
    profile: UserProfile | null;
    currentView: 'channels' | 'movies'; // Updated to only main views
    onViewChange: (view: 'channels' | 'movies') => void; // Updated to only main views
    // currentSubView: 'allChannels' | 'groupsOverview'; // Removed: Handled by modal now
    // onSubViewChange: (subView: 'allChannels' | 'groupsOverview') => void; // Removed: Handled by modal now
    lastViewedChannelId?: string; // New: ID of the last viewed channel
    onViewSpecificChannel: (id: string) => void; // New: Handler to view a specific channel's dashboard
    trackedChannels: ChannelStats[]; // New: All tracked channels for fallback logic
    onOpenGroupsOverview: () => void; // New: Handler to open the GroupsOverviewModal
    showNavigation?: boolean;
    minimal?: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
}

const YouTubeLogo = () => (
    <div className="relative flex items-center justify-center transform transition-transform hover:scale-110 duration-300 cursor-pointer" title="YouTube TDA Team Dashboard">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-600 blur-[15px] opacity-20 rounded-full"></div>
        
        {/* Icon */}
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#FF0000] relative z-10 filter drop-shadow-md" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    </div>
);

export const Header: React.FC<HeaderProps> = ({ 
    onOpenSettings, 
    onOpenAccount, 
    profile,
    currentView,
    onViewChange,
    // currentSubView, // Removed
    // onSubViewChange, // Removed
    lastViewedChannelId, // New: Last viewed channel ID
    onViewSpecificChannel, // New: Handler to view specific channel
    trackedChannels, // New: All tracked channels
    onOpenGroupsOverview, // New: Handler to open GroupsOverviewModal
    showNavigation = true,
    minimal = false,
    onRefresh,
    isRefreshing
}) => {
    const [isChannelsDropdownOpen, setIsChannelsDropdownOpen] = useState(false);
    const dropdownTimeoutRef = useRef<number | null>(null); // Ref to store timeout ID

    // Determine the channel with the newest video to use as a fallback for "Channel Details"
    const newestChannel = useMemo(() => {
        if (!trackedChannels || trackedChannels.length === 0) return null;
        return trackedChannels.reduce((newest, channel) => {
            // Filter out channels without newestVideo information or terminated status
            if (!channel.newestVideo?.publishedAt || channel.status === 'terminated') return newest;
            if (!newest.newestVideo?.publishedAt || newest.status === 'terminated') return channel; 

            const newestDate = new Date(newest.newestVideo.publishedAt).getTime();
            const channelDate = new Date(channel.newestVideo.publishedAt).getTime();
            return channelDate > newestDate ? channel : newest;
        }, trackedChannels.find(c => c.newestVideo?.publishedAt && c.status !== 'terminated') || null); // Initialize with first valid channel or null
    }, [trackedChannels]);

    // Determine which channel's dashboard to open when "Channel Details" is clicked
    const channelToViewId = lastViewedChannelId || newestChannel?.id;
    const channelToViewTitle = lastViewedChannelId 
        ? (trackedChannels.find(c => c.id === lastViewedChannelId)?.title || 'Last Viewed Channel')
        : (newestChannel?.title || 'No Channel');

    // Only 'channels' and 'movies' for main navigation
    const navItems: { id: 'channels' | 'movies', label: string, icon: React.ReactNode }[] = [
        { 
            id: 'channels', 
            label: 'Channels', 
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        },
        { 
            id: 'movies', 
            label: 'Movies', 
            icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4" /></svg>
        }
    ];

    // This is now only for the main "Channels" pill click, which navigates to the table of all channels
    const handleChannelNavItemClick = () => { 
        onViewChange('channels'); // Ensure main view is 'channels'
        // onSubViewChange('allChannels'); // Removed, as ChannelsView now defaults to allChannels
        setIsChannelsDropdownOpen(false); // Close dropdown immediately on click
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
    };

    const handleViewChannelDetails = () => {
        if (channelToViewId) {
            onViewSpecificChannel(channelToViewId);
            setIsChannelsDropdownOpen(false); // Close dropdown
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
            }
        }
    };
    
    const handleOpenGroupsOverview = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenGroupsOverview(); // Call the new prop to open the modal
        setIsChannelsDropdownOpen(false); // Close dropdown
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
    };

    const handleMouseEnter = () => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
            dropdownTimeoutRef.current = null;
        }
        setIsChannelsDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        // Set a timeout to close the dropdown after a short delay
        dropdownTimeoutRef.current = setTimeout(() => {
            setIsChannelsDropdownOpen(false);
            dropdownTimeoutRef.current = null;
        }, 200); // 200ms delay
    };

    return (
      <header className={`sticky z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-800 shadow-lg ${minimal ? 'top-0' : 'top-8'}`}>
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          
          {/* Left: Navigation Pills */}
          <div className="flex-1 flex items-center justify-start">
             {!minimal && showNavigation && (
                <nav className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-full border border-gray-700/50 shadow-inner">
                    {navItems.map((item) => {
                        // Special handling for 'channels' to show dropdown on hover
                        if (item.id === 'channels') {
                            return (
                                <div 
                                    key={item.id}
                                    className="relative"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <button
                                        onClick={handleChannelNavItemClick} // Now always defaults to All Channels view
                                        className={`
                                            flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300
                                            ${currentView === item.id
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-y-0' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {item.icon}
                                        {item.label}
                                        <svg className={`w-3 h-3 ml-1 transition-transform ${isChannelsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    {isChannelsDropdownOpen && (
                                        // Ensure the dropdown is directly below the button visually without gaps
                                        <div className="absolute top-full left-0 w-48 bg-[#1e293b] border-2 border-gray-600 rounded-lg shadow-xl overflow-hidden animate-fade-in-down z-40" style={{ marginTop: '10px' }}>
                                            {/* Removed "All Channels" from dropdown as it's the default view when clicking the main pill */}
                                            <button
                                                onClick={handleOpenGroupsOverview} // New handler for Groups Overview Modal
                                                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-2 text-gray-300 hover:bg-indigo-700/30 hover:text-white`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
                                                Groups Overview
                                            </button>
                                            <div className="border-t border-gray-700/50 my-1"></div> {/* Separator */}
                                            <button
                                                onClick={handleViewChannelDetails}
                                                disabled={!channelToViewId}
                                                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-2 
                                                    ${channelToViewId 
                                                        ? 'text-gray-300 hover:bg-indigo-700/30 hover:text-white' 
                                                        : 'text-gray-500 cursor-not-allowed opacity-60'
                                                    }`}
                                                title={channelToViewId ? `View dashboard for ${channelToViewTitle}` : "No channel recently viewed or with new videos to display"}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
                                                Channel Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
                                    ${isActive 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 translate-y-0' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
             )}
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center items-center gap-2 animated-header-element" style={{ animationDelay: '0.1s' }}>
            <YouTubeLogo />
            <h1 className="text-xl font-bold tracking-tight font-sans text-white">
              Youtube <span className="bg-gradient-to-r from-red-500 to-red-600 text-transparent bg-clip-text">TDA Team</span>
            </h1>
          </div>
          
          {/* Right: User Profile & Settings */}
          <div className="flex-1 flex justify-end items-center gap-3">
            {!minimal && (
                <>
                    {/* Refresh Button - Modern Sync Icon */}
                    <button 
                        onClick={onRefresh} 
                        disabled={isRefreshing}
                        className={`
                            relative group
                            text-gray-400 hover:text-white 
                            p-2 rounded-full hover:bg-gray-800 
                            animated-header-element header-button-hover
                            transition-all duration-300
                            ${isRefreshing ? 'text-indigo-400 cursor-not-allowed' : ''}
                        `}
                        style={{ animationDelay: '0.18s' }}
                        aria-label="Refresh Data"
                        title="Sync Latest Data"
                    >
                        <div className={`transition-transform duration-700 ${isRefreshing ? 'animate-spin' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </div>
                    </button>

                    {/* System Settings Button (Cog) */}
                    <button 
                        onClick={onOpenSettings} 
                        className="text-gray-400 hover:text-white transition-all p-2 rounded-full hover:bg-gray-800 animated-header-element header-button-hover"
                        style={{ animationDelay: '0.2s' }}
                        aria-label="Open Settings"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* Account Settings Button */}
                    <button 
                      onClick={onOpenAccount}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 bg-gray-800/50 border border-gray-700/50 hover:border-indigo-500/50 rounded-full transition-all group animated-header-element hover:bg-gray-800"
                      style={{ animationDelay: '0.15s' }}
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-600 group-hover:border-indigo-400 transition-colors bg-gray-900">
                        <img 
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.email}`} 
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-300 group-hover:text-white hidden sm:inline">
                        {profile?.full_name || 'Admin'}
                      </span>
                    </button>
                </>
            )}
          </div>
        </div>
      </header>
    );
};