"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, UserPlus, RefreshCw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off (or auto-confirmed) — signUp already
      // returned an active session, so send the user straight to their
      // dashboard instead of showing "check your email" (which would
      // never arrive). Hard navigation, not router.push — this is the
      // user's very first visit to /dashboard this session, nothing to
      // gain from a soft nav here and it sidesteps any Router Cache edge
      // cases entirely.
      window.location.href = "/dashboard";
    } else {
      // No session came back — email confirmation IS required on this
      // project. Show the "check your inbox" screen instead of silently
      // sending them to /dashboard, where middleware would just bounce
      // them to /login with no explanation.
      setSubmitted(true);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setResending(false);
    setResendMessage(
      error ? error.message : "Confirmation email resent — check your inbox.",
    );
  };

  return (
    <Card className="border-border/80 shadow-xl shadow-black/[0.03] dark:shadow-black/20">
      <CardHeader className="items-center pb-2 pt-8 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <p className="mt-1 font-body text-sm text-secondary-text">
          Set up access to your client dashboard.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-5 py-8 text-center">
            <Mail className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <p className="font-body text-sm text-secondary-text">
              Check <span className="font-medium text-foreground">{email}</span>{" "}
              for a confirmation link to finish creating your account.
            </p>
            <p className="font-body text-xs text-secondary-text">
              This usually arrives within a minute — check spam if it
              doesn&apos;t.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resending}
              loading={resending}
              onClick={handleResend}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resend confirmation email
            </Button>
            {resendMessage && (
              <p className="font-body text-xs text-secondary-text">
                {resendMessage}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Enter your password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="font-body text-xs text-secondary-text">
                At least 8 characters.
              </p>
            </div>

            {error && (
              <p role="alert" className="font-body text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} loading={loading}>
              Sign up
            </Button>
          </form>
        )}

        <p className="mt-6 text-center font-body text-sm text-secondary-text">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-accent"
          >
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
