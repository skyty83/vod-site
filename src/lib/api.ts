import { ApiDetailResponse, ApiListResponse, CategoryItem, VodItem } from '@/types';

const isClient = typeof window !== 'undefined';
const BASE_URL = isClient
    ? '/api/proxy'
    : 'http://api.ffzyapi.com/api.php/provide/vod/at/json/';

export async function getCategories(): Promise<CategoryItem[]> {
    try {
        const res = await fetch(`${BASE_URL}/?ac=list`, {
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data: ApiListResponse = await res.json();
        return data.class || [];
    } catch {
        return [];
    }
}

export async function getVideoList(
    page: number = 1,
    typeId?: number
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    try {
        let url = `${BASE_URL}/?ac=detail&pg=${page}`;
        if (typeId) url += `&t=${typeId}`;

        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return { list: [], pagecount: 1, total: 0 };

        const data: ApiDetailResponse = await res.json();
        if (data.code !== 1) return { list: [], pagecount: 1, total: 0 };

        return {
            list: data.list || [],
            pagecount: data.pagecount || 1,
            total: data.total || 0,
        };
    } catch {
        return { list: [], pagecount: 1, total: 0 };
    }
}

export async function getVideoDetail(id: number): Promise<VodItem | null> {
    try {
        const res = await fetch(`${BASE_URL}/?ac=detail&ids=${id}`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return null;
        const data: ApiDetailResponse = await res.json();
        if (data.code !== 1 || !data.list?.length) return null;
        return data.list[0];
    } catch {
        return null;
    }
}

export async function searchVideos(
    keyword: string,
    page: number = 1
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    try {
        const res = await fetch(
            `${BASE_URL}/?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`,
            { next: { revalidate: 60 } }
        );
        if (!res.ok) return { list: [], pagecount: 1, total: 0 };
        const data: ApiDetailResponse = await res.json();
        if (data.code !== 1) return { list: [], pagecount: 1, total: 0 };
        return {
            list: data.list || [],
            pagecount: data.pagecount || 1,
            total: data.total || 0,
        };
    } catch {
        return { list: [], pagecount: 1, total: 0 };
    }
}

export function parsePlaySources(vod: VodItem) {
    if (!vod.vod_play_from || !vod.vod_play_url) return [];

    const fromList = vod.vod_play_from.split('$$$');
    const urlList = vod.vod_play_url.split('$$$');

    return fromList.map((name, i) => {
        const episodesRaw = urlList[i] || '';
        const episodes = episodesRaw.split('#').map((ep) => {
            const parts = ep.split('$');
            return {
                name: parts[0]?.trim() || `第${i + 1}集`,
                url: parts[1]?.trim() || '',
            };
        }).filter((ep) => ep.url);
        return { name, episodes };
    });
}
