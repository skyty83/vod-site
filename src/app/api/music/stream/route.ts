import { NextRequest, NextResponse } from 'next/server';

// Whitelist: QQ Music CDN domains we're allowed to proxy
const ALLOWED_HOSTS = new Set([
  'aqqmusic.tc.qq.com',
  'dl.stream.qqmusic.qq.com',
  'isure.stream.qqmusic.qq.com',
  'ws.stream.qqmusic.qq.com',
  'sjy6.stream.qqmusic.qq.com',
  'ws6.stream.qqmusic.qq.com',
  'tsms01.stream.qqmusic.qq.com',
]);

export async function GET(request: NextRequest) {
  const rawSrc = request.nextUrl.searchParams.get('src');
  if (!rawSrc) {
    return new NextResponse('Missing src', { status: 400 });
  }

  // Decode and force HTTP for the upstream request (vkeys are bound to http)
  const decoded = decodeURIComponent(rawSrc);
  const upstreamUrl = decoded.startsWith('https://')
    ? decoded.replace('https://', 'http://')
    : decoded;

  let parsed: URL;
  try {
    parsed = new URL(upstreamUrl);
  } catch {
    return new NextResponse('Invalid src URL', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse('Forbidden host: ' + parsed.hostname, { status: 403 });
  }

  const rangeHeader = request.headers.get('range');

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://y.qq.com/',
        ...(rangeHeader ? { 'Range': rangeHeader } : {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(`Upstream error: ${upstream.status}`, { status: upstream.status });
    }

    const headers = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') ?? 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });

    const contentLength = upstream.headers.get('Content-Length');
    const contentRange = upstream.headers.get('Content-Range');
    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentRange)  headers.set('Content-Range', contentRange);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error('[stream] proxy error:', err);
    return new NextResponse('Stream error', { status: 502 });
  }
}
