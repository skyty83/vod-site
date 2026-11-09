// 断点续播: 按剧集记录播放位置。只保留最近 LIMIT 条, 看完 (剩余 < 15 秒) 的记录会被删掉。
const KEY = 'meow_progress_v1';
const LIMIT = 200;

type Store = Record<string, { t: number; at: number }>;

function read(): Store {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    const entries = Object.entries(store).sort((a, b) => b[1].at - a[1].at).slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* 隐私模式或配额已满 */
  }
}

export function getProgress(key: string): number {
  return read()[key]?.t ?? 0;
}

export function saveProgress(key: string, t: number, duration: number) {
  if (!key || !Number.isFinite(t) || !Number.isFinite(duration) || duration <= 0) return;
  const store = read();
  if (t < 5 || t > duration - 15) delete store[key];
  else store[key] = { t: Math.floor(t), at: Date.now() };
  write(store);
}

// 播放器偏好: 音量 / 静音 / 倍速
const PREFS_KEY = 'meow_player_prefs_v1';
export interface PlayerPrefs {
  volume: number;
  muted: boolean;
  rate: number;
}

export function readPrefs(): Partial<PlayerPrefs> {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export function writePrefs(prefs: PlayerPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
}
