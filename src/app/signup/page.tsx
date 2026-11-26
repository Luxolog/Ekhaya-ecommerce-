"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand" href="/"><span className="brand-mark">E</span><span>ekhaya<span className="brand-light"> ecommerce</span></span></Link>
        <div className="auth-content">
          <div className="eyebrow">START YOUR NEXT CHAPTER</div>
          <h1>Let's build<br /><em>your business.</em></h1>
          <p>Create your Ekhaya account. We'll help you get your online store ready.</p>
          {success ? (
            <div className="success-panel"><strong>Check your inbox.</strong><p>We've sent a confirmation link to {email}. Verify your email address to continue.</p><Link href="/login">Back to sign in →</Link></div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <label>Your name<input type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" /></label>
              <label>Business email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.za" /></label>
              <label>Create password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>
              {error && <div className="form-error" role="alert">{error}</div>}
              <button className="button button-primary auth-submit" disabled={loading}>{loading ? "Creating account…" : "Create account"} <span>→</span></button>
              <small className="form-terms">By creating an account, you agree to our terms and privacy policy.</small>
            </form>
          )}
          <div className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></div>
        </div>
        <div className="auth-foot">© {new Date().getFullYear()} Ekhaya Ecommerce</div>
      </section>
      <aside className="auth-aside"><div className="aside-orbit" /><div className="aside-copy"><div className="eyebrow">MADE FOR LOCAL BUSINESS</div><h2>Your idea.<br /><em>Your own store.</em></h2><p>Start with the essentials. Grow at a pace that works for you.</p></div><div className="aside-mark">E</div></aside>
    </main>
  );
}
