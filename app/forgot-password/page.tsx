"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await authClient.requestPasswordReset({
  email: email.trim(),
  redirectTo: "/reset-password",
});

if (result.error) {
  setMessage(
    "Unable to send the reset link right now. Please try again later."
  );
  return;
}

      setMessage(
  "If this email is registered, a password reset link has been sent. Please check your inbox and spam folder."
);
    } catch {
      setMessage("Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Forgot Password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your BUNNY TICKET login email to receive a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border bg-background px-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p role="status" className="text-center text-sm">
            {message}
          </p>
        )}
      </form>

      <Link href="/sign-in" className="text-center text-sm underline">
        Back to Login
      </Link>
    </main>
  );
}