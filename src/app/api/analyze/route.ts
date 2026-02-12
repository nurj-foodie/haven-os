import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { imageUrl, userPrompt } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
        }

        // Initialize Model (Using specific version)
        const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

        // Fetch the image
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Convert to base64
        const base64String = Buffer.from(arrayBuffer).toString('base64');

        const prompt = userPrompt || "Analyze this image and describe what you see.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64String,
                    mimeType: contentType,
                },
            },
        ]);

        const text = result.response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
