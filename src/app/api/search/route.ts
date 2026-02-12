import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { query, userId, limit = 20, threshold = 0.1 } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Generate embedding for the search query
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(query);
        const queryEmbedding = result.embedding.values;

        console.log(`[Semantic Search] Query: "${query}", Embedding: ${queryEmbedding.length}d, Threshold: ${threshold}`);
        console.log(`[Semantic Search] Using service key: ${!!process.env.SUPABASE_SERVICE_KEY}`);

        // First, check how many assets the user has total
        const { data: totalCheck, count } = await supabase
            .from('assets')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);

        console.log(`[Semantic Search] User has ${count || totalCheck?.length || 0} total assets`);

        // Check how many have embeddings (just count, don't try to select embedding column)
        const { data: embeddingCheck, error: checkError } = await supabase
            .from('assets')
            .select('id')
            .eq('user_id', userId)
            .not('embedding', 'is', null)
            .limit(5);

        if (checkError) {
            console.log(`[Semantic Search] Embedding check error: ${checkError.message}`);
        }
        console.log(`[Semantic Search] Assets with embeddings: ${embeddingCheck?.length || 0}`);

        // Vector similarity search using pgvector
        const { data, error } = await supabase.rpc('match_assets', {
            query_embedding: `[${queryEmbedding.join(',')}]`,  // Format as string for pgvector
            match_threshold: threshold,
            match_count: limit,
            user_id_filter: userId
        });

        if (error) {
            console.error('[Semantic Search] RPC Error:', error);

            // Fallback: If RPC doesn't exist yet, return empty (will use text search)
            if (error.message.includes('function') || error.message.includes('does not exist')) {
                console.log('[Semantic Search] RPC not found, returning empty for fallback');
                return NextResponse.json({
                    results: [],
                    fallback: true,
                    message: 'Semantic search not yet configured. Using text fallback.'
                });
            }

            throw error;
        }

        console.log(`[Semantic Search] Found ${data?.length || 0} results`);

        // If RPC returned 0 but there are assets with embeddings, log for debugging
        if ((!data || data.length === 0) && embeddingCheck && embeddingCheck.length > 0) {
            console.log('[Semantic Search] RPC returned 0 but assets with embeddings exist - threshold may be too high or vector format mismatch');
        }

        return NextResponse.json({
            results: data || [],
            query,
            fallback: false,
            assetsWithEmbeddings: embeddingCheck?.length || 0
        });

    } catch (error: any) {
        console.error("Semantic Search Error:", error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            results: [],
            fallback: true
        }, { status: 500 });
    }
}
