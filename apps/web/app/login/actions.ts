"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type LoginState = { status: "idle" | "sent" | "error"; message: string };

const loginSchema = z.object({ email: z.email() });

export async function requestMagicLink(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success)
    return { status: "error", message: "Enter a valid email address." };
  const rate = consumeRateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    5,
    10 * 60_000,
  );
  if (!rate.allowed)
    return {
      status: "error",
      message: "Too many sign-in attempts. Try again later.",
    };

  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin)
    return {
      status: "error",
      message: "The application URL is not configured.",
    };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error)
    return { status: "error", message: "Unable to send the sign-in link." };
  return {
    status: "sent",
    message: "Check your email for the private sign-in link.",
  };
}
