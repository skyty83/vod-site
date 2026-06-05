import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': new URL(url).origin
            }
        });

        if (!res.ok) {
            return new NextResponse('Error fetching', { status: res.status });
        }

        const contentType = res.headers.get('content-type') || '';
        
        // If it's an m3u8 playlist, rewrite the URLs inside it
        if (contentType.includes('mpegurl') || url.includes('.m3u8') || url.includes('.m3u')) {
            let text = await res.text();
            
            const baseUrl = new URL(url);
            const basePath = baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
            
            const lines = text.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    // It's a URL line (TS chunk or another m3u8)
                    let absoluteUrl = trimmed;
                    if (!trimmed.startsWith('http')) {
                        absoluteUrl = trimmed.startsWith('/') 
                            ? baseUrl.origin + trimmed 
                            : basePath + trimmed;
                    }
                    return `/api/proxy/m3u8?url=${encodeURIComponent(absoluteUrl)}`;
                }
                
                if (trimmed.startsWith('#EXT-X-KEY') && trimmed.includes('URI="')) {
                     return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
                         let absoluteUri = uri;
                         if (!uri.startsWith('http')) {
                             absoluteUri = uri.startsWith('/') ? baseUrl.origin + uri : basePath + uri;
                         }
                         return `URI="/api/proxy/m3u8?url=${encodeURIComponent(absoluteUri)}"`;
                     });
                }
                return line;
            });

            return new NextResponse(rewrittenLines.join('\n'), {
                headers: {
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        } else {
            // It's a binary chunk (.ts file) or something else
            const arrayBuffer = await res.arrayBuffer();
            return new NextResponse(arrayBuffer, {
                headers: {
                    'Content-Type': contentType || 'video/mp2t',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=3600'
                }
            });
        }

    } catch (e) {
        return new NextResponse('Failed', { status: 500 });
    }
}
