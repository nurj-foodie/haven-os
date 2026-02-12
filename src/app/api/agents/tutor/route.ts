import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { action, context, userPrompt, history } = await req.json();

        if (!context) {
            return NextResponse.json(
                { success: false, error: 'No context provided for the tutor' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let systemInstruction = `You are a world-class AI Tutor engaged in a "Deep Dive" study session with a student.
    
    YOUR GOAL:
    Help the student deeply internalize and master the concepts in the provided Course Material.
    
    YOUR BEHAVIOR:
    1. **Explain Clearly**: Use simple language, analogies, and examples.
    2. **Be Socratic**: Occasionally ask checking questions to ensure the user understands ("Does that make sense?", "Can you explain that back to me?").
    3. **Stay Grounded**: Base your answers on the provided Context, but feel free to bring in outside knowledge to clarify definitions or give examples.
    4. **Encourage**: Be positive and supportive. Learning is hard!
    5. **Format**: Use Markdown (bold, lists) to make explanations readable.
    
    COURSE MATERIAL CONTEXT:
    ${context}
    
    PREVIOUS CONVERSATION:
    ${history ? history.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') : 'None'}
    `;

        // Handle specific actions if needed, otherwise default to chat
        if (action === 'quiz_me') {
            systemInstruction += `\n\nThe user wants to be quizzed. Ask a single thought-provoking question based on the material. Wait for their answer.`;
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { role: 'model', parts: [{ text: systemInstruction }] },
        });

        const text = result.response.text();

        return NextResponse.json({
            success: true,
            reply: text
        });

    } catch (error: any) {
        console.error('[Tutor Agent] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
