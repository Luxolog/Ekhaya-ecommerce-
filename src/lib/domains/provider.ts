export type DnsValidationRecord = {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
  status?: string;
};

export type CustomHostnameSnapshot = {
  id: string;
  hostname: string;
  hostnameStatus: string;
  sslStatus: string;
  validationRecords: DnsValidationRecord[];
  ownershipVerification?: DnsValidationRecord | null;
};

export interface CustomDomainProvider {
  readonly name: string;
  getCnameTarget(): string;
  createOrGet(hostname: string): Promise<CustomHostnameSnapshot>;
  get(hostnameId: string): Promise<CustomHostnameSnapshot>;
  delete(hostnameId: string): Promise<void>;
}

type CloudflareEnvelope<T> = {
  success?: boolean;
  errors?: Array<{ message?: string }>;
  result?: T;
};

type CloudflareHostname = {
  id: string;
  hostname: string;
  status?: string;
  ownership_verification?: { name?: string; type?: string; value?: string };
  ssl?: {
    status?: string;
    validation_records?: Array<{
      txt_name?: string;
      txt_value?: string;
      cname?: string;
      cname_target?: string;
      status?: string;
    }>;
  };
};

export class CloudflareCustomDomainProvider implements CustomDomainProvider {
  readonly name = "cloudflare";
  private readonly token: string;
  private readonly zoneId: string;
  private readonly cnameTarget: string;
  private readonly api = "https://api.cloudflare.com/client/v4";

  constructor() {
    this.token = process.env.CLOUDFLARE_API_TOKEN ?? "";
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID ?? "";
    this.cnameTarget = (process.env.CLOUDFLARE_SAAS_CNAME_TARGET ?? "").trim().replace(/\.$/, "");
    if (!this.token || !this.zoneId || !this.cnameTarget) {
      throw new Error("Cloudflare custom-hostname configuration is incomplete.");
    }
  }

  getCnameTarget() {
    return this.cnameTarget;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.api}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const payload = await response.json() as CloudflareEnvelope<T>;
    if (!response.ok || payload.success === false || !payload.result) {
      const detail = payload.errors?.map((item) => item.message).filter(Boolean).join("; ");
      throw new Error(detail || `Cloudflare custom-hostname request failed (${response.status}).`);
    }
    return payload.result;
  }

  private snapshot(hostname: CloudflareHostname): CustomHostnameSnapshot {
    const records: DnsValidationRecord[] = (hostname.ssl?.validation_records ?? [])
      .flatMap<DnsValidationRecord>((record) => {
        if (record.txt_name && record.txt_value) {
          return [{ type: "TXT" as const, name: record.txt_name, value: record.txt_value, status: record.status }];
        }
        if (record.cname && record.cname_target) {
          return [{ type: "CNAME" as const, name: record.cname, value: record.cname_target, status: record.status }];
        }
        return [];
      });
    const ownership = hostname.ownership_verification?.name && hostname.ownership_verification.value
      ? {
          type: "TXT" as const,
          name: hostname.ownership_verification.name,
          value: hostname.ownership_verification.value,
        }
      : null;
    return {
      id: hostname.id,
      hostname: hostname.hostname,
      hostnameStatus: hostname.status ?? "pending",
      sslStatus: hostname.ssl?.status ?? "initializing",
      validationRecords: records,
      ownershipVerification: ownership,
    };
  }

  async createOrGet(hostname: string): Promise<CustomHostnameSnapshot> {
    const existing = await this.request<CloudflareHostname[]>(
      `/zones/${this.zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}&per_page=5`
    );
    const match = existing.find((item) => item.hostname.toLowerCase() === hostname.toLowerCase());
    if (match) return this.get(match.id);

    const created = await this.request<CloudflareHostname>(`/zones/${this.zoneId}/custom_hostnames`, {
      method: "POST",
      body: JSON.stringify({
        hostname,
        ssl: {
          method: "txt",
          type: "dv",
          bundle_method: "ubiquitous",
          settings: { min_tls_version: "1.2", http2: "on", tls_1_3: "on" },
        },
      }),
    });
    // Cloudflare may omit DCV records from the create response. Fetch the
    // canonical hostname record before returning instructions to the merchant.
    return this.get(created.id);
  }

  async get(hostnameId: string): Promise<CustomHostnameSnapshot> {
    const hostname = await this.request<CloudflareHostname>(
      `/zones/${this.zoneId}/custom_hostnames/${encodeURIComponent(hostnameId)}`
    );
    return this.snapshot(hostname);
  }

  async delete(hostnameId: string): Promise<void> {
    const response = await fetch(
      `${this.api}/zones/${this.zoneId}/custom_hostnames/${encodeURIComponent(hostnameId)}`,
      {
        method: "DELETE",
        cache: "no-store",
        headers: { Authorization: `Bearer ${this.token}` },
      }
    );
    if (!response.ok) throw new Error(`Cloudflare could not remove the custom hostname (${response.status}).`);
  }
}

export function getCustomDomainProvider(providerName = process.env.CUSTOM_DOMAIN_SSL_PROVIDER || "cloudflare"): CustomDomainProvider {
  if (providerName === "cloudflare") return new CloudflareCustomDomainProvider();
  throw new Error(`Unsupported custom-domain SSL provider: ${providerName}`);
}
