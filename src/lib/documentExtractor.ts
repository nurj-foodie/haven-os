'use server';

import mammoth from 'mammoth';

/**
 * Extract text content from a document URL
 * Supports: PDF, DOCX, MD, TXT
 * 
 * This makes documents usable as raw material for agents,
 * just like how photos, audio, and video are handled.
 */
export async function extractDocumentContent(url: string): Promise<{ content: string; charCount: number }> {
    const fileExt = url.split('.').pop()?.toLowerCase() || '';

    console.log(`[DocExtract] Extracting content from: ${url} (${fileExt})`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.status}`);
        }

        let textContent = '';

        if (fileExt === 'pdf') {
            // PDF - For now, we can't extract text without pdf-parse
            // Return a placeholder indicating PDF needs OCR/parsing
            // TODO: Add pdf-parse for proper PDF text extraction
            console.log(`[DocExtract] PDF detected - storing as binary reference`);
            textContent = '[PDF Document - content available via summarization]';
        } else if (fileExt === 'docx') {
            // DOCX - Use mammoth to extract text
            const arrayBuffer = await response.arrayBuffer();
            const nodeBuffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer: nodeBuffer });
            textContent = result.value;
            console.log(`[DocExtract] DOCX extracted: ${textContent.length} chars`);
        } else if (['md', 'txt', 'markdown'].includes(fileExt)) {
            // Plain text files
            textContent = await response.text();
            console.log(`[DocExtract] Text file read: ${textContent.length} chars`);
        } else {
            // Unknown format
            console.log(`[DocExtract] Unknown format (${fileExt}) - no extraction`);
            textContent = `[${fileExt.toUpperCase()} Document]`;
        }

        return {
            content: textContent,
            charCount: textContent.length
        };
    } catch (error) {
        console.error(`[DocExtract] Error:`, error);
        return {
            content: '',
            charCount: 0
        };
    }
}
