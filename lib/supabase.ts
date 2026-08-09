import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './storageAdapter';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hfiytwsrjmlhfyvbtzoo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaXl0d3Nyam1saGZ5dmJ0em9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NTQ0MDYsImV4cCI6MjEwMTMzMDQwNn0.ini2GNW7UlDXzQZCjn69K2G5fmroBtve4QpO-I2O7ZU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

