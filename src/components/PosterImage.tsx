'use client';

import { useState } from 'react';

// 部分图床会拦截带 Referer 的请求, 所以统一 no-referrer; 加载失败时显示占位
export default function PosterImage({ src, alt, eager = false, className = 'h-full w-full object-cover' }: { src?: string; alt: string; eager?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  // 图片可能在 React 水合之前就已失败, 此时 onError 不会触发, 挂载时补查一次
  const check = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  };

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card-2 text-4xl font-black text-sub/60" aria-label={alt}>
        喵
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={check}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
