"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <div className="auth-content">
          <div className="eyebrow">WELCOME BACK</div>
          <h1>Good to see<br /><em>you again.</em></h1>
          <p>Sign in to manage your store and keep your business moving.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.za" /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span>→</span></button>
          </form>
          <div className="auth-switch">New to Ekhaya? <Link href="/signup">Create your account</Link></div>
        </div>
        <div className="auth-foot">© {new Date().getFullYear()} Ekhaya Ecommerce</div>
      </section>
      <aside className="auth-aside"><div className="aside-orbit" /><div className="aside-copy"><div className="eyebrow">YOUR BUSINESS, ALL IN ONE PLACE</div><h2>Make room for<br /><em>what's next.</em></h2><p>Your products, customers and orders. Connected in one simple workspace.</p></div><div className="aside-mark">E</div></aside>
    </main>
  );
}
