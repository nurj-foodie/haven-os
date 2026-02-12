import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

const TEMPLATE_PROMPTS: Record<string, string> = {
    app: `You are an App Development Project Manager. Break down mobile/web app projects into clear development phases with specific actionable tasks.

Standard phases for app development:
1. Planning & Research - Requirements, market research, tech stack
2. Design - Wireframes, UI/UX, prototypes
3. Development - Core features, backend, frontend
4. Testing - Unit tests, integration, QA
5. Launch - Deployment, app store submission, marketing

Each phase should have 3-5 specific, actionable tasks.`,

    merch: `You are a Merchandise Production Manager. Break down merchandise creation projects into clear production phases with specific tasks.

Standard phases for merchandise:
1. Concept & Design - Sketches, mockups, design finalization
2. Sourcing - Materials, vendors, samples
3. Production - Manufacturing, quality control
4. Packaging - Design, printing, assembly
5. Distribution - Inventory, shipping, sales channels

Each phase should have 3-5 specific, actionable tasks.`,

    poster: `You are a Poster Design Project Manager. Break down poster/print design projects into clear phases with specific tasks.

Standard phases for poster design:
1. Brief & Research - Understand goals, audience, references
2. Concept - Sketches, layout options, typography
3. Design - Full design execution, color, imagery
4. Review - Client feedback, revisions
5. Production - Print prep, proofing, printing

Each phase should have 3-5 specific, actionable tasks.`,

    generic: `You are a Production Manager. Break down any project into clear phases with specific actionable tasks.

Standard phases:
1. Planning - Define goals, scope, timeline
2. Preparation - Gather resources, set up tools
3. Execution - Core work, deliverables
4. Review - Quality check, refinements
5. Completion - Final delivery, documentation

Each phase should have 3-5 specific, actionable tasks.`
};

export async function POST(req: NextRequest) {
    try {
        const { projectName, projectType, description } = await req.json();

        const templatePrompt = TEMPLATE_PROMPTS[projectType] || TEMPLATE_PROMPTS.generic;

        const systemPrompt = `${templatePrompt}

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation.

Return JSON in this exact format:
{
  "projectTitle": "Refined project name",
  "phases": [
    {
      "name": "Phase Name",
      "tasks": [
        { "id": "unique-id-1", "name": "Task description", "completed": false },
        { "id": "unique-id-2", "name": "Another task", "completed": false }
      ]
    }
  ]
}`;

        const userPrompt = `Project: ${projectName}
Description: ${description}

Break this project into phases with clear, actionable tasks. Return JSON only.`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const genResult = await model.generateContent(systemPrompt + '\n\n' + userPrompt);
        const genResponse = await genResult.response;
        const text = genResponse.text() || '';

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in response');
        }

        const parsedResult = JSON.parse(jsonMatch[0]);

        return NextResponse.json({
            success: true,
            result: parsedResult
        });

    } catch (error: any) {
        console.error('[Production Agent] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
