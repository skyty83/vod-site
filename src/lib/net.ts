import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

// 判断地址是否属于内网/回环/链路本地等不应被代理访问的网段 (防 SSRF)
function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb');
}

/** 只允许 http(s) 且解析到公网地址的 URL */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlRejected('Bad url');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new UrlRejected('Protocol not allowed');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addrs.length === 0) throw new UrlRejected('Host not resolvable');
  if (addrs.some(a => isPrivateAddress(a.address))) throw new UrlRejected('Host not allowed');
  return url;
}

export class UrlRejected extends Error {}

/** 手动跟随重定向, 每一跳都重新校验目标地址 */
export async function safeFetch(raw: string, init: RequestInit = {}, maxRedirects = 3): Promise<Response> {
  let current = raw;
  for (let i = 0; i <= maxRedirects; i++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, { ...init, redirect: 'manual' });
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, url).toString();
      continue;
    }
    return res;
  }
  throw new UrlRejected('Too many redirects');
}
