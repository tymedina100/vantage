import type { Metadata } from "next";
import Link from "next/link";
import { LegalHeader, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Support", description: "Get help with Worthlane and find launch-ready answers." };
const CONTACT_EMAIL = "support@worthlane.app";
const faqs = [
  ["How do I get Worthlane?", "Worthlane is preparing for its iPhone launch. Follow the App Store link on the home page to download it when the release is live."],
  ["How do I start tracking my money?", "Version 1 starts with manual accounts and transactions. Add the balances you want to understand, then use budgets and goals to build your picture."],
  ["Can I connect my bank?", "Automatic bank linking is coming soon and is not available in version 1."],
  ["Can I delete my account?", "Yes. Open Profile in the app and choose Delete account. This permanently removes your account and associated data."],
  ["What does the assistant do?", "The in-app assistant uses your Worthlane financial context to answer questions about spending, budgets, and goals. It cannot make transactions on your behalf."],
];

export default function SupportPage() {
  return <><LegalHeader /><main className="legal-page"><article className="site-container legal-copy"><p className="eyebrow">Worthlane support</p><h1>How can we help?</h1><p>For account or launch questions, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Including your device model and iOS version helps us investigate an issue quickly.</p><section><h2>Frequently asked questions</h2>{faqs.map(([question, answer]) => <details className="support-details" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section><section><h2>Need a hand?</h2><p><a href={`mailto:${CONTACT_EMAIL}`}>Email Worthlane support</a> and we will help you find the right next step.</p></section></article></main><SiteFooter /></>;
}
