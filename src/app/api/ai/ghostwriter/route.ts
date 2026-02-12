import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface DecodedPattern {
    structure: string;
    hook: string;
    psychology: string;
    callToAction: string;
}

// Helper to build voice profile injection text
function buildVoicePrompt(voiceProfile?: { samples: string; rules: string }): string {
    if (!voiceProfile) return '';
    const parts: string[] = [];

    if (voiceProfile.samples?.trim()) {
        parts.push(`=== VOICE PROFILE ===
Writing Samples (mimic this exact style, tone, and vocabulary):
${voiceProfile.samples}
`);
    }

    if (voiceProfile.rules?.trim()) {
        parts.push(`Style Rules (follow these strictly):
${voiceProfile.rules}`);
    }

    if (parts.length > 0) {
        parts.push(`
CRITICAL: Match the tone, vocabulary, cadence, and language mixing of the samples above. Follow the style rules strictly.
=== END VOICE PROFILE ===`);
    }

    return parts.join('\n');
}

export async function POST(req: Request) {
    try {
        const { action, content, patterns, nicheContext, voiceProfile } = await req.json();

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const voiceInjection = buildVoicePrompt(voiceProfile);

        if (action === 'DECONSTRUCT') {
            const systemPrompt = `You are an expert content analyst trained in viral content psychology. Your task is to deconstruct high-performing social media posts and extract their underlying patterns.

For each post provided, analyze:
1. **Structure**: The skeleton (e.g., "Hook → Agitation → Solution → CTA", "Contrast Pattern", "Listicle")
2. **Hook**: What makes the first line grab attention (e.g., "Counter-intuitive claim", "Direct challenge", "Curiosity gap")
3. **Psychology**: The emotional trigger being used (e.g., "Fear of missing out", "Identity validation", "Tribal belonging")
4. **Call to Action**: How engagement is prompted (e.g., "Implicit question", "Direct ask", "Open loop")

${nicheContext ? `The user operates in these niches: ${nicheContext}. Consider this context when analyzing.` : ''}

Respond in JSON format:
{
  "patterns": [
    { "structure": "...", "hook": "...", "psychology": "...", "callToAction": "..." }
  ]
}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n---\nPOSTS TO ANALYZE:\n${content}` }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
            });

            const text = result.response.text();
            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid JSON response');

            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ patterns: parsed.patterns });
        }

        if (action === 'GENERATE_TITLES') {
            const patternsDesc = (patterns as DecodedPattern[])
                .map((p, i) => `Pattern ${i + 1}: ${p.structure} | Hook: ${p.hook}`)
                .join('\n');

            const systemPrompt = `You are a viral YouTube title generator. Using the patterns decoded from high-performing content, generate 25 scroll-stopping title options.

DECODED PATTERNS:
${patternsDesc}

${nicheContext ? `NICHE CONTEXT: ${nicheContext}` : ''}

RULES:
1. Each title should use ONE of the decoded patterns as its foundation
2. Titles should be 50-70 characters max
3. Use power words, numbers, and curiosity triggers
4. Avoid clickbait that doesn't deliver
5. Mix formats: questions, how-to, lists, contrarian takes

${voiceInjection}

Output just the titles, numbered 1-25, one per line.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
            });

            return NextResponse.json({ content: result.response.text() });
        }

        if (action === 'GENERATE_DEEP') {
            const patternsDesc = (patterns as DecodedPattern[])
                .map((p, i) => `Pattern ${i + 1}: ${p.structure} | Psychology: ${p.psychology}`)
                .join('\n');

            const systemPrompt = `You are a deep-thought content writer specializing in paradoxes, philosophical quotes, and problem/solution frameworks.

DECODED PATTERNS:
${patternsDesc}

${nicheContext ? `NICHE CONTEXT: ${nicheContext}` : ''}

Generate 10 "deep posts" using these formats:
1. **Paradoxes** (3): Statements that seem contradictory but reveal deeper truths
2. **Original Quotes** (3): Quotable statements that sound like wisdom
3. **Problem/Solution** (4): Short-form posts that identify a pain point and hint at resolution

Each post should be 1-3 sentences, suitable for Twitter/X or LinkedIn.
Format: [TYPE] followed by the post content.

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 2048 }
            });

            return NextResponse.json({ content: result.response.text() });
        }

        if (action === 'GENERATE_IDEAS') {
            const patternsDesc = (patterns as DecodedPattern[])
                .map((p, i) => `Pattern ${i + 1}: ${p.structure} | Hook: ${p.hook} | CTA: ${p.callToAction}`)
                .join('\n');

            const systemPrompt = `You are a content idea generator for a creator who follows the "Dan Koe method" of testing ideas on X before expanding them.

DECODED PATTERNS:
${patternsDesc}

${nicheContext ? `NICHE CONTEXT: ${nicheContext}` : ''}

Generate 60 tweet/post ideas (short 1-2 line summaries of what to write about). These should:
1. Apply the decoded patterns to new topics
2. Cover a mix of: personal stories, contrarian takes, how-to tips, observations, predictions
3. Be specific enough to write from, but not fully written posts
4. Follow the 30% rule: 30% proven formats, 70% experimental angles

Group them into categories:
- Evergreen (15): Topics that work year-round
- Trending (15): Topics related to current cultural moments
- Personal (15): Story-based or opinion-based
- Educational (15): How-to or insight-based

Number each idea within its category.

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
            });

            return NextResponse.json({ content: result.response.text() });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Ghostwriter API error:', error);
        return NextResponse.json({ error: 'Ghostwriter failed' }, { status: 500 });
    }
}

