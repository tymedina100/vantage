import Link from "next/link";
import { BrandLockup } from "@/components/brand";

export function LegalHeader() {
  return <header className="legal-header"><div className="site-container legal-header__inner"><BrandLockup /><Link className="text-link" href="/support">Support</Link></div></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="site-container site-footer__inner"><BrandLockup /><div className="site-footer__links" aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/support">Support</Link></div><p>© {new Date().getFullYear()} Worthlane</p></div></footer>;
}
