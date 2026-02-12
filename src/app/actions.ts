'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// ==========================================
// EMBEDDING GENERATION (Semantic Search)
// ==========================================

export async function generateEmbedding(text: string): Promise<{ success: boolean; embedding?: number[]; error?: string }> {
    try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            throw new Error('Gemini API Key is missing');
        }

        // Use text-embedding-004 (768 dimensions, stable)
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        console.log(`[Embed] Generating embedding for: "${text.substring(0, 50)}..."`);

        const result = await model.embedContent(text);
        const embedding = result.embedding.values;

        console.log(`[Embed] Generated ${embedding.length}-dimensional vector`);

        return { success: true, embedding };
    } catch (error: any) {
        console.error('Embedding Error:', error);
        return { success: false, error: error.message || 'Failed to generate embedding' };
    }
}

// ==========================================
// IMAGE ANALYSIS
// ==========================================

export async function analyzeImage(imageUrl: string) {
    try {
        if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            throw new Error('Gemini API Key is missing');
        }

        // Initialize the model (Using specific version as aliases are failing)
        const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

        console.log(`[Gemini] Analyzing Image: ${imageUrl}`);

        // Fetch the image data
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const headers = response.headers;
        const contentType = headers.get('content-type') || 'image/jpeg';

        console.log(`[Gemini] Image Fetched. Type: ${contentType}, Size: ${arrayBuffer.byteLength} bytes`);

        // Convert to base64
        const base64String = Buffer.from(arrayBuffer).toString('base64');

        const prompt = `
      Analyze this image in detail. 
      Identify the key elements, context, and any text present.
      Provide a concise summary suitable for a creative professional.
      Format the output as clean text, no markdown.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64String,
                    mimeType: contentType,
                },
            },
        ]);

        const text = result.response.text();
        console.log(`[Gemini] Analysis Success: ${text.substring(0, 50)}...`);

        return { success: true, data: text };

    } catch (error: any) {
        console.error('Gemini Analysis Error:', error);
        return { success: false, error: error.message || 'Failed to analyze image' };
    }
}

export async function categorizeItem(item: { type: string, content: string | null, asset?: { public_url: string, type: string, filename: string } }) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('Gemini API Key is missing');
        }

        // Use Gemini 2.5 Flash (confirmed available via diagnostics)
        const model = genAI.getGenerativeModel({
            model: 'models/gemini-2.0-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = "";
        let mediaData: any = null;

        if (item.type === 'file' && item.asset) {
            // Helper to get MIME type from filename
            const getMimeType = (filename: string): string => {
                const ext = filename.split('.').pop()?.toLowerCase() || '';
                const mimeTypes: Record<string, string> = {
                    // Documents
                    'pdf': 'application/pdf',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'doc': 'application/msword',
                    'md': 'text/markdown',
                    'txt': 'text/plain',
                    // Images
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                };
                return mimeTypes[ext] || 'application/octet-stream';
            };

            prompt = `
        Analyze this ${item.asset.type} file.
        Read and understand the CONTENT of this document.
        Categorize it into one of: image, video, audio, document, link, note.
        Provide a short, descriptive title based on the actual content.
        Provide a 1-sentence summary of what this document is about.
        Suggest 2-3 relevant tags based on the content.
        Return JSON format: { "category": "...", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;

            // Fetch file content for images AND documents (not just images)
            const isAnalyzableType = ['image', 'document'].includes(item.asset.type);
            const fileExt = item.asset.filename.split('.').pop()?.toLowerCase() || '';

            if (isAnalyzableType && item.asset.public_url) {
                console.log(`[Categorize] Fetching ${item.asset.type} content: ${item.asset.filename}`);

                const response = await fetch(item.asset.public_url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch file: ${response.status}`);
                }

                // Gemini supports: PDF, images. For text files, read as text.
                // DOCX is NOT supported as inline data - must be extracted
                if (fileExt === 'pdf') {
                    // PDF - send as inline data (Gemini supports this)
                    const arrayBuffer = await response.arrayBuffer();
                    console.log(`[Categorize] PDF fetched. Size: ${arrayBuffer.byteLength} bytes`);

                    mediaData = {
                        inlineData: {
                            data: Buffer.from(arrayBuffer).toString('base64'),
                            mimeType: 'application/pdf',
                        },
                    };
                } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                    // Images - send as inline data
                    const arrayBuffer = await response.arrayBuffer();
                    const contentType = response.headers.get('content-type') || getMimeType(item.asset.filename);
                    console.log(`[Categorize] Image fetched. Type: ${contentType}, Size: ${arrayBuffer.byteLength} bytes`);

                    mediaData = {
                        inlineData: {
                            data: Buffer.from(arrayBuffer).toString('base64'),
                            mimeType: contentType,
                        },
                    };
                } else if (['md', 'txt'].includes(fileExt)) {
                    // Markdown/Text - read as plain text and include in prompt
                    const textContent = await response.text();
                    console.log(`[Categorize] Text file read. Length: ${textContent.length} chars`);

                    prompt = `
        Analyze this document content:
        ---
        ${textContent.substring(0, 30000)}
        ---
        Categorize it into one of: image, video, audio, document, link, note.
        Provide a short, descriptive title based on the actual content.
        Provide a 1-sentence summary of what this document is about.
        Suggest 2-3 relevant tags based on the content.
        Return JSON format: { "category": "...", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;
                } else if (fileExt === 'docx') {
                    // DOCX - Use mammoth to extract text
                    const arrayBuffer = await response.arrayBuffer();
                    console.log(`[Categorize] DOCX file - extracting text with mammoth`);

                    try {
                        // mammoth in Node.js expects 'buffer' property with a Node Buffer
                        const nodeBuffer = Buffer.from(arrayBuffer);
                        const result = await mammoth.extractRawText({ buffer: nodeBuffer });
                        const textContent = result.value;
                        console.log(`[Categorize] DOCX text extracted. Length: ${textContent.length} chars`);

                        prompt = `
        Analyze this document content:
        ---
        ${textContent.substring(0, 30000)}
        ---
        Categorize it into one of: image, video, audio, document, link, note.
        Provide a short, descriptive title based on the actual content.
        Provide a 1-sentence summary of what this document is about.
        Suggest 2-3 relevant tags based on the content.
        Return JSON format: { "category": "...", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;
                    } catch (extractError) {
                        console.error(`[Categorize] DOCX extraction failed:`, extractError);
                        // Fallback to filename analysis if extraction fails
                        prompt = `
        Analyze this document file: "${item.asset.filename}".
        This is a Microsoft Word document.
        Based on the filename, provide a title and summary.
        Return JSON format: { "category": "document", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;
                    }
                } else {
                    // Unknown type - fallback to filename
                    console.log(`[Categorize] Unknown file type (${fileExt}) - using filename analysis`);
                    prompt = `
        Analyze this file: "${item.asset.filename}".
        Categorize it into one of: image, video, audio, document, link, note.
        Provide a short, descriptive title and a 1-sentence summary.
        Suggest 2-3 relevant tags.
        Return JSON format: { "category": "...", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;
                }
            }

        } else {
            prompt = `
        Analyze this raw content: "${item.content}".
        Categorize it into one of: image, video, document, link, note.
        (Note: If it's a URL, it's likely a 'link'. If it's short text, it's a 'note').
        Provide a short, descriptive title and a 1-sentence summary.
        Suggest 2-3 relevant tags.
        Return JSON format: { "category": "...", "title": "...", "summary": "...", "tags": ["...", "..."] }
      `;
        }

        const result = await (mediaData
            ? model.generateContent([prompt, mediaData])
            : model.generateContent(prompt));

        const text = result.response.text();
        return { success: true, data: JSON.parse(text) };

    } catch (error: any) {
        console.error('Categorization Error:', error);
        return { success: false, error: error.message || 'Failed to categorize item' };
    }
}
