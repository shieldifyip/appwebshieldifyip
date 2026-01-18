import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { Database } from "@/types/db";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          res.cookies.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options?: CookieOptions) {
          res.cookies.set({ name, value: "", ...(options ?? {}) });
        },
      },
    }
  );

  const pathname = req.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAppRoute = pathname.startsWith("/app");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "admin" | "customer" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/app", req.url));
  }

  if (!user && (isAdminRoute || isAppRoute)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/app", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets).*)"],
};
