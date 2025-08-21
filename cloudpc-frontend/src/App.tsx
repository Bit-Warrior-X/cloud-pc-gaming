import React, { useState } from "react";

// ------------------------------------------------------------
// Cloud-PC Frontend – Login + Register (React + TypeScript)
// Single-file App.tsx you can drop into a Vite React TS project.
// Expects backend endpoints:
//   POST /auth/login    { email, password } -> { token: string }
//   POST /auth/register { email, password } -> { token?: string }
// If /auth/register does not return a token, the client will attempt
// an immediate login with the same credentials.
// Configure API base via Vite env: VITE_API_BASE=https://api.example.com
// ------------------------------------------------------------

interface LoginResponse { token: string }
interface RegisterResponse { token?: string; id?: string; message?: string }

type Mode = "login" | "register";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g., "https://api.yourdomain.com"

async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    //credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function apiRegister(email: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    //credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }
  return res.json();
}

export default function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem("token"));

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBanner(null);
    setLoading(true);
    try {
      const { token } = await apiLogin(email, password);
      setToken(token);
      sessionStorage.setItem("token", token);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBanner(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRegister(email, password);
      if (res.token) {
        setToken(res.token);
        sessionStorage.setItem("token", res.token);
        return;
      }
      // Fallback: try logging in with the same credentials
      try {
        const { token } = await apiLogin(email, password);
        setToken(token);
        sessionStorage.setItem("token", token);
      } catch {
        setMode("login");
        setBanner("Account created. Please sign in.");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setBanner(null);
    setError(null);
  };

  if (token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ width: 380, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Signed in</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>Your JWT (truncated): <code>{token.slice(0, 12)}…</code></p>
          <button onClick={logout} style={{ marginTop: 16, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #111827", background: "#111827", color: "white", fontWeight: 600, cursor: "pointer" }}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      {mode === "login" ? (
        <form onSubmit={onLogin} style={{ width: 380, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Cloud-PC Login</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>Sign in with your email and password.</p>

          {banner && <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "#ecfeff", color: "#0e7490", fontSize: 13 }}>{banner}</div>}

          <label style={{ display: "block", fontSize: 12, color: "#334155", marginTop: 16 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />

          <label style={{ display: "block", fontSize: 12, color: "#334155", marginTop: 12 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 18, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #111827", background: loading ? "#6b7280" : "#111827", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => { setMode("register"); setError(null); setBanner(null); }}
            style={{ marginTop: 10, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#111827", fontWeight: 600, cursor: "pointer" }}
          >
            Create account
          </button>

          {error && (
            <div role="alert" style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>{error}</div>
          )}

          <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>
            API: <code>{API_BASE || "/"}/auth/login</code>
          </div>
        </form>
      ) : (
        <form onSubmit={onRegister} style={{ width: 380, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Create your account</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>Register with your email and a password.</p>

          <label style={{ display: "block", fontSize: 12, color: "#334155", marginTop: 16 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />

          <label style={{ display: "block", fontSize: 12, color: "#334155", marginTop: 12 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            minLength={8}
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />

          <label style={{ display: "block", fontSize: 12, color: "#334155", marginTop: 12 }}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
            minLength={8}
            style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", outline: "none" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 18, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #111827", background: loading ? "#6b7280" : "#111827", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); setBanner(null); }}
            style={{ marginTop: 10, width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "white", color: "#111827", fontWeight: 600, cursor: "pointer" }}
          >
            Back to sign in
          </button>

          {error && (
            <div role="alert" style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>{error}</div>
          )}

          <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>
            API: <code>{API_BASE || "/"}/auth/register</code>
          </div>
        </form>
      )}
    </div>
  );
}
