"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.");

/**
 * Stores an email in `newsletter_subscribers` via Supabase. No emails are
 * sent — this list is captured for later use once the AI SaaS product
 * launches. Anonymous visitors can insert (see migration + RLS policy);
 * duplicates are rejected at the database level via a unique constraint
 * and surfaced here as a friendly message instead of a raw DB error.
 */
export async function subscribeToNewsletter(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }
  const email = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (error) {
    // Postgres unique_violation
    if (error.code === "23505") {
      return { error: "That email is already subscribed." };
    }
    return { error: "Something went wrong — please try again." };
  }

  return { error: null };
}
