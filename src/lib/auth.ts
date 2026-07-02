export const SESSION_COOKIE = "bod_session";

const PASSWORD_ITERATIONS = 210_000;
const SESSION_DAYS = 30;
const encoder = new TextEncoder();

type CookieOptions = {
  httpOnly: boolean;
  maxAge: number;
  path: string;
  sameSite: "lax";
  secure: boolean;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${bytesToBase64Url(salt)}$${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = storedHash.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsRaw || !saltRaw || !hashRaw) return false;

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;

  const salt = base64UrlToBytes(saltRaw);
  const expected = base64UrlToBytes(hashRaw);
  const actual = await derivePassword(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}

async function importSessionKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ]);
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importSessionKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return rawValue.join("=");
  }

  return undefined;
}

export function getSessionCookieOptions(request: Request): CookieOptions {
  return {
    httpOnly: true,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:"
  };
}

export function getClearSessionCookieOptions(request: Request): CookieOptions {
  return {
    ...getSessionCookieOptions(request),
    maxAge: 0
  };
}

export async function createSessionValue(secret: string): Promise<string> {
  const now = Date.now();
  const payload = bytesToBase64Url(
    encoder.encode(
      JSON.stringify({
        exp: now + SESSION_DAYS * 24 * 60 * 60 * 1000,
        iat: now,
        nonce: crypto.randomUUID(),
        v: 1
      })
    )
  );
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function isValidSession(request: Request, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;

  const cookie = getCookie(request, SESSION_COOKIE);
  if (!cookie) return false;

  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload, secret);
  if (!constantTimeEqual(encoder.encode(signature), encoder.encode(expected))) return false;

  try {
    const raw = new TextDecoder().decode(base64UrlToBytes(payload));
    const parsed = JSON.parse(raw) as { exp?: number; v?: number };
    return parsed.v === 1 && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}
