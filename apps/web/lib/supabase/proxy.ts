import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "./database.types";
import { getSupabasePublicConfig } from "./config";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabasePublicConfig();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === "/login" || pathname.startsWith("/auth/");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/atlas";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
