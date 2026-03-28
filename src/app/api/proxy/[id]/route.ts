import { NextRequest, NextResponse } from 'next/server';

// 프록시 인덱스 → 실제 API URL 매핑 (api.ts의 SERVER_ENDPOINTS와 동일 순서)
const PROXY_TARGETS: Record<string, string> = {
    '1': 'http://api.ffzyapi.com/api.php/provide/vod/at/json/', // index 0: FFZY
    '2': 'https://api.guangsuapi.com/api.php/provide/vod/josn/', // index 1: Guangsu
    '3': 'https://subocj.com/api.php/provide/vod/from/subm3u8/at/json/', // index 2: Subocj
    '4': 'https://api.wsyzy.net/api.php/provide/vod/', // index 3: Wsyzy
    '5': 'https://iqiyizyapi.com/api.php/provide/vod/', // index 4: Iqiyi
    '6': 'https://jyzyapi.com/provide/vod/from/jinyingyun/at/json/', // index 5: Jyzy
    '7': 'https://bfzyapi.com/api.php/provide/vod/', // index 6: Bfzy
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const target = PROXY_TARGETS[id];

    if (!target) {
        return NextResponse.json({ error: 'Unknown proxy id' }, { status: 404 });
    }

    // 원본 쿼리스트링 그대로 전달
    const searchParams = request.nextUrl.searchParams.toString();
    const url = searchParams ? `${target}?${searchParams}` : target;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });
        clearTimeout(timer);

        if (!res.ok) {
            return NextResponse.json({ error: 'Upstream error' }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Request failed' }, { status: 502 });
    }
}
