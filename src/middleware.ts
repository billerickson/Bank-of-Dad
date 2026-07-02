import { defineMiddleware } from "astro:middleware";
import { getSecret, getSettings } from "@/lib/db";
import { isValidSession } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/_astro/", "/icons/", "/brand/"];
const PUBLIC_PATHS = new Set(["/favicon.svg", "/manifest.webmanifest"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const TRUSTED_HOSTS = new Set(["bod.billerickson.net", "127.0.0.1:4321", "localhost:4321"]);
const TRUSTED_FETCH_SITES = new Set(["same-origin", "none"]);

function isPublicAsset(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function withNoIndex(response: Response, options: { noStore?: boolean } = {}): Response {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  if (options.noStore) response.headers.set("Cache-Control", "no-store");
  return response;
}

function getForwardedProtocol(request: Request, fallback: string): string {
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  if (forwardedProtocol) return forwardedProtocol.split(",")[0].trim();

  const cfVisitor = request.headers.get("cf-visitor");
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor) as { scheme?: string };
      if (parsed.scheme) return parsed.scheme;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function normalizeHost(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0].trim().toLowerCase();
}

function getAllowedOrigins(request: Request): Set<string> {
  const requestUrl = new URL(request.url);
  const protocol = getForwardedProtocol(request, requestUrl.protocol.replace(":", ""));
  const hosts = new Set<string>([requestUrl.host.toLowerCase()]);
  const host = normalizeHost(request.headers.get("host"));
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"));

  if (host) hosts.add(host);
  if (forwardedHost) hosts.add(forwardedHost);

  const origins = new Set<string>();
  for (const currentHost of hosts) {
    if (!TRUSTED_HOSTS.has(currentHost)) continue;
    origins.add(`${protocol}://${currentHost}`);
    if (currentHost === "bod.billerickson.net") origins.add(`https://${currentHost}`);
    if (currentHost === "127.0.0.1:4321" || currentHost === "localhost:4321") origins.add(`http://${currentHost}`);
  }

  return origins;
}

function isAllowedFormOrigin(request: Request): boolean {
  if (SAFE_METHODS.has(request.method)) return true;

  const allowedOrigins = getAllowedOrigins(request);
  if (allowedOrigins.size === 0) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !TRUSTED_FETCH_SITES.has(fetchSite)) return false;

  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return true;

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  if (!isAllowedFormOrigin(context.request)) {
    return withNoIndex(new Response("Form submission origin is not allowed.", { status: 403 }), { noStore: true });
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
    return withNoIndex(context.redirect("/onboarding", 303), { noStore: true });
  }

  if (isInitialized && pathname === "/onboarding") {
    return withNoIndex(context.redirect("/", 303), { noStore: true });
  }

  if (isInitialized && !isAuthenticated && pathname !== "/login") {
    return withNoIndex(context.redirect("/login", 303), { noStore: true });
  }

  if (isInitialized && isAuthenticated && pathname === "/login") {
    return withNoIndex(context.redirect("/", 303), { noStore: true });
  }

  return withNoIndex(await next(), { noStore: true });
});
