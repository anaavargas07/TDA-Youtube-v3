
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile | null;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<any>;
    onSignOut: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose, profile, onUpdateProfile, onSignOut }) => {
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Shortcut Esc to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (fullName !== profile?.full_name) {
                const { error: profileError } = await onUpdateProfile({ full_name: fullName });
                if (profileError) throw profileError;
            }

            if (newPassword) {
                if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
                const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword });
                if (pwdError) throw pwdError;
            }

            setSuccess('Settings updated successfully!');
            setTimeout(onClose, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={onClose}>
            <div className="bg-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Account Settings</h2>
                        <p className="text-xs text-gray-400 mt-1">{profile?.email}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-8">
                    {/* Profile Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profile</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 shadow-xl bg-gray-900">
                                    <img 
                                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.email}`} 
                                      alt="Profile"
                                      className="w-full h-full object-cover"
                                    />
                                </div>
                                <button type="button" className="absolute bottom-0 right-0 bg-indigo-500 hover:bg-indigo-400 text-white p-1.5 rounded-full border-2 border-[#1e293b] shadow-lg transition-colors">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5">Full Name</label>
                                <input 
                                    type="text" 
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-600 transition-all"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Security</h3>
                        <div className="bg-black/20 p-4 rounded-xl space-y-4 border border-white/5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-[11px] text-center font-bold bg-red-400/10 p-2 rounded-lg">{error}</p>}
                    {success && <p className="text-green-400 text-[11px] text-center font-bold bg-green-400/10 p-2 rounded-lg">{success}</p>}

                    <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                        <div className="flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                        <button 
                            type="button"
                            onClick={() => { onSignOut(); onClose(); }}
                            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-lg text-xs font-bold text-red-400 bg-red-400/5 hover:bg-red-400/10 transition-all border border-red-400/10 mt-4"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
