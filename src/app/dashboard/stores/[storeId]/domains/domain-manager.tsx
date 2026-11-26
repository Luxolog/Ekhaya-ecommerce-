"use client";

import { useState, type FormEvent } from "react";

type Domain = {
  id: string;
  domain: string;
  verification_token: string;
  verification_status: string;
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
};

type DnsInstructions = { type: string; host: string; fqdn: string; value: string; ttl: number };

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
      setDns(result.dns);
      setMessage(result.note);
      setDomainInput("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add domain."); }
    finally { setBusy(false); }
  }

  function showDns(item: Domain) {\n    setDns({ type: "TXT", host: "_ekhaya-verification", fqdn: `_ekhaya-verification.${item.domain}`, value: `ekhaya-verification=${item.verification_token}`, ttl: 3600 });\n    setError(""); setMessage("");\n  }\n\n  async function verifyDomain(domainId: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/stores/${storeId}/domains/${domainId}/verify`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Verification failed.");
      setDomains((current) => current.map((item) => item.id === domainId ? { ...item, verification_status: result.status, verified_at: new Date().toISOString() } : item));
      setMessage(result.note ?? "Domain ownership verified.");
    } catch (e) { setError(e instanceof Error ? e.message : "Verification failed."); }
    finally { setBusy(false); }
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
        <p className="field-hint">Enter a domain you already own. Do not include https:// or a page path.</p>
      </form>

      {error && <p className="domain-alert domain-alert-error" role="alert">{error}</p>}
      {message && <p className="domain-alert" role="status">{message}</p>}

      {dns && (
        <section className="dns-instructions">
          <div className="eyebrow">DNS OWNERSHIP CHECK</div>
          <h2>Add this TXT record at your domain provider</h2>
          <div className="dns-row"><span>Type</span><strong>{dns.type}</strong></div>
          <div className="dns-row"><span>Host / Name</span><code>{dns.host}</code><button type="button" onClick={() => navigator.clipboard.writeText(dns.host)}>Copy</button></div>
          <div className="dns-row"><span>Value</span><code>{dns.value}</code><button type="button" onClick={() => navigator.clipboard.writeText(dns.value)}>Copy</button></div>
          <div className="dns-row"><span>TTL</span><strong>{dns.ttl}</strong></div>
          <p className="field-hint">Full DNS record name: <code>{dns.fqdn}</code>. Some DNS providers ask for only the host label shown above. DNS changes can take time to appear; return here and select Verify domain once saved.</p>
        </section>
      )}

      <section className="domain-list">
        <div className="eyebrow">CONNECTED DOMAINS</div>
        {domains.length === 0 ? <p className="empty-state">No custom domain added yet.</p> : domains.map((item) => (
          <article className="domain-item" key={item.id}>
            <div>
              <strong>{item.domain}</strong>
              <span className={`domain-status domain-status-${item.verification_status}`}>{item.verification_status.replaceAll("_", " ")}</span>
              {item.is_primary && <span className="field-hint">Primary domain</span>}
            </div>
            <div className="domain-actions">
              {item.verification_status === "pending" && <><button type="button" disabled={busy} onClick={() => showDns(item)}>DNS records</button><button type="button" disabled={busy} onClick={() => verifyDomain(item.id)}>Verify domain</button></>}
              <button type="button" className="button-secondary" disabled={busy} onClick={() => removeDomain(item.id)}>Remove</button>
            </div>
          </article>
        ))}
      </section>
      <p className="domain-disclaimer">Verification confirms ownership only. Live storefront routing and automatic HTTPS certificates will be enabled in the next infrastructure stage, after the platform's canonical DNS target is configured.</p>
    </div>
  );
}
