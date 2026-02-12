import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Normalize URL - prepend https:// if no protocol
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = `https://${normalizedUrl}`;
        }

        // Validate URL format
        try {
            new URL(normalizedUrl);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        const options = { url: normalizedUrl, timeout: 5000 };
        const { error, result } = await ogs(options);

        if (error) {
            console.error('[OpenGraph] Error fetching metadata:', error);
            return NextResponse.json({
                error: 'Failed to fetch metadata',
                fallback: true
            }, { status: 200 }); // Return 200 with fallback flag
        }

        const ogData = result.ogTitle || result.twitterTitle || result.dcTitle;
        const ogDescription = result.ogDescription || result.twitterDescription || result.dcDescription;
        const ogImage = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url;
        const ogSiteName = result.ogSiteName || result.twitterSite;

        return NextResponse.json({
            title: ogData || 'No title available',
            description: ogDescription || '',
            image: ogImage || null,
            siteName: ogSiteName || new URL(normalizedUrl).hostname,
            url: normalizedUrl
        });

    } catch (error: any) {
        console.error('[OpenGraph] API Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            fallback: true
        }, { status: 200 });
    }
}
