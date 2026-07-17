"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../../components/public/Logo";
import { createClient } from "../../../lib/supabase/client";

/**
 * Single-admin login. There is no sign-up form anywhere in this app -
 * the one allowed account is created directly in the Supabase dashboard
 * (Authentication > Users), and public sign-ups are turned off there too.
 */
export default function AdminLoginPage() {
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("That email or password isn't right. Try again.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <Logo />
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-field__label">Email</label>
            <input
              className="admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-field">
            <label className="admin-field__label">Password</label>
            <input
              className="admin-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            style={{ width: "100%", marginTop: "8px", padding: "12px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
