"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Suspense } from "react";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const error = params.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token) {
      setMessage("Invalid or expired password reset link.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        setMessage(result.error.message || "Unable to reset password.");
      } else {
        setSuccess(true);
        setMessage("Your password has been reset successfully.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-center text-2xl font-bold">
        Reset Your Password
      </h1>

      {error || !token ? (
        <p className="text-center text-sm">
          This password reset link is invalid or expired.
          Please request a new one.
        </p>
      ) : success ? (
        <p role="status" className="text-center text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border bg-background px-4"
          />

          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl border bg-background px-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {message && <p role="status" className="text-center text-sm">{message}</p>}
        </form>
      )}

      <Link href="/sign-in" className="text-center text-sm underline">
        Back to Login
      </Link>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-6 text-center">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}