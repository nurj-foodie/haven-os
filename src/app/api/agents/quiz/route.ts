import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    console.log('[Quiz Master] API called at:', new Date().toISOString());
    try {
        const { nodes, userPrompt } = await req.json();
        console.log('[Quiz Master] Received nodes:', nodes?.length, 'user prompt:', userPrompt);

        if (!nodes || nodes.length === 0) {
            console.log('[Quiz Master] No nodes provided');
            return NextResponse.json(
                { success: false, error: 'No nodes provided' },
                { status: 400 }
            );
        }

        // Aggregate content from all selected nodes
        const contentParts = nodes.map((node: any, index: number) => {
            const label = node.data?.label || 'Untitled';
            const content = node.data?.content || node.data?.metadata?.summary || '';
            const courseData = node.data?.metadata?.courseData;
            const tags = node.data?.metadata?.tags?.join(', ') || '';

            console.log(`[Quiz Master] Node ${index}:`, {
                label,
                contentLength: content.length,
                hasCourseData: !!courseData,
                modulesCount: courseData?.modules?.length || 0
            });

            // If this is a course node with modules, extract module information
            let nodeContent = content;
            if (courseData && courseData.modules) {
                const moduleSummary = courseData.modules.map((m: any, idx: number) =>
                    `Module ${idx + 1}: ${m.title}\n${m.coreIdea}\nTopics: ${m.subTopics?.join(', ') || 'none'}`
                ).join('\n\n');
                nodeContent = `${courseData.description || ''}\n\nCourse Modules:\n${moduleSummary}`;
            }

            return `
[${label}]
${nodeContent}
${tags ? `Tags: ${tags}` : ''}
---`;
        }).join('\n\n');

        console.log('[Quiz Master] Content parts generated, total length:', contentParts.length);

        const prompt = `You are the Quiz Master, a learning assistant that generates educational quiz questions.

Given the following learning materials, create a comprehensive quiz to test understanding.

CONTENT:
${contentParts}

USER REQUEST: ${userPrompt || 'Generate a balanced quiz covering core concepts'}

REQUIREMENTS:
1. **Question Types**: Include a mix of:
   - Multiple Choice (4 options, 1 correct)
   - Fill-in-the-Blank (provide the blank text with ___ for the missing word)
   - Open-Ended (requires thoughtful written response)

2. **Difficulty Levels**:
   - Start with basic recall questions to confirm core understanding
   - Progress to intermediate application questions
   - Include 1-2 advanced synthesis questions

3. **Question Count**: Generate 5-10 questions total (balanced across types)

4. **Mastery Focus**: Questions should verify the user understands the CORE IDEAS and sub-topics, not trivial details

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "fill_in_blank" | "open_ended",
      "difficulty": "basic" | "intermediate" | "advanced",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"], // only for multiple_choice
      "correctAnswer": "B" or "the missing word" or "sample answer for open-ended",
      "explanation": "Why this is correct and what concept it tests"
    }
  ],
  "courseInsights": {
    "mainTopics": ["Topic 1", "Topic 2"],
    "prerequisites": "What should be known before this",
    "estimatedTime": "15 minutes"
  }
}

Return ONLY valid JSON, no markdown formatting.`;

        console.log('[Quiz Master] Calling Gemini API...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Add timeout protection: 60 second max
        const generationPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout after 60 seconds')), 60000)
        );

        const result = await Promise.race([generationPromise, timeoutPromise]) as any;
        console.log('[Quiz Master] Gemini API responded');

        const text = result.response.text();
        console.log('[Quiz Master] Response text length:', text.length);

        // Parse JSON response
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const quizData = JSON.parse(cleanedText);

        console.log('[Quiz Master] Quiz generated successfully:', quizData.questions.length, 'questions');

        const responseData = {
            success: true,
            result: {
                content: `Generated ${quizData.questions.length} questions`,
                metadata: quizData,
                nextAgent: 'study_session' // Suggest taking the quiz next
            }
        };

        console.log('[Quiz Master] Returning response with result keys:', Object.keys(responseData.result));
        console.log('[Quiz Master] Result metadata keys:', Object.keys(responseData.result.metadata));

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('[Quiz Master] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
