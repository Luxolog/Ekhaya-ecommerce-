"use client";

import { useState, type FormEvent } from "react";

type DnsRecord = { type: string; name: string; value: string; ttl?: number; status?: string };
type Domain = {
  id: string;
  domain: string;
  verification_token: string;
  verification_status: string;
  ssl_status?: string;
  routing_status?: string;
  ssl_provider?: string | null;
  ssl_provider_hostname_id?: string | null;
  ssl_validation_records?: unknown;
  dns_target?: string | null;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
};
type DnsInstructions = { records: DnsRecord[]; cname?: DnsRecord };

export default function DomainManager({ storeId, initialDomains }: { storeId: string; initialDomains: Domain[] }) {
  const [domains, setDomains] = useState(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [dns, setDns] = useState<DnsInstructions | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function addDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage(""); setDns(null);
    try {
      const response = await fetch(`/api/stores/${storeId}/domains`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not add domain.");
      setDomains((current) => [...current, result.domain]);
      setDns({ records: [{ type: result.dns.type, name: result.dns.fqdn, value: result.dns.value, ttl: result.dns.ttl }] });
      setMessage(result.note);
      setDomainInput("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add domain."); }
    finally { setBusy(false); }
  }

  function showOwnershipDns(item: Domain) {
    setDns({ records: [{ type: "TXT", name: `_ekhaya-verification.${item.domain}`, value: `ekhaya-verification=${item.verification_token}`, ttl: 3600 }] });
    setError(""); setMessage("");
  }

  async function verifyDomain(domainId: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/domains/${domainId}/verify`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Verification failed.");
      setDomains((current) => current.map((item) => item.id === domainId ? { ...item, verification_status: result.status, verified_at: new Date().toISOString() } : item));
      setMessage(result.note ?? "Domain ownership verified. You can now provision SSL.");
    } catch (e) { setError(e instanceof Error ? e.message : "Verification failed."); }
    finally { setBusy(false); }
  }

  async function provisionDomain(domainId: string) {
    setBusy(true); setError(""); setMessage(""); setDns(null);
    try {
      const response = await fetch(`/api/stores/${storeId}/domains/${domainId}/provision`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not start SSL provisioning.");
      setDomains((current) => current.map((item) => item.id === domainId ? {
        ...item, ssl_provider: "cloudflare", ssl_provider_hostname_id: result.providerHostnameId,
        ssl_status: result.sslStatus === "active" ? "active" : "pending",
        routing_status: "pending", dns_target: result.cname.value,
        ssl_validation_records: result.dnsRecords,
      } : item));
      setDns({ cname: result.cname, records: result.dnsRecords ?? [] });
      setMessage(result.note);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start SSL provisioning."); }
    finally { setBusy(false); }
  }

  async function checkStatus(domainId: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/domains/${domainId}/status`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not check domain status.");
      setDomains((current) => current.map((item) => item.id === domainId ? {
        ...item, ssl_status: result.sslStatus, routing_status: result.routingStatus,
        ssl_validation_records: result.validationRecords, dns_target: result.cnameTarget,
      } : item));
      setMessage(result.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not check domain status."); }
    finally { setBusy(false); }
  }

  function showProviderDns(item: Domain) {
    const records = Array.isArray(item.ssl_validation_records)
      ? item.ssl_validation_records as DnsRecord[]
      : [];
    setDns({
      cname: item.dns_target ? { type: "CNAME", name: item.domain, value: item.dns_target, ttl: 3600 } : undefined,
      records,
    });
    setError(""); setMessage("");
  }

  async function removeDomain(domainId: string) {
    if (!window.confirm("Remove this domain from your store?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/domains/${domainId}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not remove domain.");
      setDomains((current) => current.filter((item) => item.id !== domainId));
      setDns(null);
      setMessage("Domain removed from this store.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not remove domain."); }
    finally { setBusy(false); }
  }

  return (
    <div className="domain-manager">
      <form className="domain-add-form" onSubmit={addDomain}>
        <label htmlFor="custom-domain">Your domain name</label>
        <div className="domain-input-row">
          <input id="custom-domain" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="www.yourbusiness.co.za" autoComplete="url" required />
          <button type="submit" disabled={busy || !domainInput.trim()}>{busy ? "Please wait…" : "Add domain"}</button>
        </div>
        <p className="field-hint">Enter a domain you already own. Do not include https:// or a page path. Use a hostname such as www or shop.</p>
      </form>

      {error && <p className="domain-alert domain-alert-error" role="alert">{error}</p>}
      {message && <p className="domain-alert" role="status">{message}</p>}

      {dns && (
        <section className="dns-instructions">
          <div className="eyebrow">DNS CONFIGURATION</div>
          <h2>Add these records at your existing domain provider</h2>
          {dns.cname && <div className="dns-row"><span>CNAME · {dns.cname.name}</span><code>{dns.cname.value}</code><button type="button" onClick={() => navigator.clipboard.writeText(dns.cname!.value)}>Copy</button></div>}
          {dns.records.map((record, index) => <div className="dns-row" key={`${record.name}-${index}`}><span>{record.type} · {record.name}</span><code>{record.value}</code><button type="button" onClick={() => navigator.clipboard.writeText(record.value)}>Copy</button></div>)}
          <p className="field-hint">Keep your domain registered with your current provider. DNS changes may take time to propagate. The domain will not become active until hostname validation, SSL issuance and the CNAME target check all pass.</p>
        </section>
      )}

      <section className="domain-list">
        <div className="eyebrow">CONNECTED DOMAINS</div>
        {domains.length === 0 ? <p className="empty-state">No custom domain added yet.</p> : domains.map((item) => (
          <article className="domain-item" key={item.id}>
            <div>
              <strong>{item.domain}</strong>
              <span className={`domain-status domain-status-${item.verification_status}`}>{item.verification_status.replaceAll("_", " ")}</span>
              {item.ssl_status && <span className={`domain-status domain-status-${item.ssl_status}`}>SSL: {item.ssl_status}</span>}
              {item.routing_status && <span className={`domain-status domain-status-${item.routing_status}`}>Routing: {item.routing_status}</span>}
              {item.is_primary && <span className="field-hint">Primary domain</span>}
            </div>
            <div className="domain-actions">
              {item.verification_status === "pending" && <><button type="button" disabled={busy} onClick={() => showOwnershipDns(item)}>Ownership TXT</button><button type="button" disabled={busy} onClick={() => verifyDomain(item.id)}>Verify ownership</button></>}
              {item.verification_status === "verified" && !item.ssl_provider_hostname_id && <button type="button" disabled={busy} onClick={() => provisionDomain(item.id)}>Provision SSL & routing</button>}
              {item.ssl_provider_hostname_id && <><button type="button" disabled={busy} onClick={() => showProviderDns(item)}>DNS instructions</button><button type="button" disabled={busy} onClick={() => checkStatus(item.id)}>Check activation</button></>}
              <button type="button" className="button-secondary" disabled={busy} onClick={() => removeDomain(item.id)}>Remove</button>
            </div>
          </article>
        ))}
      </section>
      <p className="domain-disclaimer">Ekhaya never takes ownership of your domain. Your registrar and DNS provider remain under your control. HTTPS activation is handled through the platform's configured certificate provider.</p>
    </div>
  );
}
