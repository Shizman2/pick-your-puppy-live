"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import "../../../components/partners/partners.css";

/**
 * Separate login experience from /admin/login, but the same Supabase
 * Auth underneath - an affiliate account is just an auth.users row with
 * the 'affiliate' role (see user_roles), never the 'admin' role, and
 * middleware.ts gates /partners/* on that role + an approved affiliates
 * row, completely independently of the /admin/* gate.
 */
export default function PartnersLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("That email or password isn't right. Try again.");
      return;
    }

    router.push("/partners/dashboard");
    router.refresh();
  }

  return (
    <div className="partners-shell">
      <div className="partners-card" style={{ maxWidth: 360, textAlign: "center" }}>
        <h1 className="partners-title">Partner Login</h1>
        <p className="partners-subtitle">Sign in to your affiliate dashboard.</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-field__label">Email</label>
            <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Password</label>
            <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" style={{ width: "100%", padding: "12px", marginTop: 8 }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="admin-hint" style={{ marginTop: 16 }}>
          Not a partner yet? <a href="/partners/apply">Apply here</a>.
        </p>
      </div>
    </div>
  );
}
