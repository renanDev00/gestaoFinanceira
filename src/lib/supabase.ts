import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// -----------------------------------------------
// Type definitions matching the DB schema
// -----------------------------------------------
export interface DbTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  is_fixed: boolean;
  end_month?: string | null;
  payment_date?: string | null;
  parent_id?: string | null;
  status: 'pending' | 'paid';
  person?: string | null;
  payment_method: 'cash' | 'credit';
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}
