import { defineMiddleware } from "astro:middleware";
import { getSecret, getSettings } from "@/lib/db";
import { isValidSession } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/_astro/", "/icons/", "/brand/"];
const PUBLIC_PATHS = new Set(["/favicon.svg", "/manifest.webmanifest"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_FORM_ORIGINS = new Set([
  "https://bod.billerickson.net",
  "http://127.0.0.1:4321",
  "http://localhost:4321"
]);

function isPublicAsset(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withNoIndex(response: Response): Response {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function isAllowedFormOrigin(request: Request): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return ALLOWED_FORM_ORIGINS.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  if (!isAllowedFormOrigin(context.request)) {
    return withNoIndex(new Response("Form submission origin is not allowed.", { status: 403 }));
  }

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
