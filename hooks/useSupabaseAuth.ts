
import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../types';

export const useSupabaseAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist, create one
                const newProfile: UserProfile = {
                    id: userId,
                    email: email,
                    full_name: email.split('@')[0],
                    role: email === '1@q' ? 'admin' : 'user'
                };
                // We use upsert to be safe
                await supabase.from('profiles').upsert([newProfile]);
                setProfile(newProfile);
            } else if (data) {
                setProfile(data as UserProfile);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured) { setLoading(false); return; }
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfile(session.user.id, session.user.email || '');
            } else {
                setProfile(null);
            }
        });

        return () => subscription?.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!session?.user) return;
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);
        
        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        }
        return { error };
    };

    return { session, profile, loading, handleSignOut, updateProfile };
};
