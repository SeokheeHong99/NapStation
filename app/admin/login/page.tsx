"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid password");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--paper)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "2.5rem",
        width: "100%",
        maxWidth: 380,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <h1 style={{ fontFamily: "var(--font-brand)", fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          NapStation
        </h1>
        <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.9rem" }}>Admin Dashboard</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            style={{
              padding: "0.75rem 1rem",
              border: "1.5px solid #ddd",
              borderRadius: 8,
              fontSize: "1rem",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "var(--rust)", fontSize: "0.875rem" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "var(--teal)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
