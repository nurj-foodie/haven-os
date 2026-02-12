import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Visual style configurations
const STYLE_CONFIGS: Record<string, { description: string; keyElements: string[] }> = {
    'cinematic': {
        description: 'Film-like compositions with dramatic lighting, shallow depth of field, and cinematic color grading',
        keyElements: ['rule of thirds', 'leading lines', 'dramatic shadows', 'bokeh backgrounds', 'warm/cool contrast']
    },
    'minimalist': {
        description: 'Clean, simple visuals with lots of negative space and focused subjects',
        keyElements: ['negative space', 'single subject focus', 'muted colors', 'geometric simplicity', 'clean backgrounds']
    },
    'dynamic': {
        description: 'High-energy visuals with movement, action, and dynamic angles',
        keyElements: ['dutch angles', 'motion blur', 'bold colors', 'quick cuts suggested', 'action framing']
    },
    'hand-drawn': {
        description: 'Illustrated, artistic look with sketch-like qualities',
        keyElements: ['illustrated overlays', 'hand-drawn arrows', 'sketch borders', 'doodle elements', 'paper textures']
    },
    'corporate': {
        description: 'Professional, polished look suitable for business content',
        keyElements: ['symmetrical framing', 'branded colors', 'clean typography', 'professional lighting', 'formal composition']
    },
};

interface ScriptContent {
    hook?: string;
    contentBlocks?: Array<{ content: string; type: string; duration: number }>;
    scenes?: Array<{ shotType: string; description: string; duration: number }>;
    cta?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            visualStyle = 'cinematic',
            scriptContent,
            nodeLabel
        } = body as { visualStyle: string; scriptContent: ScriptContent; nodeLabel?: string };

        const styleConfig = STYLE_CONFIGS[visualStyle] || STYLE_CONFIGS['cinematic'];

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build script context
        const scriptContext = [
            scriptContent.hook ? `HOOK: ${scriptContent.hook}` : '',
            scriptContent.contentBlocks?.length
                ? `CONTENT:\n${scriptContent.contentBlocks.map(b => `- [${b.type}] ${b.content}`).join('\n')}`
                : '',
            scriptContent.cta ? `CTA: ${scriptContent.cta}` : '',
        ].filter(Boolean).join('\n\n');

        const existingScenes = scriptContent.scenes || [];

        const prompt = `You are a professional video storyboard artist. Create a detailed visual storyboard based on the script provided.

**Project:** ${nodeLabel || 'Video Storyboard'}

**Visual Style:** ${visualStyle.toUpperCase()}
${styleConfig.description}
Key visual elements to incorporate: ${styleConfig.keyElements.join(', ')}

**Script Content:**
${scriptContext || 'No script content provided - create a general storyboard structure'}

${existingScenes.length > 0 ? `
**Existing Scene Structure (enhance these):**
${existingScenes.map((s, i) => `${i + 1}. [${s.shotType}] ${s.description} (${s.duration}s)`).join('\n')}
` : ''}

Create a detailed storyboard with enhanced visual descriptions. Return JSON:
{
    "scenes": [
        {
            "id": "scene-1",
            "sceneNumber": 1,
            "shotType": "a-roll|b-roll|text-overlay|transition",
            "framing": "wide|medium|close-up|extreme-close-up",
            "cameraMovement": "static|pan|zoom|dolly|tilt",
            "description": "What happens in this scene (action/dialogue)",
            "visualComposition": "Detailed visual description: lighting, colors, elements in frame, mood, ${styleConfig.keyElements.slice(0, 2).join(', ')}",
            "textOverlay": "Any on-screen text (optional, null if none)",
            "duration": <seconds>,
            "referenceKeywords": ["keyword1", "keyword2", "keyword3"]
        }
    ],
    "totalDuration": <total seconds>
}

Guidelines:
1. Each scene should have rich visual composition details matching the ${visualStyle} style
2. Use varied framing (WS, MS, CU, ECU) for visual interest
3. Include camera movements where they enhance storytelling
4. referenceKeywords should be search terms for finding similar reference images
5. Typically 4-8 scenes for short-form, 10-20 for long-form
6. Text overlays only where they add value (hooks, key points, CTAs)
7. Ensure scene durations total the expected video length

Return ONLY valid JSON, no markdown or explanation.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        let storyboardData;
        try {
            const cleanedResponse = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            storyboardData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse storyboard response:', responseText);
            // Return a fallback structure based on existing scenes or defaults
            storyboardData = {
                scenes: existingScenes.length > 0
                    ? existingScenes.map((s, i) => ({
                        id: `scene-${i + 1}`,
                        sceneNumber: i + 1,
                        shotType: s.shotType || 'a-roll',
                        framing: 'medium',
                        cameraMovement: 'static',
                        description: s.description || 'Scene description',
                        visualComposition: `${styleConfig.keyElements[0]} with ${styleConfig.keyElements[1]}`,
                        textOverlay: null,
                        duration: s.duration || 5,
                        referenceKeywords: ['video', 'scene', visualStyle]
                    }))
                    : [
                        {
                            id: 'scene-1',
                            sceneNumber: 1,
                            shotType: 'a-roll',
                            framing: 'medium',
                            cameraMovement: 'static',
                            description: 'Opening hook - attention grabber',
                            visualComposition: 'Subject centered, warm lighting, engaging eye contact',
                            duration: 3,
                            referenceKeywords: ['talking head', 'hook', 'opening']
                        },
                        {
                            id: 'scene-2',
                            sceneNumber: 2,
                            shotType: 'b-roll',
                            framing: 'wide',
                            cameraMovement: 'pan',
                            description: 'Establishing context',
                            visualComposition: 'Cinematic establishing shot with ambient lighting',
                            duration: 5,
                            referenceKeywords: ['b-roll', 'establishing', 'cinematic']
                        },
                        {
                            id: 'scene-3',
                            sceneNumber: 3,
                            shotType: 'a-roll',
                            framing: 'close-up',
                            cameraMovement: 'zoom',
                            description: 'Main content delivery',
                            visualComposition: 'Close-up for emphasis, dramatic lighting',
                            duration: 10,
                            referenceKeywords: ['close up', 'emphasis', 'main point']
                        },
                        {
                            id: 'scene-4',
                            sceneNumber: 4,
                            shotType: 'text-overlay',
                            framing: 'medium',
                            cameraMovement: 'static',
                            description: 'Call to action',
                            visualComposition: 'Bold text overlay on engaging background',
                            textOverlay: 'Follow for more!',
                            duration: 3,
                            referenceKeywords: ['cta', 'call to action', 'ending']
                        }
                    ],
                totalDuration: existingScenes.reduce((sum, s) => sum + (s.duration || 5), 0) || 21
            };
        }

        return NextResponse.json(storyboardData);
    } catch (error) {
        console.error('Storyboard generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate storyboard' },
            { status: 500 }
        );
    }
}
