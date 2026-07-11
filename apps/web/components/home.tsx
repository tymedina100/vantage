"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { AnalyticsLink } from "@/components/analytics-link";
import { BrandLockup, BrandMark } from "@/components/brand";
import { SiteFooter } from "@/components/site-chrome";

const APP_STORE_URL = "https://apps.apple.com/app/id6766112205";

const benefits = [
  ["01", "See the whole picture", "Bring your balances, transactions, budgets, and goals into one calm place—starting with the accounts you add yourself.", "overview"],
  ["02", "Make the next choice easier", "Budgets show what remains before it disappears, so a decision today stays connected to the goal you set.", "budget"],
  ["03", "Keep your momentum visible", "Check-ins, nudges, and streaks turn the small actions behind a stronger money routine into something you can see.", "streak"],
];

const demos = [
  ["Budget", "Know what your budget still protects.", "Set a category amount, then see what is left for the rest of the month—not just what has already gone.", "budget"],
  ["Goals", "Put a destination next to your daily choices.", "Track progress toward a savings, debt-payoff, or purchase goal and add contributions as you go.", "goals"],
  ["Assistant", "Ask about your own money in plain English.", "The in-app assistant uses your Worthlane financial context to help you understand spending, budgets, and goals.", "assistant"],
];

const faqs = [
  ["What does Worthlane do?", "Worthlane is a personal finance app for tracking accounts and transactions, managing budgets and goals, viewing net worth, and building consistent money habits."],
  ["Is Worthlane available yet?", "Worthlane is preparing for its iPhone launch. The App Store page is the place to download it when the release is live."],
  ["Does Worthlane connect to my bank?", "Automatic bank linking is coming soon. Version 1 lets you add manual accounts and transactions so you can start building your financial picture now."],
  ["What is the AI assistant for?", "The assistant answers questions using the financial context in your Worthlane account. It is designed to explain your money picture; it cannot move money or make transactions for you."],
  ["Can I delete my information?", "Yes. Account deletion is available inside the app, and linked account data can be removed from your profile."],
  ["Is Worthlane free?", "Worthlane is planned as a free iPhone download. Any future paid features will be clearly explained in the app before you choose them."],
];

function Arrow() { return <span aria-hidden="true">?</span>; }

function ProductPreview({ mode = "overview" }: { mode?: string }) {
  const active = mode === "budget" ? "Food & dining" : mode === "goals" ? "Emergency fund" : "Your next step";
  const value = mode === "budget" ? "$164 left" : mode === "goals" ? "42% funded" : "Worth protecting";
  return <div className={`phone-preview phone-preview--${mode}`} aria-label="Illustrative Worthlane app screen">
    <div className="phone-preview__top"><span>9:41</span><span>? ? ?</span></div>
    <div className="phone-preview__heading"><span>Good morning</span><strong>{mode === "assistant" ? "Let’s look closer." : "Your money, in view."}</strong></div>
    <div className="phone-preview__balance"><span>Net worth</span><strong>$24,860</strong><small>Example balance</small></div>
    <div className="phone-preview__chart" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
    <div className="phone-preview__insight"><span>{active}</span><strong>{value}</strong><div><b /><em /></div></div>
    {mode === "assistant" ? <div className="phone-preview__message"><span>Worthlane</span><p>Your dining budget has room, but it would take away from this month’s goal.</p></div> : <div className="phone-preview__rows"><p><span>Daily check-in</span><b>7 days</b></p><p><span>Goals in progress</span><b>2</b></p></div>}
    <div className="phone-preview__nav" aria-hidden="true"><i /><i /><i className="active" /><i /><i /></div>
  </div>;
}

export default function Home() {
  const [openMenu, setOpenMenu] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const demo = demos[activeDemo];
  return <div className="site-shell">
    <header className="site-header"><nav className="site-container site-nav" aria-label="Primary navigation"><BrandLockup /><button className="menu-toggle" onClick={() => setOpenMenu(!openMenu)} aria-expanded={openMenu} aria-controls="site-menu"><span className="sr-only">Toggle navigation</span><i /><i /></button><div className={`site-nav__links ${openMenu ? "is-open" : ""}`} id="site-menu"><a href="#product" onClick={() => setOpenMenu(false)}>Product</a><a href="#how-it-works" onClick={() => setOpenMenu(false)}>How it works</a><a href="#privacy" onClick={() => setOpenMenu(false)}>Privacy</a><a href="#faq" onClick={() => setOpenMenu(false)}>FAQ</a><AnalyticsLink className="button button--small" event="primary_cta_clicked" eventLocation="navigation" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Download <Arrow /></AnalyticsLink></div></nav></header>
    <main>
      <section className="hero"><div className="hero__glow" /><div className="site-container hero__grid"><div className="hero__copy"><p className="eyebrow"><span /> Launching soon on iPhone</p><h1>Build a money routine that <em>moves you forward.</em></h1><p className="hero__lede">Worthlane brings your accounts, budgets, goals, and daily decisions into one clear path—so you can spend with more intention and keep the progress you make.</p><div className="hero__actions"><AnalyticsLink className="button" event="primary_cta_clicked" eventLocation="hero" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Download Worthlane <Arrow /></AnalyticsLink><AnalyticsLink className="text-cta" event="secondary_cta_clicked" eventLocation="hero" href="#product">Explore the product <Arrow /></AnalyticsLink></div><p className="hero__note">Free iPhone download · Manual tracking from day one</p></div><div className="hero__product"><ProductPreview /><div className="hero__orbit hero__orbit--one" /><div className="hero__orbit hero__orbit--two" /><p className="hero__caption">An illustrative preview of the Worthlane experience</p></div></div></section>
      <section className="proof-bar" aria-label="Worthlane capabilities"><div className="site-container"><span>Manual account tracking</span><i /><span>Goal-first budgets</span><i /><span>Personalized money context</span><i /><span>Bank linking coming soon</span></div></section>
      <section className="section section--intro" id="product"><div className="site-container section-heading section-heading--center"><p className="eyebrow">Built for the moment before you spend</p><h2>Your money deserves more than a rear-view mirror.</h2><p>Worthlane gives you a practical place to see what matters now: the balance you are building, the budget you still have, and the habits carrying you forward.</p></div><div className="site-container benefit-grid">{benefits.map(([number, title, body, visual]) => <article className="benefit-card" key={title}><span className="benefit-card__number">{number}</span><h3>{title}</h3><p>{body}</p><div className={`benefit-visual benefit-visual--${visual}`} aria-hidden="true"><span /><span /><span /><span /></div></article>)}</div></section>
      <section className="section walkthrough"><div className="site-container walkthrough__grid"><div><p className="eyebrow">A closer look</p><h2>Clear tools for the decisions you make every day.</h2><div className="demo-tabs" role="tablist" aria-label="Worthlane product areas">{demos.map(([label], index) => <button key={label} role="tab" aria-selected={index === activeDemo} className={index === activeDemo ? "is-active" : ""} onClick={() => { setActiveDemo(index); track("product_demo_selected", { demo: label.toLowerCase() }); }}>{label}</button>)}</div><div className="demo-copy"><p className="demo-copy__count">0{activeDemo + 1} / 03</p><h3>{demo[1]}</h3><p>{demo[2]}</p></div></div><div className="walkthrough__visual"><ProductPreview mode={demo[3]} /></div></div></section>
      <section className="section how-it-works" id="how-it-works"><div className="site-container"><div className="section-heading"><p className="eyebrow">A simpler starting line</p><h2>Start with what you know. Build from there.</h2></div><ol className="steps"><li><span>01</span><div><h3>Add accounts manually</h3><p>Start with the balances you want to understand. Add transactions as they happen and make your financial picture yours.</p></div></li><li><span>02</span><div><h3>Set the guardrails</h3><p>Create a budget and add a goal that gives each decision a clear place to land.</p></div></li><li><span>03</span><div><h3>Keep showing up</h3><p>Use daily check-ins, nudges, and streaks to keep the routine you are building visible.</p></div></li></ol></div></section>
      <section className="section trust" id="privacy"><div className="site-container trust__grid"><div className="trust__mark"><BrandMark /><span>Privacy is part of the path.</span></div><div><p className="eyebrow">A straightforward approach to data</p><h2>Built to help you understand your money—not make decisions for you.</h2><p>Worthlane uses the information in your account to power features such as budgets, goals, insights, and the financial assistant. You control your account and can request deletion from inside the app.</p><p>Automatic bank linking is planned for a future release. When it is available, Worthlane will use Plaid for the connection flow; Worthlane does not receive or store your bank credentials.</p><div className="trust__links"><Link href="/privacy">Read privacy policy <Arrow /></Link><Link href="/support">Visit support <Arrow /></Link></div></div></div></section>
      <section className="section difference"><div className="site-container difference__grid"><div><p className="eyebrow">A better way forward</p><h2>Less setup theater. More useful context.</h2></div><div className="difference__list"><p><b>A spreadsheet</b><span>Useful, but easy to stop opening when life gets busy.</span></p><p><b>A bank dashboard</b><span>Shows transactions. Not the budget or habit behind the next choice.</span></p><p><b>Doing nothing</b><span>Leaves every decision disconnected from the progress you want to keep.</span></p><p className="difference__answer"><b>Worthlane</b><span>A focused place to make your financial picture clearer, one small action at a time.</span></p></div></div></section>
      <section className="section faq" id="faq"><div className="site-container faq__grid"><div><p className="eyebrow">Questions, answered</p><h2>Everything you need to know before launch.</h2><p>Still have a question? <Link href="/support">Get in touch with support.</Link></p></div><div>{faqs.map(([question, answer]) => <details key={question} onToggle={(event) => { if ((event.currentTarget as HTMLDetailsElement).open) track("faq_opened", { question }); }}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>
      <section className="closing-cta"><div className="site-container"><BrandMark /><p className="eyebrow">Launching soon on iPhone</p><h2>Make your next money move a more intentional one.</h2><p>Download Worthlane when it arrives and start building your financial picture, one clear step at a time.</p><AnalyticsLink className="button button--light" event="primary_cta_clicked" eventLocation="closing_cta" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Download Worthlane <Arrow /></AnalyticsLink></div></section>
    </main><SiteFooter />
  </div>;
}
