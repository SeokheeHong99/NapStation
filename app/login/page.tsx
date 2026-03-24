"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "../components/AuthModal";
import type { AuthSession } from "../lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          return;
        }
        const session = (await response.json()) as AuthSession;
        if (isActive && session.user) {
          router.replace("/");
        }
      } finally {
        if (isActive) {
          setCheckingSession(false);
        }
      }
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (checkingSession) {
    return <main className="login-page">Checking session...</main>;
  }

  return (
    <main className="login-page">
      <AuthModal
        isOpen
        canClose={false}
        onClose={() => router.replace("/")}
        onContinueAsGuest={() => router.replace("/")}
        onAuthenticated={() => router.replace("/")}
      />
    </main>
  );
}
