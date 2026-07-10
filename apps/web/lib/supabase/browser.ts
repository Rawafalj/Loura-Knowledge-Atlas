"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { getSupabasePublicConfig } from "./config";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = getSupabasePublicConfig();
    client = createBrowserClient<Database>(url, anonKey);
  }
  return client;
}
