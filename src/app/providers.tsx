 'use client';

import { ThemeProvider } from 'next-themes';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';

const resources = {
  zh: {
    translation: {
      lang: { label: '语言', zh: '中文', ko: '韩文', en: '英文' },
      nav: {
        home: '首页',
        movies: '电影',
        series: '连续剧',
        variety: '综艺',
        anime: '动漫',
        short: '短剧',
        sports: '体育',
        live: '电视直播',
        music: '音乐',
      },
      common: {
        all: '全部',
        allWith: '全部{{name}}',
        viewAll: '查看全部',
        loadingContent: '正在加载精彩内容...',
        search: '搜索',
      },
      search: {
        placeholderVideo: '搜索影视...',
        placeholderMovie: '搜索影片...',
      },
      sort: { recent: '最新', hot: '热播' },
      filter: { allYears: '全部年份' },
      vod: {
        backHome: '返回首页',
        play: '立即播放',
        nowPlaying: '正片播放',
        synopsis: '剧情简介',
        noSynopsis: '暂无剧情介绍',
        director: '导演',
        actor: '主演',
        vipTitle: '喵喵影视 VIP',
        vipDesc: '1080P 高清无广告 · 极速线路',
        vipCta: '立即解锁特权',
      },
    },
  },
  ko: {
    translation: {
      lang: { label: '언어', zh: '中文', ko: '한국어', en: 'English' },
      nav: {
        home: '홈',
        movies: '영화',
        series: '드라마',
        variety: '예능',
        anime: '애니',
        short: '숏폼',
        sports: '스포츠',
        live: '라이브 TV',
        music: '음악',
      },
      common: {
        all: '전체',
        allWith: '{{name}} 전체',
        viewAll: '전체 보기',
        loadingContent: '콘텐츠를 불러오는 중...',
        search: '검색',
      },
      search: {
        placeholderVideo: '영상 검색...',
        placeholderMovie: '작품 검색...',
      },
      sort: { recent: '최신', hot: '인기' },
      filter: { allYears: '전체 연도' },
      vod: {
        backHome: '홈으로',
        play: '바로 재생',
        nowPlaying: '재생',
        synopsis: '소개',
        noSynopsis: '소개가 없어요.',
        director: '감독',
        actor: '출연',
        vipTitle: '프리미엄',
        vipDesc: '1080P · 광고 없음 · 빠른 라인',
        vipCta: '혜택 잠금해제',
      },
    },
  },
  en: {
    translation: {
      lang: { label: 'Language', zh: '中文', ko: '한국어', en: 'English' },
      nav: {
        home: 'Home',
        movies: 'Movies',
        series: 'Series',
        variety: 'Variety',
        anime: 'Anime',
        short: 'Shorts',
        sports: 'Sports',
        live: 'Live TV',
        music: 'Music',
      },
      common: {
        all: 'All',
        allWith: 'All {{name}}',
        viewAll: 'View all',
        loadingContent: 'Loading…',
        search: 'Search',
      },
      search: {
        placeholderVideo: 'Search videos…',
        placeholderMovie: 'Search…',
      },
      sort: { recent: 'Latest', hot: 'Trending' },
      filter: { allYears: 'All years' },
      vod: {
        backHome: 'Back',
        play: 'Play',
        nowPlaying: 'Now playing',
        synopsis: 'Synopsis',
        noSynopsis: 'No synopsis available.',
        director: 'Director',
        actor: 'Cast',
        vipTitle: 'Premium',
        vipDesc: '1080P · No ads · Fast lines',
        vipCta: 'Unlock',
      },
    },
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'zh',
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null;
    const navLang = typeof navigator !== 'undefined' ? navigator.language : 'zh';
    const detected = stored || (navLang.startsWith('ko') ? 'ko' : navLang.startsWith('en') ? 'en' : 'zh');
    if (i18n.language !== detected) i18n.changeLanguage(detected);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
}
