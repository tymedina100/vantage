# Worthlane — Deployment & App Store Runbook

A step-by-step guide for shipping Worthlane to TestFlight and the App Store as a solo developer. Written for the current setup: **API on Railway**, **iOS first via EAS**, **Plaid sandbox + manual accounts at launch**.

---

## 0. One-time prerequisites (mostly done)

- [x] Apple Developer Program membership ($99/yr) — you have this
- [x] Expo/EAS account — you have this (project ID is in `app.json`)
- [ ] Install EAS CLI: `npm i -g eas-cli`, then `eas login`
- [ ] A domain you control (for `support@…`, Resend email sending, and the privacy/support pages). The code currently uses `support@worthlane.app` — **replace with your real domain** in `apps/web/app/support/page.tsx` and `apps/web/app/privacy/page.tsx` if different.

---

## 1. Backend: Railway checklist

Your API already deploys on Railway (`apps/api/railway.json` runs `prisma migrate deploy` then `next start`). Before shipping:

1. **Set every required env var** in the Railway service (the API now fails fast at runtime if these are missing in production):

   | Variable | Notes |
   |---|---|
   | `DATABASE_URL` | Railway Postgres plugin sets this |
   | `JWT_SECRET`, `JWT_REFRESH_SECRET` | 32+ random chars each. Generate: `openssl rand -hex 32` |
   | `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` | Keep `sandbox` until production approval |
   | `PLAID_TOKEN_ENCRYPTION_KEY` | 64-char hex: `openssl rand -hex 32` |
   | `PLAID_IOS_REDIRECT_URI`, `PLAID_ANDROID_PACKAGE_NAME`, `PLAID_WEBHOOK_URL` | Webhook URL = `https://<your-railway-domain>/api/plaid/webhook` |
   | `CRON_SECRET` | Random string; used by the cron endpoints |
   | `ANTHROPIC_API_KEY` | **New requirement** — the AI assistant needs it (console.anthropic.com) |
   | `RESEND_API_KEY`, `EMAIL_FROM` | **New requirement** — password-reset emails (resend.com, free tier) |
   | `SENTRY_*`, `POSTHOG_*` | Optional but recommended for production |

2. **Set up the two cron jobs.** `vercel.json` crons do NOT run on Railway. In Railway, add a **Cron Job service** (or use a scheduled GitHub Action) that calls daily:
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" https://<api-domain>/api/cron/daily    # 6:00 UTC — net worth snapshots + recurring detection
   curl -H "Authorization: Bearer $CRON_SECRET" https://<api-domain>/api/cron/nudges   # 14:00 UTC (~9am ET) — daily nudges + push
   ```

3. **Resend domain verification:** in the Resend dashboard, add your domain and create the SPF/DKIM DNS records so reset emails don't land in spam. Until verified you can send from `onboarding@resend.dev` (dev only).

4. **Deploy & smoke test:**
   ```bash
   git push   # Railway auto-deploys
   curl -s https://<api-domain>/api/auth/login -X POST -H "Content-Type: application/json" -d '{}'
   # expect a JSON validation error, not a 500
   ```

---

## 2. Marketing site (privacy & support pages — required by Apple)

Apple requires a **privacy policy URL** and **support URL** in App Store Connect. `apps/web` has both pages.

```bash
cd apps/web && npx vercel --prod    # or connect the repo in the Vercel dashboard
```

Note the final URLs, e.g. `https://worthlane.app/privacy` and `https://worthlane.app/support`.

---

## 3. Mobile: EAS environment setup

In the [EAS dashboard](https://expo.dev) → your project → **Environment variables**, create for the `preview` and `production` environments:

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | `https://<your-railway-domain>/api` |
| `EXPO_PUBLIC_PLAID_ENABLED` | `false` (until Plaid production is approved) |
| `PLAID_IOS_ASSOCIATED_DOMAIN` | your universal-link domain (only needed when Plaid OAuth is live) |
| `EXPO_PUBLIC_SENTRY_DSN` + `SENTRY_*` | from your Sentry project (optional) |
| `EXPO_PUBLIC_POSTHOG_KEY/HOST` | optional analytics |

The build **fails on purpose** if `EXPO_PUBLIC_API_URL` is missing or points at localhost (`resolveApiUrl()` and `app.config.ts` both check).

---

## 4. Preview build → your own iPhone

```bash
cd apps/mobile
eas build --profile preview --platform ios
```

- First run walks you through Apple credentials (let EAS manage certificates/profiles — say yes to everything).
- When the build finishes, open the link on your iPhone and install (internal distribution).
- **Smoke test on the device** (against the production API):
  1. Register a new account → onboarding (should say "Get Started" since Plaid flag is off)
  2. Add a manual account + a few manual transactions (mix of expenses/income, one impulse-flagged)
  3. Create a budget and a goal; add a goal contribution
  4. Dashboard: net worth card → Accounts screen renders chart after day 1
  5. Profile → Reports (cash flow renders), Recurring (empty until 2-3 same-merchant charges exist)
  6. AI assistant: send a message — tokens should stream in
  7. Toggle iOS dark/light mode in Settings → app follows
  8. Forgot password → email arrives → reset code works
  9. Profile → Delete account → confirm it removes everything, then re-register

---

## 5. App Store Connect setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → My Apps → **+ New App**:
   - Platform: iOS, Name: **Worthlane**, Language: English
   - Bundle ID: `com.worthlane.mobile` (register it at developer.apple.com → Identifiers if not listed)
   - SKU: `worthlane-ios`
2. **App Information**: category *Finance*; content rights: no third-party content.
3. **Pricing**: Free.
4. **App Privacy** (the "nutrition label") — declare honestly:
   - **Contact Info → Email Address**: collected, linked to identity, for app functionality
   - **Financial Info → Other Financial Info**: collected, linked to identity, for app functionality
   - **Identifiers → User ID**: collected, linked, app functionality
   - If PostHog analytics is on: **Usage Data → Product Interaction**, linked, analytics
   - Data not used for tracking (no cross-app ads) → answer "No" to tracking
   - Privacy policy URL: your `/privacy` page
5. **Age rating** questionnaire → should land at 4+.
6. **Version page**: description, keywords (`budget, money, net worth, bills, subscriptions, finance tracker`), support URL, marketing URL (optional).
7. **Screenshots** (required sizes: 6.9" iPhone — 1320×2868, and 6.5" — 1284×2778 or 1242×2688):
   - Run the app in Simulator (`iPhone 16 Pro Max`), press `Cmd+S` to save screenshots
   - Capture: Dashboard, Accounts/net-worth chart, Budgets, Reports, Assistant
   - Take both light and dark variants; pick the best five

---

## 6. Production build → TestFlight

```bash
cd apps/mobile
eas build --profile production --platform ios     # builds the store binary
eas submit --platform ios --latest               # uploads to App Store Connect
```

- Processing takes ~15–30 min, then the build appears under **TestFlight**.
- Answer the export-compliance question: the app **only uses standard HTTPS/ATS encryption** → exempt (`ITSAppUsesNonExemptEncryption` is already `false` in app.json, so this is usually auto-answered).
- Add yourself as an internal tester → install via the TestFlight app → repeat the smoke test from §4.
- Optional: add external testers (up to 10,000). The first external build needs a lightweight "Beta App Review" (~1 day).

---

## 7. Submit for review

On the version page:

1. Select the build you tested.
2. **App Review Information — this matters for finance apps:**
   - Provide a **demo account**: create `demo@worthlane.app` (any email you control) with password, and **seed it with data** — a few accounts, transactions, budgets, a goal, so the reviewer sees a working app. (Register through the app against production, add manual data.)
   - Review notes, something like:
     > "Worthlane is a personal budgeting app. Bank linking (Plaid) is not yet enabled in this release; users track accounts and transactions manually. The AI assistant uses the user's own financial data to answer questions; it cannot move money. Account deletion is available in Profile → Delete account."
3. Release option: choose **Manually release** (you press the button after approval) and consider **phased release** for later updates.
4. Submit. First reviews typically take 1–3 days.

**Common finance-app rejection traps (all already handled in code, verify before submitting):**
- ✅ Account deletion in-app (5.1.1(v)) — Profile → Delete account
- ✅ Privacy policy URL + accurate nutrition labels
- ✅ Login works on the reviewer's first try (test your demo account from a fresh install!)
- ✅ No placeholder content (TestFlight URL placeholder in `apps/web/app/page.tsx` — update before pointing anyone at the site)
- ⚠️ If you enable Plaid later, App Review may ask about data usage — the privacy page already covers it.

---

## 8. After approval

- Press **Release** in App Store Connect.
- Watch **Sentry** for crashes and **Railway logs** for API errors the first week.
- Respond to App Store reviews (Connect → Ratings & Reviews).

---

## 9. Parallel track: Plaid production

1. In the [Plaid dashboard](https://dashboard.plaid.com): request **Production** access (Company info → questionnaire → security review; allow days–weeks).
2. Pricing: pay-as-you-go, roughly ~$0.30/connected account/month for Transactions — fine at small scale.
3. When approved:
   - Add production `PLAID_CLIENT_ID`/`PLAID_SECRET`, set `PLAID_ENV=production` on Railway
   - Register the **webhook URL** and **redirect URI** (`worthlane://plaid-oauth` for the app scheme; a universal link domain is required for OAuth banks — set `PLAID_IOS_REDIRECT_URI` to an https universal link and configure `PLAID_IOS_ASSOCIATED_DOMAIN`)
   - Flip `EXPO_PUBLIC_PLAID_ENABLED=true` in EAS env → new build → TestFlight → submit update
4. The Plaid webhook endpoint verifies request signatures automatically (rejects unsigned calls outside sandbox), so it's safe to expose.

---

## 10. Release cadence cheat-sheet

```bash
# every release
pnpm typecheck && pnpm test                     # green?
git push                                        # Railway auto-deploys API (runs migrations)
cd apps/mobile
eas build --profile production --platform ios
eas submit --platform ios --latest
# bump version in app.json for the NEXT release (eas.json uses remote versioning for build numbers)
```

Android later: create a Google Play Console account ($25), then the same flow with `--platform android` and the Play Data Safety form.
