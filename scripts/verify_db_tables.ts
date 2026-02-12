
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual env loading
const envPath = path.resolve(process.cwd(), '.env.local');
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values) {
            env[key.trim()] = values.join('=').trim();
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTables() {
    console.log('Verifying tables...');

    // Check user_profiles
    const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });

    if (profileError) {
        console.error('❌ user_profiles table check failed:', profileError.message);
    } else {
        console.log('✅ user_profiles table exists');
        // Check if there is data
        const { data: allProfiles } = await supabase.from('user_profiles').select('*').limit(5);
        console.log('User Profiles found:', allProfiles?.length);
        if (allProfiles?.length) console.log(allProfiles);
    }

    // Check haven_conversations
    const { data: memories, error: memoryError } = await supabase
        .from('haven_conversations')
        .select('count', { count: 'exact', head: true });

    if (memoryError) {
        console.error('❌ haven_conversations table check failed:', memoryError.message);
    } else {
        console.log('✅ haven_conversations table exists');
        const { data: allMemories } = await supabase.from('haven_conversations').select('*').limit(5);
        console.log('Memories found:', allMemories?.length);
        if (allMemories?.length) console.log(allMemories);
    }
}

verifyTables();
