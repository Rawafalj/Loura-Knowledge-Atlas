import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type AddressResolver = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

function privateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part)))
    return true;
  const a = octets[0] ?? -1;
  const b = octets[1] ?? -1;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

export function isUnsafeAddress(address: string) {
  const family = isIP(address);
  if (family === 4) return privateIpv4(address);
  if (family !== 6) return true;
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return privateIpv4(normalized.slice("::ffff:".length));
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8")
  );
}

const defaultResolver: AddressResolver = (hostname) =>
  lookup(hostname, { all: true });

export async function assertSafeSourceUrl(
  rawUrl: string,
  resolver: AddressResolver = defaultResolver,
) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL must be valid.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.hash) {
    throw new Error("URL credentials and fragments are not allowed.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("URL port is not allowed.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolver(hostname);
  if (
    !addresses.length ||
    addresses.some(({ address }) => isUnsafeAddress(address))
  ) {
    throw new Error("URL resolves to a private or unsafe network address.");
  }
  return url.toString();
}
