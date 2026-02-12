import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export interface UserProfile {
    name: string;
    role: string;        // e.g., "Content Creator", "Entrepreneur", "Marketer"
    industry: string;    // e.g., "Personal Development", "Tech", "Finance"
    goals: string;       // e.g., "Build thought leadership", "Grow audience"
    writingStyle: string; // e.g., "Casual", "Professional", "Storyteller"
    languages: string[]; // e.g., ["English", "Bahasa Malaysia"]
}

// GET - Fetch user profile
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user from auth header or cookie
        const authHeader = req.headers.get('authorization');
        const userId = req.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Fetch from user_profiles table
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return NextResponse.json({
            success: true,
            profile: data || null
        });

    } catch (error: any) {
        console.error('[User Profile API] GET Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Save/update user profile
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();

        const { userId, profile } = body as { userId: string; profile: UserProfile };

        if (!userId || !profile) {
            return NextResponse.json(
                { error: 'User ID and profile data required' },
                { status: 400 }
            );
        }

        // Upsert profile
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                name: profile.name,
                role: profile.role,
                industry: profile.industry,
                goals: profile.goals,
                writing_style: profile.writingStyle,
                languages: profile.languages,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            profile: data
        });

    } catch (error: any) {
        console.error('[User Profile API] POST Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
