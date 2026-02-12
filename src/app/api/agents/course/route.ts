import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { nodes, userPrompt } = await req.json();

    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No nodes provided' },
        { status: 400 }
      );
    }

    // Aggregate content from all selected nodes
    const contentSummary = nodes.map((node: any, idx: number) => {
      const label = node.data?.label || `Item ${idx + 1}`;
      const type = node.type || 'unknown';
      const summary = node.data?.metadata?.summary || node.data?.content?.substring(0, 200) || 'No content';
      const tags = node.data?.metadata?.tags?.join(', ') || '';

      return `${idx + 1}. [${type}] ${label}\n   Summary: ${summary}\n   ${tags ? `Tags: ${tags}` : ''}`;
    }).join('\n\n');

    const prompt = `You are the Course Architect, an AI learning designer that structures knowledge into coherent learning paths.

Given the following learning materials, design a structured course outline.

MATERIALS (${nodes.length} items):
${contentSummary}

USER REQUEST: ${userPrompt || 'Create a comprehensive course structure'}

REQUIREMENTS:
1. **Course Structure**: Organize into logical modules/chapters
2. **Progressive Difficulty**: Basic concepts → Intermediate → Advanced
3. **Core Ideas**: Identify the fundamental principles that must be mastered
4. **Sub-topics**: Break down each core idea into learnable chunks
5. **Prerequisites**: What should be known before starting
6. **Learning Objectives**: What the user will master by the end

OUTPUT FORMAT (JSON):
{
  "courseTitle": "Suggested title for the course",
  "description": "Brief overview of what this course covers",
  "prerequisites": "What should be known beforehand",
  "estimatedDuration": "e.g., 2 weeks, 10 hours",
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module title",
      "coreIdea": "The fundamental principle of this module",
      "subTopics": ["Sub-topic 1", "Sub-topic 2"],
      "nodeIds": ["node_id_1", "node_id_2"], // which nodes belong here
      "learningObjectives": ["After this module, you will be able to..."]
    }
  ],
  "suggestedStudyPath": "How to approach this course (e.g., linear, concept-first, project-based)",
  "masteryMilestones": [
    {
      "milestone": "Beginner",
      "criteria": "Can recall and explain core concepts"
    },
    {
      "milestone": "Intermediate",
      "criteria": "Can apply concepts to solve problems"
    },
    {
      "milestone": "Advanced",
      "criteria": "Can synthesize concepts and teach others"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const courseData = JSON.parse(cleanedText);

    return NextResponse.json({
      success: true,
      result: {
        content: courseData.courseTitle,
        metadata: courseData,
        nextAgent: 'quiz_master' // Suggest generating quizzes next
      }
    });

  } catch (error: any) {
    console.error('[Course Architect] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
