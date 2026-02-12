import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { originalCopy, product, platform, style } = await req.json();

        if (!originalCopy) {
            return NextResponse.json({ error: 'Original copy required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are an expert A/B testing copywriter. Create an alternative version of this marketing copy that tests a different approach.

Original Copy:
"""
${originalCopy}
"""

${product ? `Product/Topic: ${product}` : ''}
${platform ? `Platform: ${platform}` : ''}
${style ? `Style preference: ${style}` : ''}

Create ONE alternative version that:
1. Keeps the same core message but uses a different angle or hook
2. Tests a different emotional trigger or call-to-action
3. Maintains similar length

Return ONLY the alternative copy, no explanations or markdown.`;

        const genResult = await model.generateContent(prompt);
        const genResponse = await genResult.response;
        const variant = genResponse.text().trim();

        return NextResponse.json({
            success: true,
            variant,
            testName: `Variant ${Date.now().toString().slice(-4)}`
        });

    } catch (error: any) {
        console.error('[A/B Variant API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
