
import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://ibwnrwxrzqrctqjiikzi.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid25yd3hyenFyY3Rxamlpa3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NjU0OTksImV4cCI6MjA4MTU0MTQ5OX0.Ed8gQOOtoZpcEdbdnKdrbs8bcPtlhqV7vQaEsHhOoHE';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
