import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

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

// Helper to generate labels for repurposed nodes
function getTransformationLabel(action: string, platform?: string): string {
    switch (action) {
        case 'TWEET_TO_NEWSLETTER':
            return 'Newsletter Version';
        case 'NEWSLETTER_TO_SCRIPT':
            return 'Video Script';
        case 'FORMAT_PLATFORM':
            return platform ? `${platform.charAt(0).toUpperCase() + platform.slice(1)} Post` : 'Formatted Post';
        default:
            return 'Repurposed Content';
    }
}

export async function POST(req: Request) {
    try {
        const { action, content, platform, voiceProfile, sourceNodeId, languageMode } = await req.json();

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const voiceInjection = buildVoicePrompt(voiceProfile);
        const languageInstruction = languageMode === 'MS'
            ? "\n\nCRITICAL: Output MUST be in Bahasa Melayu (Malay) language, but you may use English terms for technical concepts if common."
            : "";

        if (action === 'TWEET_TO_NEWSLETTER') {
            const systemPrompt = `You are an expert content expander specializing in transforming short-form content into long-form newsletters.

Given a tweet or short post, expand it into a full newsletter structured as:

**Subject Line**: A compelling email subject (50 chars max)

**Opening Hook**: 2-3 sentences that grab attention and introduce the topic

**Main Content**: 3-4 paragraphs that:
- Expand on the core idea with examples and stories
- Add depth, nuance, and practical applications
- Include at least one personal anecdote or case study

**Key Takeaway**: A memorable, quotable summary in 1-2 sentences

**Call to Action**: What the reader should do next

Write in a conversational, engaging tone. Avoid fluff—every sentence should add value.

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}${languageInstruction}\n\n---\nORIGINAL TWEET/POST:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            });

            return NextResponse.json({
                content: result.response.text(),
                nodeType: 'noteNode',
                label: getTransformationLabel(action),
                metadata: {
                    sourceNodeId,
                    transformationType: action,
                    timestamp: Date.now()
                }
            });
        }

        if (action === 'NEWSLETTER_TO_SCRIPT') {
            const systemPrompt = `You are a video script writer who transforms written content into engaging spoken-word scripts.

Convert the newsletter/article into a video script with:

**HOOK (0:00-0:15)**
[VISUAL: Description of opening shot]
[AUDIO]: The first words the viewer hears—must stop the scroll

**INTRO (0:15-0:45)**
[VISUAL: Suggested B-roll or graphics]
[AUDIO]: Brief context and why this matters

**MAIN CONTENT (0:45-3:00)**
Break into 3-4 segments, each with:
[VISUAL]: Shot type (talking head, B-roll, text overlay)
[AUDIO]: The spoken words

**CONCLUSION (3:00-3:30)**
[VISUAL: Final shot suggestion
[AUDIO]: Summary and strong close

**CTA (3:30-3:45)**
[VISUAL: Subscribe animation, etc.]
[AUDIO]: Clear call to action

Use short sentences. Write for the ear, not the eye. Include pauses marked with [BEAT] where dramatic effect is needed.

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}${languageInstruction}\n\n---\nNEWSLETTER/ARTICLE:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
            });

            return NextResponse.json({
                content: result.response.text(),
                nodeType: 'noteNode',
                label: getTransformationLabel(action),
                metadata: {
                    sourceNodeId,
                    transformationType: action,
                    timestamp: Date.now()
                }
            });
        }

        if (action === 'FORMAT_PLATFORM') {
            let platformPrompt = '';

            switch (platform) {
                case 'linkedin':
                    platformPrompt = `Reformat this content for LinkedIn:

RULES:
1. Start with a strong hook line (standalone, creates curiosity)
2. Use short paragraphs (1-2 sentences max per paragraph)
3. Add strategic line breaks for readability
4. Include a "⬇️" or similar indicator if it's a longer post
5. End with a question or call-to-engagement
6. Add 3-5 relevant hashtags at the end
7. Optimal length: 1300-1900 characters

TONE: Professional but human, thought-leadership style

${voiceInjection}`;
                    break;

                case 'twitter':
                    platformPrompt = `Convert this content into a Twitter/X thread:

RULES:
1. First tweet must be a standalone hook that works on its own
2. Each tweet: max 280 characters
3. Number format: "1/" or "🧵 1/X"
4. End with a CTA tweet (follow, repost, etc.)
5. Aim for 5-10 tweets total
6. Use line breaks within tweets for rhythm
7. Last tweet should summarize + invite engagement

TONE: Punchy, conversational, high-value

${voiceInjection}`;
                    break;

                case 'instagram':
                    platformPrompt = `Reformat this content for an Instagram carousel caption:

RULES:
1. Attention-grabbing first line (shows in preview)
2. Body: conversational, story-driven, personal
3. Include relevant emojis (strategic, not excessive)
4. End with engagement question
5. Add a line break before hashtags
6. Include 20-30 targeted hashtags (mix of sizes)
7. Optimal length: 800-1500 characters before hashtags

TONE: Authentic, relatable, slightly casual

${voiceInjection}`;
                    break;

                default:
                    return NextResponse.json({ error: 'Invalid platform. Use: linkedin, twitter, or instagram' }, { status: 400 });
            }

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${platformPrompt}${languageInstruction}\n\n---\nORIGINAL CONTENT:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            });

            return NextResponse.json({
                content: result.response.text(),
                nodeType: 'noteNode',
                label: getTransformationLabel(action, platform),
                metadata: {
                    sourceNodeId,
                    transformationType: action,
                    platform,
                    timestamp: Date.now()
                }
            });
        }

        // STEP 3 Transform actions from Writing Processor
        if (action === 'CONTENT_TO_NEWSLETTER') {
            const systemPrompt = `You are an expert content strategist transforming raw content into a polished newsletter.

Given ANY type of content (notes, ideas, documents, rough drafts), transform it into a professional newsletter:

**Subject Line**: A compelling email subject that creates curiosity (50 chars max)

**Opening Hook**: 2-3 sentences that grab attention immediately

**Main Content**: 3-5 paragraphs that:
- Present the core ideas in a clear, logical flow
- Add practical examples and applications
- Include insights the reader can apply immediately

**Key Takeaway**: 1-2 memorable sentences summarizing the value

**Call to Action**: What the reader should do next

Write in a conversational, engaging tone. Every sentence should add value.

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}${languageInstruction}\n\n---\nSOURCE CONTENT:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2500 }
            });

            return NextResponse.json({
                content: result.response.text(),
                label: 'Newsletter',
                metadata: { transformationType: action, timestamp: Date.now() }
            });
        }

        if (action === 'CONTENT_TO_THREAD') {
            const systemPrompt = `You are a viral thread writer transforming content into engaging social media threads.

Given ANY content, create a Twitter/X style thread:

**Thread Structure:**
1/ HOOK - A standalone opening that stops the scroll. Make it provocative, curious, or valuable.

2/-X/ BODY - Break the content into bite-sized tweets:
- Each tweet: max 280 characters
- One idea per tweet
- Use line breaks for rhythm
- Include specific examples and numbers

X/ SUMMARY - Recap the key points

FINAL/ CTA - Engage the reader (follow, repost, save, etc.)

RULES:
- Aim for 6-10 tweets
- Number format: "1/" through "10/"
- First tweet MUST work as a standalone post
- Be punchy, conversational, high-value

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}${languageInstruction}\n\n---\nSOURCE CONTENT:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
            });

            return NextResponse.json({
                content: result.response.text(),
                label: 'Thread',
                metadata: { transformationType: action, timestamp: Date.now() }
            });
        }

        if (action === 'CONTENT_TO_SCRIPT') {
            const systemPrompt = `You are a video script writer transforming content into engaging spoken-word scripts.

Given ANY content, create a video script suitable for short-form video (TikTok/Reels/Shorts):

**SCRIPT FORMAT:**

[HOOK - First 3 seconds]
The opening line that stops the scroll. Direct to camera.

[CONTEXT - 5-10 seconds]  
Brief setup. Why this matters.

[MAIN CONTENT - 30-45 seconds]
3-4 key points delivered in a punchy, conversational style:
- Point 1: [Spoken words]
- Point 2: [Spoken words]
- Point 3: [Spoken words]

[CLOSE - 5 seconds]
Strong finish or quick recap.

[CTA]
What you want viewers to do.

RULES:
- Write for the EAR, not the eye
- Use short, punchy sentences
- Include [BEAT] for dramatic pauses
- Total script: 60-90 seconds when spoken
- Be energetic and engaging

${voiceInjection}`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}${languageInstruction}\n\n---\nSOURCE CONTENT:\n${content}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
            });

            return NextResponse.json({
                content: result.response.text(),
                label: 'Script',
                metadata: { transformationType: action, timestamp: Date.now() }
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Repurpose API error:', error);
        return NextResponse.json({ error: 'Repurposing failed' }, { status: 500 });
    }
}

