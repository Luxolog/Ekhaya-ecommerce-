import type { Database } from "@/types/database";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPlatformHostname(hostname: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const appHostname = configured ? new URL(configured).hostname.toLowerCase() : "";
  const additional = (process.env.PLATFORM_HOSTNAMES ?? "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  return hostname === appHostname
    || (appHostname !== "" && hostname.endsWith(`.${appHostname}`))
    || additional.includes(hostname)
    || hostname === "localhost"
    || hostname.endsWith(".localhost");
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return response;

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const hostname = request.nextUrl.hostname.toLowerCase().replace(/\.$/, "");
  const pathname = request.nextUrl.pathname;
  const isInternalPath = pathname.startsWith("/api/")
    || pathname.startsWith("/_next/")
    || pathname === "/favicon.ico"
    || pathname === "/robots.txt"
    || pathname === "/sitemap.xml";

  if (!isPlatformHostname(hostname) && !isInternalPath) {
    const { data: storeSlug } = await supabase.rpc("resolve_public_store_slug", {
      p_hostname: hostname,
    });
    if (storeSlug) {
      const rewriteUrl = request.nextUrl.clone();
      const storePrefix = `/s/${storeSlug}`;
      rewriteUrl.pathname = pathname === storePrefix || pathname.startsWith(`${storePrefix}/`)
        ? pathname
        : pathname === "/" ? storePrefix : `${storePrefix}${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  const { data } = await supabase.auth.getUser();
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = ["/login", "/signup"].includes(pathname);

  if (!data.user && isDashboard) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (data.user && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
