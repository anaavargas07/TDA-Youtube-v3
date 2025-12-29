
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
    onClose?: () => void;
    showCloseButton?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onClose, showCloseButton = true }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin'); // 'signin' or 'signup'
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Shortcut Esc to close if close button is shown
  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && showCloseButton && onClose) onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [showCloseButton, onClose]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = activeTab === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      if (activeTab === 'signup') {
        setMessage({ text: 'Check your email for the confirmation link!', type: 'success' });
      } else {
          // Sign in successful, modal will close via parent state update on auth change
      }
    }
    setLoading(false);
  };

  const LogoIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-red-600 blur-[20px] opacity-20 rounded-full"></div>
        
        {/* Icon */}
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#FF0000] relative z-10 filter drop-shadow-md" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[#1e293b] w-full max-w-[400px] rounded-2xl shadow-2xl relative overflow-hidden border border-gray-700">
            {/* Close Button */}
            {showCloseButton && onClose && (
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            <div className="p-8 flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-4 animate-float-slow">
                    <LogoIcon />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1 text-center">
                    Youtube <span className="bg-gradient-to-r from-red-500 to-red-600 text-transparent bg-clip-text">TDA Team</span>
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                    Sign in to manage your tasks.
                </p>

                {/* Tabs */}
                <div className="flex w-full border-b border-gray-700 mb-6">
                    <button
                        onClick={() => { setActiveTab('signin'); setMessage(null); }}
                        className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                            activeTab === 'signin' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Sign In
                        {activeTab === 'signin' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('signup'); setMessage(null); }}
                        className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                            activeTab === 'signup' ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        Sign Up
                        {activeTab === 'signup' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                        )}
                    </button>
                </div>

                {message && (
                    <div className={`w-full p-3 rounded-lg mb-4 text-xs text-center font-medium ${message.type === 'success' ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-red-900/20 text-red-400 border border-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAuth} className="w-full space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-[#334155] border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-white placeholder-gray-500 outline-none text-sm transition-all"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#334155] border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-white placeholder-gray-500 outline-none text-sm transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-red-900/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Processing...
                            </span>
                        ) : (activeTab === 'signin' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};
