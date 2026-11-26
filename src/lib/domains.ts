import { domainToASCII } from "node:url";
import { isIP } from "node:net";

export function normalizeCustomDomain(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toLowerCase().replace(/\.$/, "");
  if (!raw || raw.length > 253 || /[/:?#@\\s]/.test(raw) || raw.includes("*")) return null;
  const ascii = domainToASCII(raw);
  if (!ascii || ascii.length > 253 || isIP(ascii)) return null;
  if (ascii === "localhost" || ascii.endsWith(".localhost") || ascii.endsWith(".local") || ascii.endsWith(".test")) return null;
  const labels = ascii.split(".");
  if (labels.length < 2 || labels.some((label) => !label || label.length > 63)) return null;
  if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  return ascii;
}
