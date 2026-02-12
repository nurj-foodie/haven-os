import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Archive items older than 30 days
        const { data: staleItems, error: fetchError } = await supabase
            .from('staging_items')
            .select('*')
            .eq('is_categorized', false)
            .lt('created_at', thirtyDaysAgo.toISOString())
            .neq('lifecycle_state', 'archived');

        if (fetchError) throw fetchError;

        if (staleItems && staleItems.length > 0) {
            // Move to archived_items table
            const archivedRecords = staleItems.map(item => ({
                user_id: item.user_id,
                original_staging_id: item.id,
                type: item.type,
                content: item.content,
                asset_id: item.asset_id,
                metadata: item.metadata,
                created_at: item.created_at,
            }));

            const { error: insertError } = await supabase
                .from('archived_items')
                .insert(archivedRecords);

            if (insertError) throw insertError;

            // Update staging items to archived state
            const staleIds = staleItems.map(i => i.id);
            const { error: updateError } = await supabase
                .from('staging_items')
                .update({
                    lifecycle_state: 'archived',
                    archived_at: now.toISOString()
                })
                .in('id', staleIds);

            if (updateError) throw updateError;
        }

        // 2. Mark items 7-30 days old as "aging"
        const { error: agingError } = await supabase
            .from('staging_items')
            .update({ lifecycle_state: 'aging' })
            .eq('is_categorized', false)
            .lt('created_at', sevenDaysAgo.toISOString())
            .gte('created_at', thirtyDaysAgo.toISOString())
            .eq('lifecycle_state', 'fresh');

        if (agingError) throw agingError;

        return NextResponse.json({
            success: true,
            archived: staleItems?.length || 0,
            message: 'Lifecycle sync complete'
        });

    } catch (error: any) {
        console.error('[Lifecycle API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
