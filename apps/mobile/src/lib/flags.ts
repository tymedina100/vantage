// Build-time feature flags (EXPO_PUBLIC_* vars are inlined at build time).

/**
 * Bank linking via Plaid. Enabled by default for development (sandbox);
 * set EXPO_PUBLIC_PLAID_ENABLED=false in EAS env for store builds until
 * Plaid production access is approved.
 */
export const PLAID_ENABLED = process.env.EXPO_PUBLIC_PLAID_ENABLED !== "false";
