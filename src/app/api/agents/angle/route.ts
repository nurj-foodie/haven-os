import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Angle type descriptions for the AI
const ANGLE_DESCRIPTIONS = {
    'pain-point': 'Address a specific problem or frustration the audience faces',
    'benefit': 'Highlight a concrete benefit or positive outcome',
    'story': 'Use a personal narrative or customer success story',
    'authority': 'Leverage expertise, credentials, or social proof',
    'urgency': 'Create time-sensitive motivation to act now',
    'curiosity': 'Generate intrigue that compels them to learn more'
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            product,
            targetAudience,
            platforms = ['linkedin', 'twitter'],
            sourceContext
        } = body;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are an expert marketing strategist and copywriter. Generate compelling marketing angles for a product/content.

**Product/Content:** ${product}
**Target Audience:** ${targetAudience}
**Target Platforms:** ${platforms.join(', ')}

${sourceContext ? `**Additional Context:**\n${sourceContext}\n` : ''}

Generate 4-6 unique marketing angles. Each angle should use a different psychological approach:
- Pain Point: ${ANGLE_DESCRIPTIONS['pain-point']}
- Benefit: ${ANGLE_DESCRIPTIONS['benefit']}
- Story: ${ANGLE_DESCRIPTIONS['story']}
- Authority: ${ANGLE_DESCRIPTIONS['authority']}
- Urgency: ${ANGLE_DESCRIPTIONS['urgency']}
- Curiosity: ${ANGLE_DESCRIPTIONS['curiosity']}

For each angle, create 2-3 copy variations tailored for the selected platforms.

Return JSON in this exact format:
{
    "angles": [
        {
            "id": "angle-1",
            "type": "pain-point|benefit|story|authority|urgency|curiosity",
            "title": "Short descriptive title for this angle",
            "hook": "The main hook/headline for this angle (attention-grabbing, 1-2 sentences)",
            "platforms": ["linkedin", "twitter"],
            "variations": [
                {
                    "id": "var-1",
                    "label": "A",
                    "copy": "Complete marketing copy for variation A (ready to post, platform-appropriate)"
                },
                {
                    "id": "var-2",
                    "label": "B",
                    "copy": "Complete marketing copy for variation B (different tone/structure)"
                }
            ]
        }
    ]
}

Guidelines:
1. Each angle should feel distinctly different in approach
2. Hooks should be scroll-stopping and attention-grabbing
3. Variations should differ in tone, structure, or emphasis (not just word swaps)
4. Copy should be platform-appropriate (LinkedIn = professional, Twitter = punchy, Instagram = visual/emoji-friendly)
5. Include clear CTAs where appropriate
6. Keep copy length appropriate for each platform

Return ONLY valid JSON, no markdown or explanation.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse the JSON response
        let angleData;
        try {
            const cleanedResponse = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            angleData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse angle response:', responseText);
            // Return fallback structure
            angleData = {
                angles: [
                    {
                        id: 'angle-1',
                        type: 'pain-point',
                        title: 'The Problem Nobody Talks About',
                        hook: `Struggling with ${product}? You're not alone.`,
                        platforms: platforms,
                        variations: [
                            {
                                id: 'var-1a',
                                label: 'A',
                                copy: `Most ${targetAudience} waste hours on ${product} without seeing results. Here's what actually works...`
                            },
                            {
                                id: 'var-1b',
                                label: 'B',
                                copy: `The #1 mistake ${targetAudience} make with ${product}? Trying to do it all at once.`
                            }
                        ]
                    },
                    {
                        id: 'angle-2',
                        type: 'benefit',
                        title: 'The Transformation Promise',
                        hook: `What if ${product} could change everything?`,
                        platforms: platforms,
                        variations: [
                            {
                                id: 'var-2a',
                                label: 'A',
                                copy: `Imagine waking up with ${product} already working for you. That's the reality for smart ${targetAudience}.`
                            },
                            {
                                id: 'var-2b',
                                label: 'B',
                                copy: `${product} isn't just a tool—it's your unfair advantage in a competitive market.`
                            }
                        ]
                    },
                    {
                        id: 'angle-3',
                        type: 'curiosity',
                        title: 'The Unexpected Secret',
                        hook: `The weird trick behind ${product} success`,
                        platforms: platforms,
                        variations: [
                            {
                                id: 'var-3a',
                                label: 'A',
                                copy: `Nobody told me this about ${product} until I discovered it myself. Now I can't unsee it...`
                            },
                            {
                                id: 'var-3b',
                                label: 'B',
                                copy: `Why are top ${targetAudience} obsessed with ${product}? It's not what you think.`
                            }
                        ]
                    }
                ]
            };
        }

        return NextResponse.json(angleData);
    } catch (error) {
        console.error('Angle generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate marketing angles' },
            { status: 500 }
        );
    }
}
