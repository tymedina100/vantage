import Link from "next/link";

type BrandMarkProps = { className?: string; label?: string };

export function BrandMark({ className, label }: BrandMarkProps) {
  return (
    <svg aria-hidden={label ? undefined : true} aria-label={label} className={className} viewBox="0 0 152 128" fill="none" role={label ? "img" : undefined} xmlns="http://www.w3.org/2000/svg">
      <path d="M6 28h20l25 52 12-23 12 23 25-52h20L83 108H69L6 28Z" fill="currentColor" opacity=".92" />
      <path d="M41 28h18l17 36 17-36h18l-35 73L41 28Z" fill="currentColor" opacity=".58" />
      <path d="M67 42 76 8l20 34-11-2v28L76 88V40l-9 2Z" fill="currentColor" />
      <path d="M24 113h104l-5 9H29l-5-9Z" fill="currentColor" opacity=".76" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-lockup" aria-label="Worthlane home"><BrandMark className="brand-mark" />{!compact && <span>Worthlane</span>}</Link>;
}
