import { defineMiddleware } from "astro:middleware";
import { getSecret, getSettings } from "@/lib/db";
import { isValidSession } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/_astro/", "/icons/", "/brand/"];
const PUBLIC_PATHS = new Set(["/favicon.svg", "/manifest.webmanifest"]);

function isPublicAsset(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withNoIndex(response: Response): Response {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  if (isPublicAsset(pathname)) {
    return withNoIndex(await next());
  }

  const settings = await getSettings();
  const isInitialized = Boolean(settings?.initialized);
  const isAuthenticated = await isValidSession(context.request, getSecret());

  context.locals.isInitialized = isInitialized;
  context.locals.isAuthenticated = isAuthenticated;

  if (!isInitialized && pathname !== "/onboarding") {
    return withNoIndex(context.redirect("/onboarding", 303));
  }

  if (isInitialized && pathname === "/onboarding") {
    return withNoIndex(context.redirect("/", 303));
  }

  if (isInitialized && !isAuthenticated && pathname !== "/login") {
    return withNoIndex(context.redirect("/login", 303));
  }

  if (isInitialized && isAuthenticated && pathname === "/login") {
    return withNoIndex(context.redirect("/", 303));
  }

  return withNoIndex(await next());
});
