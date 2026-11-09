'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 简介: 超过一定长度时先折叠
export default function Synopsis({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 140;

  return (
    <div className="mt-8 max-w-[68ch]">
      <h2 className="text-xs font-bold text-sub">剧情简介</h2>
      <p className={`mt-2.5 text-base leading-[1.85] text-ink/85 sm:text-[17px] ${long && !open ? 'line-clamp-4' : ''}`}>{text}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-pop hover:underline"
        >
          {open ? '收起' : '展开全部'}
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
