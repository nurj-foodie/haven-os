import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { assetId, scheduledAt, publicationStatus } = body;

        if (!assetId) {
            return NextResponse.json({ error: 'Missing assetId' }, { status: 400 });
        }

        const updateData: any = {
            publication_status: publicationStatus || 'draft'
        };

        if (scheduledAt) {
            updateData.scheduled_at = new Date(scheduledAt).toISOString();
        } else {
            updateData.scheduled_at = null;
        }

        const { data, error } = await supabase
            .from('assets')
            .update(updateData)
            .eq('id', assetId)
            .select()
            .single();

        if (error) {
            console.error('Schedule update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, asset: data });
    } catch (error: any) {
        console.error('Schedule API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Fetch scheduled content for calendar view
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = supabase
            .from('assets')
            .select('*')
            .not('scheduled_at', 'is', null)
            .order('scheduled_at', { ascending: true });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (startDate) {
            query = query.gte('scheduled_at', startDate);
        }

        if (endDate) {
            query = query.lte('scheduled_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Schedule fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ scheduledAssets: data || [] });
    } catch (error: any) {
        console.error('Schedule GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
