import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
    try {
        const { query, userId } = await req.json();

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Search vault items using full-text search
        const { data, error } = await supabase
            .from('vault_items')
            .select('id, title, summary, category, asset_type, created_at')
            .eq('user_id', userId)
            .or(`title.ilike.%${query}%, summary.ilike.%${query}%, tags.cs.{${query}}`)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Vault search error:', error);
            return NextResponse.json({ error: 'Vault search failed' }, { status: 500 });
        }

        // Also get the content/URL for each item
        const assetsWithContent = await Promise.all(
            (data || []).map(async (item) => {
                // Get the actual asset data
                const { data: assetData } = await supabase
                    .from('vault_items')
                    .select('url, file_url')
                    .eq('id', item.id)
                    .single();

                return {
                    ...item,
                    preview: item.summary || 'No summary available',
                    url: assetData?.url || assetData?.file_url || null
                };
            })
        );

        return NextResponse.json({ assets: assetsWithContent });

    } catch (error) {
        console.error('Vault search error:', error);
        return NextResponse.json({ error: 'Vault search failed' }, { status: 500 });
    }
}
