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

// 빠른 로딩을 위해 홈화면에서는 2개 API만 사용 (FFZY=0, Guangsu=1)
const FAST_MODE_INDICES = [0, 1];

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
    1:  [1,   1,   1,   1,   7,   2,   1  ], // 电影片
    6:  [6,   6,   6,   6,   10,  2,   undefined], // 动作片
    7:  [7,   7,   12,  7,   11,  2,   undefined], // 喜剧片
    8:  [8,   8,   7,   8,   12,  2,   undefined], // 爱情片
    9:  [9,   9,   8,   9,   13,  2,   undefined], // 科幻片
    10: [10,  11,  11,  10,  14,  2,   undefined], // 恐怖片
    11: [11,  10,  10,  11,  15,  2,   undefined], // 剧情片
    12: [12,  12,  9,   12,  16,  2,   undefined], // 战争片
    20: [20,  24,  5,   20,  24,  undefined, undefined], // 记录片
    34: [34,  25,  22,  55,  39,  undefined, undefined], // 伦理片

    // ── 드라마 ──
    2:  [2,   2,   2,   2,   8,   1,   2  ], // 连续剧
    13: [13,  13,  14,  13,  26,  20,  undefined], // 国产剧
    14: [14,  15,  18,  17,  27,  4,   undefined], // 香港剧
    15: [15,  16,  16,  15,  28,  5,   undefined], // 韩国剧
    16: [16,  14,  17,  14,  29,  3,   undefined], // 欧美剧
    21: [21,  22,  15,  18,  30,  undefined, undefined], // 台湾剧
    22: [22,  21,  20,  16,  31,  6,   undefined], // 日本剧
    23: [23,  undefined, undefined, 23, 32, undefined, undefined], // 海外剧
    24: [24,  23,  21,  19,  33,  7,   undefined], // 泰国剧
    36: [36,  31,  27,  54,  38,  undefined, undefined], // 短剧

    // ── 예능 ──
    3:  [3,   3,   4,   3,   9,   27,  undefined], // 综艺片
    25: [25,  3,   4,   25,  34,  27,  undefined], // 大陆综艺
    26: [26,  3,   4,   27,  35,  27,  undefined], // 港台综艺
    27: [27,  3,   4,   26,  36,  27,  undefined], // 日韩综艺
    28: [28,  3,   4,   28,  37,  27,  undefined], // 欧美综艺

    // ── 애니메이션 ──
    4:  [4,   4,   3,   4,   40,  24,  undefined], // 动漫片
    29: [29,  4,   24,  29,  1,   24,  undefined], // 国产动漫
    30: [30,  4,   25,  30,  2,   25,  undefined], // 日韩动漫
    31: [31,  4,   26,  31,  3,   undefined, undefined], // 欧美动漫
    32: [32,  4,   undefined, 44, 4,   undefined, undefined], // 港台动漫
    33: [33,  4,   undefined, 45, undefined, undefined, undefined], // 海外动漫

    // ── 스포츠 (Subocj=2, Wsyzy=3 전용) ──
    48: [undefined, undefined, 23, 48, undefined, undefined, undefined], // 体育赛事
    49: [undefined, undefined, 30, 49, undefined, undefined, undefined], // 篮球
    50: [undefined, undefined, 29, 50, undefined, undefined, undefined], // 足球
};

// ─── 정적 카테고리 목록 ───────────────────────────────────────────────────────
// type_pid: 0 = 최상위, 그 외 = 부모 카테고리 ID
const STATIC_CATEGORIES: CategoryItem[] = [
    // 최상위
    { type_id: 1,  type_pid: 0,  type_name: '电影'  },
    { type_id: 2,  type_pid: 0,  type_name: '连续剧' },
    { type_id: 3,  type_pid: 0,  type_name: '综艺'  },
    { type_id: 4,  type_pid: 0,  type_name: '动漫'  },
    { type_id: 36, type_pid: 0,  type_name: '短剧'  },

    // 영화 하위
    { type_id: 6,  type_pid: 1,  type_name: '动作片' },
    { type_id: 7,  type_pid: 1,  type_name: '喜剧片' },
    { type_id: 8,  type_pid: 1,  type_name: '爱情片' },
    { type_id: 9,  type_pid: 1,  type_name: '科幻片' },
    { type_id: 10, type_pid: 1,  type_name: '恐怖片' },
    { type_id: 11, type_pid: 1,  type_name: '剧情片' },
    { type_id: 12, type_pid: 1,  type_name: '战争片' },
    { type_id: 20, type_pid: 1,  type_name: '记录片' },
    { type_id: 34, type_pid: 1,  type_name: '伦理片' },

    // 드라마 하위
    { type_id: 13, type_pid: 2,  type_name: '国产剧' },
    { type_id: 14, type_pid: 2,  type_name: '香港剧' },
    { type_id: 15, type_pid: 2,  type_name: '韩国剧' },
    { type_id: 16, type_pid: 2,  type_name: '欧美剧' },
    { type_id: 21, type_pid: 2,  type_name: '台湾剧' },
    { type_id: 22, type_pid: 2,  type_name: '日本剧' },
    { type_id: 23, type_pid: 2,  type_name: '海外剧' },
    { type_id: 24, type_pid: 2,  type_name: '泰国剧' },

    // 예능 하위
    { type_id: 25, type_pid: 3,  type_name: '大陆综艺' },
    { type_id: 26, type_pid: 3,  type_name: '港台综艺' },
    { type_id: 27, type_pid: 3,  type_name: '日韩综艺' },
    { type_id: 28, type_pid: 3,  type_name: '欧美综艺' },

    // 애니 하위
    { type_id: 29, type_pid: 4,  type_name: '国产动漫' },
    { type_id: 30, type_pid: 4,  type_name: '日韩动漫' },
    { type_id: 31, type_pid: 4,  type_name: '欧美动漫' },
    { type_id: 32, type_pid: 4,  type_name: '港台动漫' },

    // 스포츠
    { type_id: 48, type_pid: 0,  type_name: '体育赛事' },
    { type_id: 49, type_pid: 48, type_name: '篮球' },
    { type_id: 50, type_pid: 48, type_name: '足球' },
];

export async function getCategories(): Promise<CategoryItem[]> {
    return STATIC_CATEGORIES;
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
    year?: string
): Promise<{ list: VodItem[]; pagecount: number; total: number } | null>[] {
    const indices = fastMode ? FAST_MODE_INDICES : ENDPOINTS.map((_, i) => i);
    return indices.map((index) => {
        const base = ENDPOINTS[index];
        const mappedIds = CATEGORY_MAP[typeId];
        const targetTypeId = mappedIds ? mappedIds[index] : typeId;
        if (targetTypeId === undefined || !base) return Promise.resolve(null);

        let url = `${base}?ac=detail&pg=${page}&t=${targetTypeId}`;
        if (year) url += `&year=${year}`;
        
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
    year?: string
): Promise<{ list: VodItem[]; pagecount: number; total: number }> {
    try {
        let promises: Promise<{ list: VodItem[]; pagecount: number; total: number } | null>[] = [];
        const activeIndices = fastMode ? FAST_MODE_INDICES : ENDPOINTS.map((_, i) => i);

        if (!typeId) {
            promises = activeIndices.map((index) => {
                const base = ENDPOINTS[index];
                if (!base) return Promise.resolve(null);
                let url = `${base}?ac=detail&pg=${page}`;
                if (year) url += `&year=${year}`;
                
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
            promises.push(...fetchTypeAcrossAPIs(page, typeId, fastMode, year));
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
        const promises = ENDPOINTS.map((base, index) => {
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