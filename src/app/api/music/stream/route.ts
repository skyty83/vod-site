import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// 只代理音乐源的音频域名, 避免被当作开放代理(SSRF)使用
const ALLOWED_HOST_SUFFIXES = ['.kuwo.cn', '.sycdn.kuwo.cn'];

export async function GET(request: NextRequest) {
    const raw = request.nextUrl.searchParams.get('u');
    if (!raw) return new Response('Missing u', { status: 400 });

    let target: URL;
    try {
        target = new URL(raw);
    } catch {
        return new Response('Bad url', { status: 400 });
    }
    if (!['http:', 'https:'].includes(target.protocol) || !ALLOWED_HOST_SUFFIXES.some(s => target.hostname.endsWith(s))) {
        return new Response('Host not allowed', { status: 403 });
    }

    const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    const range = request.headers.get('range');
    if (range) headers.Range = range;

    const upstream = await fetch(target, { headers, redirect: 'follow' }).catch(() => null);
    if (!upstream || !upstream.body) return new Response('Upstream error', { status: 502 });

    const out = new Headers();
    for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
        const v = upstream.headers.get(h);
        if (v) out.set(h, v);
    }
    return new Response(upstream.body, { status: upstream.status, headers: out });
}
