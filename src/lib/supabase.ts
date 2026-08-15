"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client.
 *
 * The URL and anon key are public by design — they're safe to ship in a static
 * bundle. Row Level Security is what protects the data, so the policies in
 * `supabase/schema.sql` are not optional.
 *
 * Both values are read at build time, so a change in Netlify's environment
 * variables needs a redeploy to take effect.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the keys are set, so the UI can explain itself instead of crashing. */
export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Completes the OAuth redirect automatically on page load.
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}

export async function signInWithGoogle(redirectTo: string) {
  await supabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
}

export async function signOut() {
  await supabase().auth.signOut();
}
