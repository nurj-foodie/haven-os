import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || !query.trim()) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Tavily API key not configured' }, { status: 500 });
        }

        // Call Tavily Search API
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: 'basic',
                include_answer: false,
                include_raw_content: false,
                max_results: 5,
                include_domains: [],
                exclude_domains: []
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Tavily API error:', error);
            return NextResponse.json({ error: 'Web search failed' }, { status: response.status });
        }

        const data = await response.json();

        // Transform Tavily results to our format
        const sources = data.results?.map((result: any) => ({
            title: result.title,
            url: result.url,
            snippet: result.content || result.snippet || '',
            score: result.score || 0
        })) || [];

        return NextResponse.json({ sources });

    } catch (error) {
        console.error('Web search error:', error);
        return NextResponse.json({ error: 'Web search failed' }, { status: 500 });
    }
}
