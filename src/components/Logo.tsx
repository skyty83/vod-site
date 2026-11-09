// 品牌标志: 猫头剪影, 脸上是播放键。
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="var(--accent)" />
      <path
        d="M12.5 8.5 L20.5 15 Q24 13.8 27.5 15 L35.5 8.5 Q39.5 15.5 39.5 25 C39.5 33.6 32.6 40 24 40 C15.4 40 8.5 33.6 8.5 25 Q8.5 15.5 12.5 8.5 Z"
        fill="var(--on-accent)"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M20.8 22.6 L20.8 33.4 L30.2 28 Z" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8" />
      <span className="text-[21px] font-black leading-none tracking-[-0.04em] text-ink">喵喵影视</span>
    </span>
  );
}
