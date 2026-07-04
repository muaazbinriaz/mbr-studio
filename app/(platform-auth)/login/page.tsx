"use client";

import { useRouteLoader } from "@/components/loader/RouteLoader";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const { start, stop } = useRouteLoader();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      stop();
      return;
    }

    start();
    router.push(redirectTo);
    router.refresh();
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMagicLinkSent(true);
  };

  return (
    <Card className="border-border/80 shadow-xl shadow-black/[0.03] dark:shadow-black/20">
      <CardHeader className="items-center pb-2 pt-8 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LogIn className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <p className="mt-1 font-body text-sm text-secondary-text">
          Log in to manage your AI agents.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {magicLinkSent ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-5 py-8 text-center">
            <Mail className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <p className="font-body text-sm text-secondary-text">
              Check <span className="font-medium text-foreground">{email}</span>{" "}
              for a magic link — click it to log in.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
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
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="font-body text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} loading={loading}>
              Log in
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 font-body text-xs uppercase tracking-wide text-secondary-text">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleMagicLink}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  Email me a magic link instead
                </>
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center font-body text-sm text-secondary-text">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-accent"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
