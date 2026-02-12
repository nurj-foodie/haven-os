import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export interface HavenMemory {
    id: string;
    userId: string;
    sessionSummary: string;
    keyTopics: string[];
    createdAt: string;
}

// GET - Fetch recent conversation memories
export async function GET(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const userId = req.nextUrl.searchParams.get('userId');
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Fetch recent memories, ordered by most recent
        const { data, error } = await supabase
            .from('haven_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // Transform for frontend
        const memories = (data || []).map(m => ({
            id: m.id,
            sessionSummary: m.session_summary,
            keyTopics: m.key_topics || [],
            createdAt: m.created_at
        }));

        return NextResponse.json({
            success: true,
            memories
        });

    } catch (error: any) {
        console.error('[Haven Memory API] GET Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Store a new conversation memory
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await req.json();

        const { userId, sessionSummary, keyTopics } = body as {
            userId: string;
            sessionSummary: string;
            keyTopics: string[];
        };

        if (!userId || !sessionSummary) {
            return NextResponse.json(
                { error: 'User ID and session summary required' },
                { status: 400 }
            );
        }

        // Store the memory
        const { data, error } = await supabase
            .from('haven_conversations')
            .insert({
                user_id: userId,
                session_summary: sessionSummary,
                key_topics: keyTopics || [],
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            memory: {
                id: data.id,
                sessionSummary: data.session_summary,
                keyTopics: data.key_topics,
                createdAt: data.created_at
            }
        });

    } catch (error: any) {
        console.error('[Haven Memory API] POST Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
