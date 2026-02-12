import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { scriptContent, userId } = await req.json();

        if (!scriptContent || !userId) {
            return NextResponse.json({ error: 'Script content and userId required' }, { status: 400 });
        }

        // Step 1: Use AI to extract keywords and visual concepts from script
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const extractPrompt = `Analyze this video script and extract 5-10 keywords that would make good B-roll footage searches.
Focus on:
- Visual nouns (objects, places, people types)
- Actions being described
- Emotional tones that could be shown visually
- Settings or environments mentioned

Script:
"""
${scriptContent.substring(0, 2000)}
"""

Return ONLY a JSON array of keywords, nothing else. Example: ["laptop", "typing", "office", "success", "celebration"]`;

        const genResult = await model.generateContent(extractPrompt);
        const genResponse = await genResult.response;
        const keywordsText = genResponse.text() || '[]';

        // Parse keywords from AI response
        let keywords: string[] = [];
        try {
            const jsonMatch = keywordsText.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                keywords = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            keywords = ['video', 'footage', 'content'];
        }

        // Step 2: Search Vault for matching assets
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get user's assets
        const { data: assets, error } = await supabase
            .from('user_assets')
            .select('id, filename, type, url, created_at')
            .eq('user_id', userId)
            .in('type', ['image', 'video'])
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // Step 3: Score and rank assets by keyword relevance
        const suggestions = (assets || []).map(asset => {
            const filename = asset.filename.toLowerCase();
            const matchedKeywords = keywords.filter(kw =>
                filename.includes(kw.toLowerCase())
            );
            return {
                ...asset,
                relevanceScore: matchedKeywords.length,
                matchedKeywords
            };
        });

        // Sort by relevance, then recency
        suggestions.sort((a, b) => {
            if (b.relevanceScore !== a.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Return top suggestions plus keywords for reference
        return NextResponse.json({
            success: true,
            keywords,
            suggestions: suggestions.slice(0, 12).map(s => ({
                id: s.id,
                filename: s.filename,
                type: s.type,
                url: s.url,
                relevanceScore: s.relevanceScore,
                matchedKeywords: s.matchedKeywords
            }))
        });

    } catch (error: any) {
        console.error('[B-Roll API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
