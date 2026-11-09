import { getFeed } from '@/lib/api';
import { stripHtml } from '@/lib/format';
import { VodItem } from '@/types';
import HeroStage, { HeroItem } from './HeroStage';

function toItem(v: VodItem): HeroItem {
  return {
    id: String(v.vod_id),
    name: v.vod_name,
    pic: v.vod_pic,
    meta: [v.vod_year, v.vod_area, v.type_name].filter((x): x is string => !!x),
    remarks: v.vod_remarks || undefined,
    blurb: stripHtml(v.vod_blurb || v.vod_content).slice(0, 120) || undefined,
  };
}

// 按"今天的日期"做种子的伪随机: 每天换一批, 同一天里所有人看到的一样
function todaySeed(): number {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date()); // YYYY-MM-DD
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) h = Math.imul(h ^ day.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seededShuffle<T>(list: T[], seed: number): T[] {
  let a = seed;
  const rand = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default async function Hero() {
  const [movies, series] = await Promise.all([getFeed(1, 'hits', 24), getFeed(2, 'hits', 24)]);
  const year = new Date().getFullYear();
  const seed = todaySeed();
  // 从热门前 24 部里按日期洗牌挑选; 优先近两年且有简介的作品, 电影 3 部 + 剧集 2 部交替
  const good = (v: VodItem) => v.vod_pic && Number(v.vod_year) >= year - 1 && stripHtml(v.vod_blurb || v.vod_content).length > 20;
  const pick = (list: VodItem[], k: number, salt: number) =>
    [
      ...seededShuffle(list.filter(good), seed + salt),
      ...seededShuffle(list.filter(v => !good(v) && v.vod_pic), seed + salt + 1),
    ].slice(0, k);
  const m = pick(movies, 3, 0);
  const s = pick(series, 2, 7);
  const mixed = [m[0], s[0], m[1], s[1], m[2]].filter((v): v is VodItem => !!v);

  if (mixed.length === 0) return null;
  return <HeroStage items={mixed.map(toItem)} />;
}
