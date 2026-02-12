import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Format configurations with target durations
const FORMAT_CONFIGS: Record<string, { minDuration: number; maxDuration: number; hookTime: number }> = {
    'tiktok': { minDuration: 15, maxDuration: 60, hookTime: 2 },
    'reel': { minDuration: 30, maxDuration: 90, hookTime: 3 },
    'youtube-short': { minDuration: 30, maxDuration: 60, hookTime: 3 },
    'youtube-long': { minDuration: 480, maxDuration: 900, hookTime: 30 },
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            topic,
            format = 'tiktok',
            hookType = 'question',
            voiceStyle = 'casual',
            customVoice,
            sourceContext
        } = body;

        const formatConfig = FORMAT_CONFIGS[format] || FORMAT_CONFIGS['tiktok'];
        const voiceDescription = voiceStyle === 'custom' && customVoice
            ? customVoice
            : voiceStyle;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a viral content scriptwriter specializing in short-form video. Create a complete video script.

**Topic:** ${topic}

**Format:** ${format} (Target duration: ${formatConfig.minDuration}-${formatConfig.maxDuration} seconds)

**Hook Style:** ${hookType}
- question: Start with a thought-provoking question
- statement: Bold, attention-grabbing statement
- story: Quick personal anecdote or story opener
- shock: Surprising fact or controversial take

**Voice Style:** ${voiceDescription}

${sourceContext ? `**Context from connected notes:**\n${sourceContext}\n` : ''}

Generate a complete script with the following JSON structure:
{
    "hook": "The opening hook line (${formatConfig.hookTime} seconds, must grab attention immediately)",
    "contentBlocks": [
        {
            "id": "block-1",
            "type": "talking-point|story|example|transition",
            "content": "The actual script text for this section",
            "duration": <estimated seconds>
        }
    ],
    "cta": "The call-to-action line",
    "scenes": [
        {
            "id": "scene-1",
            "shotType": "a-roll|b-roll|text-overlay|transition",
            "description": "What happens visually in this scene",
            "duration": <seconds>
        }
    ],
    "estimatedDuration": <total seconds>
}

Guidelines for ${format}:
${format === 'tiktok' || format === 'reel' ? `
- Hook must be under 3 seconds and extremely punchy
- Total script should fit ${formatConfig.minDuration}-${formatConfig.maxDuration} seconds
- Include at least 2 B-roll or text overlay suggestions
- End with a strong CTA or loop point
- Keep energy high throughout
- Use conversational, relatable language
` : `
- Hook can be up to ${formatConfig.hookTime} seconds
- Build a complete narrative arc
- Include scene transitions
- Vary shot types for visual interest
`}

Voice style "${voiceDescription}" means:
${voiceStyle === 'casual' ? '- Use "you" and "I", contractions, simple words, like talking to a friend' : ''}
${voiceStyle === 'professional' ? '- Confident, authoritative, polished language, no filler words' : ''}
${voiceStyle === 'energetic' ? '- Exclamation points! Short punchy sentences. High energy throughout!' : ''}
${voiceStyle === 'custom' ? `- Match this style exactly: ${customVoice}` : ''}

Return ONLY valid JSON, no markdown or explanation.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        let scriptData;
        try {
            // Clean the response in case it has markdown code blocks
            const cleanedResponse = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            scriptData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse script response:', responseText);
            // Return a fallback structure
            scriptData = {
                hook: `Here's something about ${topic} you need to know...`,
                contentBlocks: [
                    {
                        id: 'block-1',
                        type: 'talking-point',
                        content: `Key insight about ${topic}`,
                        duration: 15
                    }
                ],
                cta: 'Follow for more!',
                scenes: [
                    { id: 'scene-1', shotType: 'a-roll', description: 'Talking to camera', duration: 5 },
                    { id: 'scene-2', shotType: 'b-roll', description: 'Supporting footage', duration: 10 },
                    { id: 'scene-3', shotType: 'a-roll', description: 'CTA delivery', duration: 5 },
                ],
                estimatedDuration: 20
            };
        }

        return NextResponse.json(scriptData);
    } catch (error) {
        console.error('Script generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate script' },
            { status: 500 }
        );
    }
}
