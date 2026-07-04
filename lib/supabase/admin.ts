import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ============================================================
 * SERVER-ONLY. NEVER import this into a Client Component or
 * expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * This client bypasses Row Level Security ENTIRELY. It must only
 * be used after an explicit, manual authorization check has already
 * passed — e.g.:
 *   - embed_keys.public_key validated against the request
 *   - channel_connections webhook signature verified (Meta, Prompt 04)
 *   - admins table membership confirmed
 *
 * Never derive an organization_id or agent_id from a raw request
 * body field when using this client — always re-derive it from a
 * verified key/token lookup first, then use that verified id in
 * your query. See Prompt 01 Section 8, rule #1.
 * ============================================================
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
