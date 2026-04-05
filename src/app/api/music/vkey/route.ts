import { NextRequest, NextResponse } from 'next/server';

const GUID = '358840384';

// China-based proxy to avoid geo-blocking (this proxy routes through Chinese IPs)
const PROXY_BASE = 'https://proxy.api.030101.xyz/https://u.y.qq.com/cgi-bin/musicu.fcg';
// Direct fallback
const DIRECT_BASE = 'https://u.y.qq.com/cgi-bin/musicu.fcg';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Referer': 'https://y.qq.com/',
  'Origin': 'https://y.qq.com',
  'Accept': 'application/json, text/plain, */*',
};

interface VkeyResult {
  url: string;
  quality: string;
}

async function tryFetchVkey(
  base: string,
  mid: string,
  prefix: string,
  ext = 'mp3',
  platform = '23',
  loginflag = 0
): Promise<string | null> {
  const filename = `${prefix}${mid}.${ext}`;
  const payload = {
    req_0: {
      module: 'vkey.GetVkeyServer',
      method: 'CgiGetVkey',
      param: {
        guid: GUID,
        songmid: [mid],
        filename: [filename],
        songtype: [0],
        uin: '0',
        loginflag,
        platform,
      },
    },
  };

  try {
    // Try POST first (some proxies work better with POST)
    const res = await fetch(base, {
      method: 'POST',
      headers: { ...FETCH_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const purl: string | undefined = data?.req_0?.data?.midurlinfo?.[0]?.purl;
    if (purl && purl.length > 10) return purl;
  } catch { /* fall through to GET */ }

  try {
    // Fallback: GET with data param
    const getUrl = `${base}?data=${encodeURIComponent(JSON.stringify(payload))}`;
    const res = await fetch(getUrl, {
      headers: FETCH_HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const purl: string | undefined = data?.req_0?.data?.midurlinfo?.[0]?.purl;
    if (purl && purl.length > 10) return purl;
  } catch { return null; }

  return null;
}

function normalizePurl(purl: string): string {
  // Some purls are relative paths, others are full URLs
  if (purl.startsWith('http://') || purl.startsWith('https://')) {
    // Force HTTPS
    return purl.replace(/^http:\/\//, 'https://');
  }
  return `https://dl.stream.qqmusic.qq.com/${purl}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mid = request.nextUrl.searchParams.get('mid');
  if (!mid || !/^[a-zA-Z0-9]+$/.test(mid)) {
    return NextResponse.json({ error: 'Invalid mid' }, { status: 400 });
  }

  // Quality attempts in priority order
  // Try proxy first (goes through Chinese IP) then direct server
  const attempts: { base: string; prefix: string; label: string; ext?: string; platform?: string; loginflag?: number }[] = [
    // Full quality via proxy (Chinese IP routes these)
    { base: PROXY_BASE, prefix: 'F000', label: 'Lossless', ext: 'flac' },
    { base: PROXY_BASE, prefix: 'M800', label: 'HiRes',   ext: 'mp3' },
    { base: PROXY_BASE, prefix: 'M500', label: 'Standard', ext: 'mp3' },
    { base: PROXY_BASE, prefix: 'C400', label: 'Standard', ext: 'm4a' },
    { base: PROXY_BASE, prefix: 'M500', label: 'Standard', ext: 'mp3', platform: '20', loginflag: 1 },
    // Preview fallback (always works from any IP)
    { base: DIRECT_BASE, prefix: 'RS02', label: 'Preview', ext: 'mp3', platform: '23', loginflag: 0 },
  ];

  const results: VkeyResult[] = [];

  for (const attempt of attempts) {
    try {
      const purl = await tryFetchVkey(
        attempt.base,
        mid,
        attempt.prefix,
        attempt.ext ?? 'mp3',
        attempt.platform ?? '23',
        attempt.loginflag ?? 0
      );

      if (purl) {
        const normalizedUrl = normalizePurl(purl);

        // Skip preview (RS02) if we already have a better result
        if (attempt.prefix === 'RS02' && results.length > 0) continue;

        // For RS02 (preview clip), return the URL directly (the CDN serves it fine)
        if (attempt.prefix === 'RS02') {
          // Use stream proxy to handle HTTP→HTTPS conversion
          const streamUrl = `/api/music/stream?src=${encodeURIComponent(purl.replace(/^https?:\/\//, 'http://'))}`;
          return NextResponse.json({ url: streamUrl, quality: 'Preview', preview: true });
        }

        // For full songs, use the stream proxy
        const streamUrl = `/api/music/stream?src=${encodeURIComponent(normalizedUrl)}`;
        return NextResponse.json({ url: streamUrl, quality: attempt.label, preview: false });
      }
    } catch (err) {
      console.error(`[vkey] ${attempt.prefix} via ${attempt.base === PROXY_BASE ? 'proxy' : 'direct'} failed:`, err);
    }
  }

  return NextResponse.json({ error: 'No playable URL found for this song', mid }, { status: 404 });
}
