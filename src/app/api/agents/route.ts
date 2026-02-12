import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

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

export async function POST(req: NextRequest) {
    try {
        const { action, content, context, prompt, voiceProfile, useReasoningModel, deepResearch, documentUrl, languageMode } = await req.json();

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        // Select model based on reasoning mode
        let modelName = 'gemini-2.0-flash';
        if (useReasoningModel) {
            modelName = 'gemini-1.5-pro'; // Reasoning model (stable)
        }

        // Configure tools for deep research
        const tools = deepResearch ? [{ googleSearch: {} }] : undefined;

        const model = genAI.getGenerativeModel({
            model: modelName,
            tools: tools as any
        });

        let systemInstruction = "";
        let userPrompt = "";
        const voiceInjection = buildVoicePrompt(voiceProfile);
        const languageInstruction = languageMode === 'MS'
            ? "\n\nCRITICAL: Output MUST be in Bahasa Melayu (Malay) language, but you may use English terms for technical concepts if common."
            : "";

        switch (action) {
            case 'summarize':
                systemInstruction = `You are a precision summarizer. 
                Your goal is to crystallize the input into a concise, high-density summary.
                - Focus on key insights and actionable points.
                - Use bullet points for readability.
                - Ignore fluff.
                - If analyzing a document, focus on its main topics and purpose.`;

                // Handle document files by fetching their content
                if (documentUrl) {
                    console.log(`[Summarize] Fetching document from: ${documentUrl}`);

                    const fileExt = documentUrl.split('.').pop()?.toLowerCase() || '';
                    const docResponse = await fetch(documentUrl);
                    if (!docResponse.ok) {
                        throw new Error(`Failed to fetch document: ${docResponse.status}`);
                    }

                    const docModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

                    // Handle file types differently based on Gemini's supported formats
                    if (fileExt === 'pdf') {
                        // PDF - Gemini supports PDF inline data
                        const docBuffer = await docResponse.arrayBuffer();
                        console.log(`[Summarize] PDF fetched. Size: ${docBuffer.byteLength} bytes`);

                        const docResult = await docModel.generateContent([
                            {
                                inlineData: {
                                    data: Buffer.from(docBuffer).toString('base64'),
                                    mimeType: 'application/pdf',
                                }
                            },
                            {
                                text: `Read and understand this document. Then provide a concise, high-density summary:
                                - Focus on key insights and main topics
                                - Use bullet points for readability
                                - Identify the purpose and content type
                                - Ignore formatting and focus on substance`
                            }
                        ]);

                        return NextResponse.json({ text: docResult.response.text() });
                    } else if (['md', 'txt'].includes(fileExt)) {
                        // Markdown/Text - read as plain text
                        const textContent = await docResponse.text();
                        console.log(`[Summarize] Text file read. Length: ${textContent.length} chars`);

                        const docResult = await docModel.generateContent(`
                            Summarize this document content:
                            ---
                            ${textContent.substring(0, 30000)}
                            ---
                            Provide a concise, high-density summary:
                            - Focus on key insights and main topics
                            - Use bullet points for readability
                            - Identify the purpose and content type`);

                        return NextResponse.json({ text: docResult.response.text() });
                    } else if (fileExt === 'docx') {
                        // DOCX - Use mammoth to extract text
                        const docBuffer = await docResponse.arrayBuffer();
                        console.log(`[Summarize] DOCX file - extracting text with mammoth`);

                        try {
                            // mammoth in Node.js expects 'buffer' property with a Node Buffer
                            const nodeBuffer = Buffer.from(docBuffer);
                            const extractResult = await mammoth.extractRawText({ buffer: nodeBuffer });
                            const textContent = extractResult.value;
                            console.log(`[Summarize] DOCX text extracted. Length: ${textContent.length} chars`);

                            const docResult = await docModel.generateContent(`
                                Summarize this document content:
                                ---
                                ${textContent.substring(0, 30000)}
                                ---
                                Provide a concise, high-density summary:
                                - Focus on key insights and main topics
                                - Use bullet points for readability
                                - Identify the purpose and content type`);

                            return NextResponse.json({ text: docResult.response.text() });
                        } catch (extractError) {
                            console.error(`[Summarize] DOCX extraction failed:`, extractError);
                            // Fallback to filename-based summary
                            const docResult = await docModel.generateContent(`
                                Create a summary for a document file named: "${content}".
                                This is a Microsoft Word document.
                                Based on the document title, infer what it contains.`);

                            return NextResponse.json({ text: docResult.response.text() });
                        }
                    } else {
                        // Unknown document type
                        console.log(`[Summarize] Unknown file type (${fileExt}) - using label`);
                        return NextResponse.json({ text: `Unable to summarize this document type (${fileExt}). Please convert to PDF, MD, or TXT.` });
                    }
                }


                userPrompt = `Summarize this content:\n\n${content}`;
                break;


            case 'write':
                systemInstruction = `You are an expert writing assistant.
                You help users refine their thoughts.
                - Maintain the user's original voice but improve clarity and flow.
                - Verify facts where possible (or flag uncertainties).
                - Output ONLY the rewritten text, no preamble.
                
${voiceInjection}`;

                // specific writing modes
                if (prompt === 'expand') {
                    userPrompt = `Expand on this, adding more detail and depth:\n\n${content}`;
                } else if (prompt === 'simplify') {
                    userPrompt = `Simplify this, making it clearer and more concise:\n\n${content}`;
                } else if (prompt === 'fix_grammar') {
                    userPrompt = `Fix grammar and polish this text:\n\n${content}`;
                } else {
                    userPrompt = `${prompt || 'Improve this text'}:\n\n${content}`;
                }
                break;

            case 'orchestrate':
                const isAutoLink = prompt && (prompt as string).includes('JSON Edges');

                if (isAutoLink) {
                    systemInstruction = `You are a connection engine.
                    Analyze the provided nodes and identify logical connections between them.
                    - "source" and "target" must be the exact Node IDs provided in the content.
                    - "label" should be a 1-3 word description of the relationship.
                    - Return ONLY valid JSON.
                    - Schema: { "edges": [{ "source": "id1", "target": "id2", "label": "claims" }] }`;
                    userPrompt = `${prompt || 'Find connections'}:\n\n${content}`;
                } else {
                    systemInstruction = `You are a synthesis engine. 
                    You are given multiple data points (notes, images, docs). 
                    Your job is to find connections, synthesize information, and answer the specific user request based on the COMBINED context.
                    - If asked to summarize, merge insights from all sources.
                    - If asked to find patterns, look for common themes.
                    - If asked a specific question, use all nodes as context.`;
                    userPrompt = `${prompt || 'Synthesize these items'}:\n\n${content}`;
                }
                break;

            case 'transcribe':
                // Use already-parsed body from line 8
                const mediaUrl = content; // mediaUrl is passed as 'content' parameter

                if (!mediaUrl) {
                    return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
                }

                systemInstruction = `You are a professional transcription engine.
                Your task is to transcribe audio/video content with high accuracy.
                - Identify and label distinct speakers (Speaker 1, Speaker 2, etc.)
                - Provide timestamps in MM:SS format
                - Detect primary emotions (Happy, Sad, Angry, Neutral) for each segment
                - Create a concise summary of the overall content
                - Detect the language of each segment`;

                try {
                    const transcribeModel = genAI.getGenerativeModel({
                        model: 'gemini-2.0-flash'
                    });

                    // Fetch the audio file and convert to base64
                    console.log('[Transcribe] Fetching audio from:', mediaUrl);
                    const audioResponse = await fetch(mediaUrl);
                    if (!audioResponse.ok) {
                        throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
                    }

                    const audioBuffer = await audioResponse.arrayBuffer();
                    const base64Audio = Buffer.from(audioBuffer).toString('base64');

                    // Detect MIME type from URL or default to audio/mpeg
                    let mimeType = 'audio/mpeg';
                    if (mediaUrl.includes('.m4a')) mimeType = 'audio/mp4';
                    else if (mediaUrl.includes('.wav')) mimeType = 'audio/wav';
                    else if (mediaUrl.includes('.ogg')) mimeType = 'audio/ogg';
                    else if (mediaUrl.includes('.flac')) mimeType = 'audio/flac';

                    console.log('[Transcribe] Audio fetched, size:', audioBuffer.byteLength, 'bytes, MIME:', mimeType);

                    const transcribeResult = await transcribeModel.generateContent([
                        {
                            inlineData: {
                                data: base64Audio,
                                mimeType: mimeType
                            }
                        },
                        {
                            text: `Transcribe this audio file. Provide:
1. A brief summary (2-3 sentences)
2. Full transcript with speaker labels and timestamps  
3. Segment the transcript by speaker changes or every 30 seconds

Format your response as JSON:
{
  "summary": "Brief summary here",
  "transcript": "Full text transcript",
  "segments": [
    {
      "speaker": "Speaker 1",
      "timestamp": "00:15",
      "text": "Segment content",
      "emotion": "Neutral"
    }
  ]
}`
                        }
                    ]);

                    const transcriptionText = transcribeResult.response.text();
                    console.log('[Transcribe] Response received:', transcriptionText.substring(0, 200));

                    // Try to parse as JSON, fallback to plain text
                    try {
                        const jsonMatch = transcriptionText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            return NextResponse.json(parsed);
                        }
                    } catch (parseError) {
                        console.warn('Failed to parse JSON, returning plain text');
                    }

                    // Fallback: return as plain transcript
                    return NextResponse.json({
                        summary: 'Transcription completed',
                        transcript: transcriptionText,
                        segments: []
                    });

                } catch (transcribeError: any) {
                    console.error('Transcription error:', transcribeError);
                    return NextResponse.json({
                        error: `Transcription failed: ${transcribeError.message}`
                    }, { status: 500 });
                }

            case 'brainstorm':
                systemInstruction = `You are a deep research partner and ideation assistant.
                Your role is to help the user explore ideas, answer complex questions, and provide well-researched insights.
                
                - Think deeply and critically about the topic.
                - If context is provided, use it to ground your responses.
                - If Deep Research is enabled, cite sources from your search results.
                - Ask clarifying questions when needed.
                - Be conversational but intellectually rigorous.`;

                userPrompt = context
                    ? `Context:\n${context}\n\nUser Question: ${prompt || content}`
                    : prompt || content;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { role: 'model', parts: [{ text: systemInstruction + languageInstruction }] },
        });

        const responseText = result.response.text();

        return NextResponse.json({ text: responseText });

    } catch (error: any) {
        console.error('Agent API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
