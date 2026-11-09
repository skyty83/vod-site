import { ApiDetailResponse, CategoryItem, VodItem } from '@/types';
import { STATIC_CATEGORIES, getSubCategoryIds } from '@/lib/categories';

export { getSubCategoryIds };

// ─── 엔드포인트 정의 ─────────────────────────────────────────────────────────
// 클라이언트: /api/proxy/[id] → Route Handler (src/app/api/proxy/[id]/route.ts)
// 서버: 외부 API 직접 호출
// 인덱스(0~6)는 CATEGORY_MAP, prefixVodId 전체에서 동일하게 사용
const isClient = typeof window !== 'undefined';

const CLIENT_ENDPOINTS = [
    '/api/proxy/1',   // 0: FFZY
    '/api/proxy/2',   // 1: Guangsu
    '/api/proxy/3',   // 2: Subocj
    '/api/proxy/4',   // 3: Wsyzy
    '/api/proxy/5',   // 4: Iqiyi
    '/api/proxy/6',   // 5: Jyzy
    '/api/proxy/7',   // 6: Bfzy
];

const SERVER_ENDPOINTS = [
    'http://api.ffzyapi.com/api.php/provide/vod/at/json/',      // 0: FFZY
    'https://api.guangsuapi.com/api.php/provide/vod/josn/',     // 1: Guangsu
    'https://subocj.com/api.php/provide/vod/from/subm3u8/at/json/', // 2: Subocj
    'https://api.wsyzy.net/api.php/provide/vod/',               // 3: Wsyzy
    'https://iqiyizyapi.com/api.php/provide/vod/',              // 4: Iqiyi
    'https://jyzyapi.com/provide/vod/from/jinyingyun/at/json/', // 5: Jyzy
    'https://bfzyapi.com/api.php/provide/vod/',                 // 6: Bfzy
];

const ENDPOINTS = isClient ? CLIENT_ENDPOINTS : SERVER_ENDPOINTS;

// Wsyzy(3)를 1순위로 두고, 홈/빠른 모드에서도 우선 사용
const PROVIDER_PRIORITY_INDICES = [3, 0, 1, 2, 4, 5, 6];

// 빠른 로딩을 위해 홈화면에서는 2개 API만 사용
const FAST_MODE_INDICES = [3, 0];

function getRequestIndices(typeId?: number, fastMode = false): number[] {
    const baseOrder = fastMode ? FAST_MODE_INDICES : PROVIDER_PRIORITY_INDICES;

    if (!typeId) return baseOrder;

    const mappedIds = CATEGORY_MAP[typeId];
    if (!mappedIds) return baseOrder;

    const filtered = baseOrder.filter(idx => mappedIds[idx] !== undefined);
    if (filtered.length > 0) return filtered;

    return PROVIDER_PRIORITY_INDICES.filter(idx => mappedIds[idx] !== undefined);
}

// ─── vod_id 접두사로 출처 API 식별 ──────────────────────────────────────────
function prefixVodItems(items: VodItem[], apiIndex: number): VodItem[] {
    return items.map(item => ({
        ...item,
        vod_id: `${apiIndex}-${item.vod_id}` as unknown as number
    }));
}

// ─── 카테고리 매핑 ───────────────────────────────────────────────────────────
// 기준: FFZY(0)의 type_id → 각 API에서 대응하는 type_id
// 순서: [API0_FFZY, API1_Guangsu, API2_Subocj, API3_Wsyzy, API4_Iqiyi, API5_Jyzy, API6_Bfzy]
const CATEGORY_MAP: Record<number, (number | undefined)[]> = {
    // ── 영화 ──
    1: [1, 1, 1, 1, 7, 2, 1], // 电影片
    6: [6, 6, 6, 6, 10, undefined, undefined], // 动作片
    7: [7, 7, 12, 7, 11, undefined, undefined], // 喜剧片
    8: [8, 8, 7, 8, 12, undefined, undefined], // 爱情片
    9: [9, 9, 8, 9, 13, undefined, undefined], // 科幻片
    10: [10, 11, 11, 10, 14, undefined, undefined], // 恐怖片
    11: [11, 10, 10, 11, 15, undefined, undefined], // 剧情片
    12: [12, 12, 9, 12, 16, undefined, undefined], // 战争片
    20: [20, 24, 5, 20, 24, undefined, undefined], // 记录片

    // ── 드라마 ──
    2: [2, 2, 2, 2, 8, 1, 2], // 连续剧
    13: [13, 13, 14, 13, 26, 20, undefined], // 国产剧
    14: [14, 15, 18, 17, 27, 4, undefined], // 香港剧
    15: [15, 16, 16, 15, 28, 5, undefined], // 韩国剧
    16: [16, 14, 17, 14, 29, 3, undefined], // 欧美剧
    21: [21, 22, 15, 18, 30, undefined, undefined], // 台湾剧
    22: [22, 21, 20, 16, 31, 6, undefined], // 日本剧
    23: [23, undefined, undefined, 23, 32, undefined, undefined], // 海外剧
    24: [24, 23, 21, 19, 33, 7, undefined], // 泰国剧
    36: [36, 31, 27, 54, 38, undefined, undefined], // 短剧

    // ── 예능 ──
    3: [3, 3, 4, 3, 9, 27, undefined], // 综艺片
    25: [25, undefined, undefined, 25, 34, undefined, undefined], // 大陆综艺
    26: [26, undefined, undefined, 27, 35, undefined, undefined], // 港台综艺
    27: [27, undefined, undefined, 26, 36, undefined, undefined], // 日韩综艺
    28: [28, undefined, undefined, 28, 37, undefined, undefined], // 欧美综艺

    // ── 애니메이션 ──
    4: [4, 4, 3, 4, 40, 24, undefined], // 动漫片
    29: [29, undefined, 24, 29, 1, 24, undefined], // 国产动漫
    30: [30, undefined, 25, 30, 2, 25, undefined], // 日韩动漫
    31: [31, undefined, 26, 31, 3, undefined, undefined], // 欧美动漫
    32: [32, undefined, undefined, 44, 4, undefined, undefined], // 港台动漫
    33: [33, undefined, undefined, 45, undefined, undefined, undefined], // 海外动漫

    // ── 스포츠 (Subocj=2, Wsyzy=3 전용) ──
    48: [undefined, undefined, 23, 48, undefined, undefined, undefined], // 体育赛事
    49: [undefined, undefined, 30, 49, undefined, undefined, undefined], // 篮球
    50: [undefined, undefined, 29, 50, undefined, undefined, undefined], // 足球
};


export async function getCategories(): Promise<CategoryItem[]> {
    try {
        const base = ENDPOINTS[3];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${base}?ac=detail&pg=1`, { signal: controller.signal, next: { revalidate: 3600 } });
        clearTimeout(timeoutId);

        if (!res.ok) return STATIC_CATEGORIES;

        const data = await res.json();
        const classes = Array.isArray(data?.class) ? data.class : [];
        if (classes.length === 0) return STATIC_CATEGORIES;

        const nameById = new Map<number, string>();
        classes.forEach((c: { type_id?: unknown; type_name?: unknown }) => {
            const id = Number(c?.type_id);
            const name = typeof c?.type_name === 'string' ? c.type_name.trim() : '';
            if (Number.isFinite(id) && name) nameById.set(id, name);
        });

        if (nameById.size === 0) return STATIC_CATEGORIES;

        return STATIC_CATEGORIES.map(c => ({
            ...c,
            type_name: nameById.get(c.type_id) ?? c.type_name,
        }));
    } catch {
        return STATIC_CATEGORIES;
    }
}


// ─── 타임아웃 fetch 래퍼 ──────────────────────────────────────────────────
function fetchWithTimeout(
    url: string,
    timeoutMs = 12000
): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal, next: { revalidate: 600 } })
        .then(res => { clearTimeout(timer); return res; })
        .catch(() => { clearTimeout(timer); return null; });
}

// ─── 카테고리별 API 요청 헬퍼 ──────────────────────────────────────────────
function fetchTypeAcrossAPIs(
    page: number,
    typeId: number,
    fastMode = false,
    year?: string,
    area?: string,
    sort?: string
): Promise<{ list: VodItem[]; pagecount: number; total: number } | null>[] {
    const mappedIds = CATEGORY_MAP[typeId];
    const indices = getRequestIndices(typeId, fastMode);

    return indices.map((index) => {
        const base = ENDPOINTS[index];
        const targetTypeId = mappedIds ? mappedIds[index] : typeId;
        if (targetTypeId === undefined || !base) return Promise.resolve(null);

        let url = `${base}?ac=detail&pg=${page}&t=${targetTypeId}`;
        if (year) url += `&year=${year}`;
        if (area) url += `&area=${encodeURIComponent(area)}`;

        return fetchWithTimeout(url)
            .then(res => res && res.ok ? res.json() : null)
            .then(data => {
                if (data && data.code === 1) {
                    return {
                        list: prefixVodItems(data.list || [], index),
                        pagecount: data.pagecount || 1,
                        total: data.total || 0
                    };
                }
                return null;
            })
            .catch(() => null);
    });
}

// ─── 영상 목록 조회 ─────────────────────────────────────────────────────────
export async function getVideoList(
    page: number = 1,
    typeId?: number,
    fastMode: boolean = false,
    year?: string,
    area?: string,
    sort?: string
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    try {
        let promises: Promise<{ list: VodItem[]; pagecount: number; total: number } | null>[] = [];
        const activeIndices = getRequestIndices(undefined, fastMode);

        if (!typeId) {
            promises = activeIndices.map((index) => {
                const base = ENDPOINTS[index];
                if (!base) return Promise.resolve(null);
                let url = `${base}?ac=detail&pg=${page}`;
                if (year) url += `&year=${year}`;
                if (area) url += `&area=${encodeURIComponent(area)}`;

                return fetchWithTimeout(url)
                    .then(res => res && res.ok ? res.json() : null)
                    .then(data => {
                        if (data && data.code === 1) {
                            return {
                                list: prefixVodItems(data.list || [], index),
                                pagecount: data.pagecount || 1,
                                total: data.total || 0
                            };
                        }
                        return null;
                    })
                    .catch(() => null);
            });
        } else {
            promises.push(...fetchTypeAcrossAPIs(page, typeId, fastMode, year, area, sort));
        }

        const results = await Promise.all(promises);
        let combinedList: VodItem[] = [];
        let maxPagecount = 1;
        let sumTotal = 0;

        results.forEach(res => {
            if (res) {
                combinedList = combinedList.concat(res.list);
                if (res.pagecount > maxPagecount) maxPagecount = res.pagecount;
                sumTotal += res.total;
            }
        });

        const uniqueMap = new Map();
        combinedList.forEach(item => {
            const name = (item.vod_name || '').trim();
            // 个别片源站会混入占位条目, 直接丢弃
            if (name && !name.includes('同步图片专用') && !uniqueMap.has(name)) {
                uniqueMap.set(name, item);
            }
        });
        combinedList = Array.from(uniqueMap.values());

        // 클라이언트 사이드 정렬 적용
        if (sort === 'hits') {
            combinedList.sort((a, b) => Number(b.vod_hits || 0) - Number(a.vod_hits || 0));
        } else if (sort === 'score') {
            combinedList.sort((a, b) => Number(b.vod_score || 0) - Number(a.vod_score || 0));
        } else if (sort === 'time') {
            combinedList.sort((a, b) => {
                const dateA = new Date(a.vod_time || 0).getTime();
                const dateB = new Date(b.vod_time || 0).getTime();
                return dateB - dateA;
            });
        }

        if (typeId && fastMode && combinedList.length === 0) {
            return await getVideoList(page, typeId, false, year, area, sort);
        }

        return {
            list: combinedList,
            pagecount: maxPagecount,
            total: sumTotal,
        };
    } catch {
        return { list: [], pagecount: 1, total: 0 };
    }
}

// ─── 영상 상세 조회 ─────────────────────────────────────────────────────────
export async function getVideoDetail(id: number | string): Promise<VodItem | null> {
    try {
        let apiIndex = 0; // 기본값: FFZY (index 0)
        let realId = String(id);

        if (typeof id === 'string' && id.includes('-')) {
            const parts = id.split('-');
            apiIndex = parseInt(parts[0], 10);
            realId = parts.slice(1).join('-');
        }

        // 片源站对非法 id (如 0) 会返回最新列表, 必须先校验, 否则会显示无关影片
        if (!/^\d+$/.test(realId) || Number(realId) <= 0 || !Number.isInteger(apiIndex) || !ENDPOINTS[apiIndex]) {
            return null;
        }
        const base = ENDPOINTS[apiIndex];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(`${base}?ac=detail&ids=${realId}`, {
            next: { revalidate: 300 },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data: ApiDetailResponse = await res.json();
        if (data.code !== 1 || !data.list?.length) return null;

        const item = data.list.find(v => String(v.vod_id) === realId);
        if (!item) return null;
        item.vod_id = `${apiIndex}-${item.vod_id}` as unknown as number;

        const otherPromises = ENDPOINTS.map((endpointBase, idx) => {
            if (idx === apiIndex || !endpointBase) return Promise.resolve(null);
            return fetchWithTimeout(`${endpointBase}?ac=detail&wd=${encodeURIComponent(item.vod_name)}`, 6000)
                .then(res => (res && res.ok ? res.json() : null))
                .then(searchData => {
                    if (searchData && searchData.code === 1 && searchData.list) {
                        return searchData.list.find((v: VodItem) => (v.vod_name || '').trim() === item.vod_name.trim()) || null;
                    }
                    return null;
                })
                .catch(() => null);
        });

        const otherResults = await Promise.all(otherPromises);
        const mergedFrom = item.vod_play_from ? item.vod_play_from.split('$$$').filter(Boolean) : [];
        const mergedUrl = item.vod_play_url ? item.vod_play_url.split('$$$').filter(Boolean) : [];

        otherResults.forEach(match => {
            if (match && match.vod_play_from && match.vod_play_url) {
                mergedFrom.push(...match.vod_play_from.split('$$$').filter(Boolean));
                mergedUrl.push(...match.vod_play_url.split('$$$').filter(Boolean));
            }
        });

        item.vod_play_from = mergedFrom.join('$$$');
        item.vod_play_url = mergedUrl.join('$$$');

        return item;
    } catch {
        return null;
    }
}

// ─── 검색 ───────────────────────────────────────────────────────────────────
export async function searchVideos(
    keyword: string,
    page: number = 1
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    try {
        const indices = getRequestIndices(undefined, false);
        const promises = indices.map((index) => {
            const base = ENDPOINTS[index];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            return fetch(
                `${base}?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`,
                { next: { revalidate: 60 }, signal: controller.signal }
            )
                .then(res => {
                    clearTimeout(timeoutId);
                    return res.ok ? res.json() : null;
                })
                .then(data => {
                    if (data && data.code === 1) {
                        return {
                            list: prefixVodItems(data.list || [], index),
                            pagecount: data.pagecount || 1,
                            total: data.total || 0
                        };
                    }
                    return null;
                })
                .catch(() => {
                    clearTimeout(timeoutId);
                    return null;
                });
        });

        const results = await Promise.all(promises);
        let combinedList: VodItem[] = [];
        let maxPagecount = 1;
        let sumTotal = 0;

        results.forEach(res => {
            if (res) {
                combinedList = combinedList.concat(res.list);
                if (res.pagecount > maxPagecount) maxPagecount = res.pagecount;
                sumTotal += res.total;
            }
        });

        const uniqueMapSearch = new Map();
        combinedList.forEach(item => {
            const name = (item.vod_name || '').trim();
            if (name && !uniqueMapSearch.has(name)) {
                uniqueMapSearch.set(name, item);
            }
        });
        combinedList = Array.from(uniqueMapSearch.values());

        combinedList.sort((a, b) => {
            const timeA = new Date(a.vod_time || 0).getTime();
            const timeB = new Date(b.vod_time || 0).getTime();
            return timeB - timeA;
        });

        return {
            list: combinedList,
            pagecount: maxPagecount,
            total: sumTotal,
        };
    } catch {
        return { list: [], pagecount: 1, total: 0 };
    }
}

// ─── 재생 소스 파싱 ─────────────────────────────────────────────────────────
export function parsePlaySources(vod: VodItem) {
    if (!vod.vod_play_from || !vod.vod_play_url) return [];

    const fromList = vod.vod_play_from.split('$$$');
    const urlList = vod.vod_play_url.split('$$$');
    const countMap = new Map();

    return fromList.map((nameRaw, i) => {
        let name = nameRaw || '默认源';
        let count = countMap.get(name) || 0;
        count++;
        countMap.set(name, count);
        if (count > 1) {
            name = `${name} ${count}`;
        }

        const episodesRaw = urlList[i] || '';
        const episodes = episodesRaw.split('#').map((ep) => {
            const parts = ep.split('$');
            return {
                name: parts[0]?.trim() || `第${i + 1}集`,
                url: parts[1]?.trim() || '',
            };
        }).filter((ep) => ep.url && (ep.url.includes('.m3u8') || ep.url.includes('.mp4')));
        return { name, episodes };
    }).filter(source => source.episodes.length > 0);
}
// ─── 분류별 피드 (하위 분류를 병합) ──────────────────────────────────────────
// 대부분의 소스는 최상위 type_id 로 요청하면 빈 목록을 돌려주고, 작품은 하위 장르에 들어 있다.
export async function getFeed(
    typeId: number,
    sort: 'hits' | 'time' = 'time',
    limit = 24
): Promise<VodItem[]> {
    const subs = getSubCategoryIds(typeId).slice(0, 6);
    const ids = subs.length > 0 ? subs : [typeId];
    const results = await Promise.all(
        ids.map(id => getVideoList(1, id, true, undefined, undefined, sort))
    );

    const seen = new Set<string>();
    const merged: VodItem[] = [];
    results.forEach(r =>
        r.list.forEach(v => {
            // 去掉标点和空白后再比较, 避免 "天命・成凰" 与 "天命成凰" 重复
            const key = (v.vod_name || '').replace(/[\s\p{P}\p{S}]/gu, '');
            if (key && v.vod_pic && !seen.has(key)) {
                seen.add(key);
                merged.push(v);
            }
        })
    );

    merged.sort((a, b) =>
        sort === 'hits'
            ? Number(b.vod_hits || 0) - Number(a.vod_hits || 0)
            : new Date(b.vod_time || 0).getTime() - new Date(a.vod_time || 0).getTime()
    );
    return merged.slice(0, limit);
}

// ─── 분류 목록 (상위 분류는 하위 분류를 병합해서 페이지 단위로 조회) ───────────
const LISTING_PAGE_SIZE = 60;
export async function getTypeListing(
    page: number,
    typeId: number,
    year?: string,
    area?: string,
    sort?: string
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    const subs = getSubCategoryIds(typeId);
    if (subs.length === 0) return getVideoList(page, typeId, false, year, area, sort);

    // 每个子分类各取一页再合并。完整模式下 8 个子分类 x 多个片源会得到 300+ 条, 一页渲染过重,
    // 这里用快速模式并限制每页数量; 想看完整列表可以进入具体子分类。
    const results = await Promise.all(subs.map(id => getVideoList(page, id, true, year, area, sort)));
    const seen = new Set<string>();
    const list: VodItem[] = [];
    let pagecount = 1;
    let total = 0;
    results.forEach(r => {
        pagecount = Math.max(pagecount, r.pagecount);
        total += r.total;
        r.list.forEach(v => {
            const key = (v.vod_name || '').replace(/[\s\p{P}\p{S}]/gu, '');
            if (key && !seen.has(key)) {
                seen.add(key);
                list.push(v);
            }
        });
    });

    if (sort === 'score') list.sort((a, b) => Number(b.vod_score || 0) - Number(a.vod_score || 0));
    else if (sort === 'time') list.sort((a, b) => new Date(b.vod_time || 0).getTime() - new Date(a.vod_time || 0).getTime());
    else list.sort((a, b) => Number(b.vod_hits || 0) - Number(a.vod_hits || 0));
    return { list: list.slice(0, LISTING_PAGE_SIZE), pagecount, total };
}
