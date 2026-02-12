import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { text, returnEmbedding = true } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
        }

        // Use Gemini text-embedding-004 (stable, 768 dimensions)
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        console.log(`[Embed] Generating embedding for: "${text.substring(0, 50)}..."`);

        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        console.log(`[Embed] Generated ${embedding.length}-dimensional vector`);

        if (returnEmbedding) {
            return NextResponse.json({
                embedding,
                dimensions: embedding.length
            });
        } else {
            return NextResponse.json({ success: true, dimensions: embedding.length });
        }

    } catch (error: any) {
        console.error("Embedding API Error:", error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
