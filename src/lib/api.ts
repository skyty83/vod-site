import { ApiDetailResponse, CategoryItem, VodItem } from '@/types';

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
    34: [34, 25, 22, 55, 39, undefined, undefined], // 伦理片

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

// ─── 정적 카테고리 목록 ───────────────────────────────────────────────────────
// type_pid: 0 = 최상위, 그 외 = 부모 카테고리 ID
const STATIC_CATEGORIES: CategoryItem[] = [
    // 최상위
    { type_id: 1, type_pid: 0, type_name: '电影' },
    { type_id: 2, type_pid: 0, type_name: '连续剧' },
    { type_id: 3, type_pid: 0, type_name: '综艺' },
    { type_id: 4, type_pid: 0, type_name: '动漫' },
    { type_id: 36, type_pid: 0, type_name: '短剧' },

    // 영화 하위
    { type_id: 6, type_pid: 1, type_name: '动作片' },
    { type_id: 7, type_pid: 1, type_name: '喜剧片' },
    { type_id: 8, type_pid: 1, type_name: '爱情片' },
    { type_id: 9, type_pid: 1, type_name: '科幻片' },
    { type_id: 10, type_pid: 1, type_name: '恐怖片' },
    { type_id: 11, type_pid: 1, type_name: '剧情片' },
    { type_id: 12, type_pid: 1, type_name: '战争片' },
    { type_id: 20, type_pid: 1, type_name: '纪录片' },
    { type_id: 34, type_pid: 1, type_name: '伦理片' },

    // 드라마 하위
    { type_id: 13, type_pid: 2, type_name: '国产剧' },
    { type_id: 14, type_pid: 2, type_name: '香港剧' },
    { type_id: 15, type_pid: 2, type_name: '韩国剧' },
    { type_id: 16, type_pid: 2, type_name: '欧美剧' },
    { type_id: 21, type_pid: 2, type_name: '台湾剧' },
    { type_id: 22, type_pid: 2, type_name: '日本剧' },
    { type_id: 23, type_pid: 2, type_name: '海外剧' },
    { type_id: 24, type_pid: 2, type_name: '泰国剧' },

    // 예능 하위
    { type_id: 25, type_pid: 3, type_name: '大陆综艺' },
    { type_id: 26, type_pid: 3, type_name: '港台综艺' },
    { type_id: 27, type_pid: 3, type_name: '日韩综艺' },
    { type_id: 28, type_pid: 3, type_name: '欧美综艺' },

    // 애니 하위
    { type_id: 29, type_pid: 4, type_name: '国产动漫' },
    { type_id: 30, type_pid: 4, type_name: '日韩动漫' },
    { type_id: 31, type_pid: 4, type_name: '欧美动漫' },
    { type_id: 32, type_pid: 4, type_name: '港台动漫' },

    // 스포츠
    { type_id: 48, type_pid: 0, type_name: '体育赛事' },
    { type_id: 49, type_pid: 48, type_name: '篮球' },
    { type_id: 50, type_pid: 48, type_name: '足球' },
];

export async function getCategories(): Promise<CategoryItem[]> {
    try {
        const base = ENDPOINTS[3];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`${base}?ac=detail&pg=1`, { signal: controller.signal, cache: 'no-store' });
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

export function getSubCategoryIds(parentId: number): number[] {
    return STATIC_CATEGORIES
        .filter(c => c.type_pid === parentId)
        .map(c => c.type_id);
}

// ─── 타임아웃 fetch 래퍼 ──────────────────────────────────────────────────
function fetchWithTimeout(
    url: string,
    timeoutMs = 12000
): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { signal: controller.signal, cache: 'no-store' })
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
            if (name && !uniqueMap.has(name)) {
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

        const base = ENDPOINTS[apiIndex] ?? ENDPOINTS[0];

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

        const item = data.list[0];
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
        let mergedFrom = item.vod_play_from ? item.vod_play_from.split('$$$').filter(Boolean) : [];
        let mergedUrl = item.vod_play_url ? item.vod_play_url.split('$$$').filter(Boolean) : [];

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