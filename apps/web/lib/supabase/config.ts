import { z } from "zod";

const publicConfigSchema = z.object({
  url: z.url(),
  anonKey: z.string().min(1),
});

export function getSupabasePublicConfig() {
  return publicConfigSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
