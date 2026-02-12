import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure variables are present to avoid runtime errors gracefully if possible, 
// though '!' asserts they are.
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Environment Variables!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
