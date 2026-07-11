import Link from "next/link";

type BrandMarkProps = { className?: string; label?: string };

export function BrandMark({ className, label }: BrandMarkProps) {
  return (
    <svg aria-hidden={label ? undefined : true} aria-label={label} className={className} viewBox="0 0 160 132" fill="none" role={label ? "img" : undefined} xmlns="http://www.w3.org/2000/svg">
      <path d="M16 27 51 105 78 49" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
      <path d="m144 27-35 78-27-56" stroke="currentColor" strokeWidth="14" strokeLinejoin="miter" />
      <path d="M73 94V48l-16 7L80 12l23 43-16-7v46H73Z" fill="currentColor" />
      <path d="M31 117h98" stroke="currentColor" strokeWidth="12" />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-lockup" aria-label="Worthlane home"><BrandMark className="brand-mark" />{!compact && <span>Worthlane</span>}</Link>;
}
