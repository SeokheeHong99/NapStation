"use client";

import { useState } from "react";
import type { AuthSession } from "../lib/types";

type AuthModalProps = {
  isOpen: boolean;
  canClose?: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onAuthenticated: (session: AuthSession) => void;
};

export default function AuthModal({
  isOpen,
  canClose = true,
  onClose,
  onContinueAsGuest,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: mode === "register" ? name : undefined,
        }),
      });

      const data = (await response.json()) as AuthSession & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onAuthenticated(data);
      setEmail("");
      setPassword("");
      setName("");
      setFeedback(null);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Authentication failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal auth-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Enter NapStation</div>
            <div className="modal-subtitle">
              Log in to interact, or continue as a guest to browse only.
            </div>
          </div>
          {canClose ? (
            <button type="button" className="icon-button" onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`drawer-tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid auth-grid">
            {mode === "register" ? (
              <label className="span-2">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>
            ) : null}
            <label className="span-2">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="span-2">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
          </div>
          {feedback ? <div className="form-feedback">{feedback}</div> : null}
        </div>
        <div className="modal-footer auth-footer">
          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={onContinueAsGuest}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
