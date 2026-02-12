import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { text, targetLanguage } = await req.json();

        if (!text || !targetLanguage) {
            return NextResponse.json(
                { error: 'Missing required fields: text, targetLanguage' },
                { status: 400 }
            );
        }

        const langName = targetLanguage === 'ms' ? 'Bahasa Malaysia' : 'English';
        const sourceLang = targetLanguage === 'ms' ? 'English' : 'Bahasa Malaysia';

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const systemPrompt = `You are a professional translator fluent in both English and Bahasa Malaysia. 
Your task is to translate the given text from ${sourceLang} to ${langName}.

CRITICAL RULES:
1. Translate naturally, NOT word-for-word. The output should sound like a native speaker wrote it.
2. For Bahasa Malaysia: Use standard formal BM unless the input is clearly informal/colloquial.
3. Maintain the original tone (formal, casual, professional, humorous).
4. Preserve any formatting (bullet points, line breaks, headers).
5. If the text contains technical terms, keep them in English if that's how they're commonly used.
6. DO NOT add explanations or notes. Output ONLY the translated text.`;

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n---\nTEXT TO TRANSLATE:\n${text}` }]
                }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
            }
        });

        const translatedText = result.response.text().trim();

        return NextResponse.json({ translatedText });
    } catch (error) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            { error: 'Translation failed' },
            { status: 500 }
        );
    }
}
