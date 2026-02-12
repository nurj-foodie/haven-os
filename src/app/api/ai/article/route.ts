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

// Helper to build source context injection
function buildSourceContext(sourceMode: string, canvasContext?: string, vaultAssets?: any[], webSources?: any[]) {
    const parts: string[] = [];

    // Multi-source mode: combine all available sources
    if (sourceMode === 'multi' || canvasContext) {
        if (canvasContext) {
            parts.push(`=== SOURCE: CANVAS CONTEXT ===`);
            parts.push(canvasContext);
            parts.push(`=== END CANVAS CONTEXT ===`);
        }
    }

    if (sourceMode === 'multi' || vaultAssets?.length) {
        if (vaultAssets && vaultAssets.length > 0) {
            parts.push(`=== SOURCE: VAULT ASSETS ===`);
            vaultAssets.forEach((asset, i) => {
                parts.push(`\n[Asset ${i + 1}] ${asset.title}
Category: ${asset.category}
${asset.preview || asset.summary || ''}`);
            });
            parts.push(`\nUse the above vault assets as references for this article.
=== END VAULT ASSETS ===`);
        }
    }

    if (sourceMode === 'multi' || webSources?.length) {
        if (webSources && webSources.length > 0) {
            parts.push(`=== SOURCE: WEB RESEARCH ===`);
            webSources.forEach((source, i) => {
                parts.push(`\n[${i + 1}] ${source.title}
URL: ${source.url}
${source.snippet || source.content || ''}`);
            });
            parts.push(`\nUse the above web sources as references. IMPORTANT: Add citations [1], [2], etc. when referencing these sources.
=== END WEB RESEARCH ===`);
        }
    }

    return parts.join('\n');
}

export async function POST(req: Request) {
    try {
        const {
            action,
            topic,
            template,
            section,
            context,
            content,
            voiceProfile,
            sourceMode,
            canvasContext,
            vaultAssets,
            webSources
        } = await req.json();

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const voiceInjection = buildVoicePrompt(voiceProfile);
        const sourceInjection = buildSourceContext(sourceMode, canvasContext, vaultAssets, webSources);

        if (action === 'GENERATE_OUTLINE') {
            if (!topic || !template) {
                return NextResponse.json({ error: 'Topic and template are required' }, { status: 400 });
            }

            let templatePrompt = '';
            switch (template) {
                case 'how-to':
                    templatePrompt = `Generate a detailed outline for a HOW-TO GUIDE article about: "${topic}"

${sourceInjection}

Structure:
1. **Problem Statement**: What challenge does this solve? (2-3 sentences)
2. **Solution Overview**: High-level approach (1 paragraph)
3. **Step-by-Step Guide**: 5-7 actionable steps (each with a clear heading)
4. **Common Pitfalls**: 2-3 things to avoid
5. **Conclusion**: Summary + next steps

Format as JSON:
{
  "title": "...",
  "sections": [
    { "heading": "Problem Statement", "brief": "..." },
    ...
  ]
}`;
                    break;

                case 'thought-leadership':
                    templatePrompt = `Generate a detailed outline for a THOUGHT LEADERSHIP article about: "${topic}"

${sourceInjection}

Structure:
1. **Hook**: A provocative opening statement or question
2. **Core Thesis**: Your unique perspective (bold claim)
3. **Supporting Evidence**: 3-4 key arguments with examples
4. **Counterarguments**: Address objections
5. **Vision**: Where this leads, future implications
6. **Call to Action**: What readers should do

Format as JSON:
{
  "title": "...",
  "sections": [
    { "heading": "Hook", "brief": "..." },
    ...
  ]
}`;
                    break;

                case 'case-study':
                    templatePrompt = `Generate a detailed outline for a CASE STUDY article about: "${topic}"

${sourceInjection}

Structure:
1. **Background**: Context and initial situation
2. **Challenge**: What was the problem?
3. **Approach**: Strategy and tactics used
4. **Results**: Quantifiable outcomes (metrics, impact)
5. **Lessons Learned**: Key takeaways
6. **Recommendations**: What others should do

Format as JSON:
{
  "title": "...",
  "sections": [
    { "heading": "Background", "brief": "..." },
    ...
  ]
}`;
                    break;

                case 'listicle':
                    templatePrompt = `Generate a detailed outline for a LISTICLE article about: "${topic}"

${sourceInjection}

Structure:
1. **Introduction**: Why this list matters (hook + context)
2. **Main Points**: 7-10 numbered items (each with a catchy subheading)
3. **Conclusion**: Tie it all together + CTA

Format as JSON:
{
  "title": "...",
  "sections": [
    { "heading": "Introduction", "brief": "..." },
    { "heading": "Point 1: [Subheading]", "brief": "..." },
    ...
    { "heading": "Conclusion", "brief": "..." }
  ]
}`;
                    break;

                default:
                    return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
            }

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: templatePrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            });

            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid JSON response');

            const outline = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ outline });
        }

        if (action === 'EXPAND_SECTION') {
            if (!section || !context) {
                return NextResponse.json({ error: 'Section and context are required' }, { status: 400 });
            }

            const systemPrompt = `You are an expert long-form content writer. Expand the following section into a full, polished paragraph or section.

CONTEXT (full article outline):
${context}

SECTION TO EXPAND:
Heading: ${section.heading}
Brief: ${section.brief}

${voiceInjection}

RULES:
- Write 2-4 paragraphs (150-300 words)
- Use engaging, clear language
- Include concrete examples or analogies
- Maintain flow and transitions
- Output ONLY the expanded content, no preamble`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            });

            return NextResponse.json({ content: result.response.text() });
        }

        if (action === 'POLISH_ARTICLE') {
            if (!content) {
                return NextResponse.json({ error: 'Content is required' }, { status: 400 });
            }

            const systemPrompt = `You are an expert editor. Polish this article to improve:
- Flow and transitions between sections
- Clarity and conciseness
- Engagement and readability
- Grammar and style

${voiceInjection}

ARTICLE:
${content}

Output the polished version ONLY, no preamble.`;

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
            });

            return NextResponse.json({ content: result.response.text() });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Article API error:', error);
        return NextResponse.json({ error: 'Article generation failed' }, { status: 500 });
    }
}
