import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// POST: Backfill embeddings for assets that don't have them
export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Get assets without embeddings
        const { data: assets, error: fetchError } = await supabase
            .from('assets')
            .select('id, filename, type, metadata')
            .eq('user_id', userId)
            .is('embedding', null);

        if (fetchError) throw fetchError;

        console.log(`[Backfill] Found ${assets?.length || 0} assets without embeddings`);

        if (!assets || assets.length === 0) {
            return NextResponse.json({
                message: 'No assets need backfilling',
                processed: 0
            });
        }

        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        let processed = 0;
        let failed = 0;

        for (const asset of assets) {
            try {
                // Create searchable text from asset data
                const searchableText = [
                    asset.filename || '',
                    asset.metadata?.title || '',
                    asset.metadata?.summary || '',
                    (asset.metadata?.tags || []).join(' '),
                    asset.metadata?.raw_content || ''
                ].filter(Boolean).join(' ').substring(0, 2000);

                if (searchableText.trim().length < 3) {
                    console.log(`[Backfill] Skipping ${asset.id}: not enough text`);
                    continue;
                }

                // Generate embedding
                const result = await model.embedContent(searchableText);
                const embedding = result.embedding.values;

                // Update asset with embedding (convert to pgvector string format)
                const { error: updateError } = await supabase
                    .from('assets')
                    .update({ embedding: `[${embedding.join(',')}]` })
                    .eq('id', asset.id);

                if (updateError) {
                    console.error(`[Backfill] Failed to update ${asset.id}:`, updateError);
                    failed++;
                } else {
                    console.log(`[Backfill] Updated ${asset.id} (${asset.filename})`);
                    processed++;
                }
            } catch (embedError) {
                console.error(`[Backfill] Failed to embed ${asset.id}:`, embedError);
                failed++;
            }
        }

        return NextResponse.json({
            message: `Backfill complete`,
            processed,
            failed,
            total: assets.length
        });

    } catch (error: any) {
        console.error("Backfill Error:", error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
