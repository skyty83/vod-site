// 观看记录: 只存展示所需的最小字段, 不再把整条播放地址塞进 localStorage
export interface HistoryItem {
  id: string | number;
  name: string;
  pic: string;
  type?: string;
  ep?: string;
  /** 播放源名称, 用于回到详情页时恢复到同一线路 */
  src?: string;
  at: number;
}

const KEY = 'meow_history_v1';
const EVENT = 'meow-history';
const LIMIT = 30;

export function readHistoryRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function parseHistory(raw: string): HistoryItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function write(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 隐私模式或配额已满时忽略 */
  }
}

export function addHistory(item: Omit<HistoryItem, 'at'>) {
  const current = parseHistory(readHistoryRaw());
  const prev = current.find(i => String(i.id) === String(item.id));
  const next = [
    { ...prev, ...item, ep: item.ep ?? prev?.ep, src: item.src ?? prev?.src, at: Date.now() },
    ...current.filter(i => String(i.id) !== String(item.id)),
  ].slice(0, LIMIT);
  write(next);
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* noop */
  }
}

export function subscribeHistory(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}
