"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import {
  contactFormSchema,
  contactFormDefaultValues,
  type ContactFormValues,
} from "@/lib/validations/contact";
import { SERVICE_OPTIONS, BUDGET_OPTIONS } from "@/config/contact";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: contactFormDefaultValues,
    mode: "onChange",
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitState("submitting");
    setServerError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data?.error ?? "Something went wrong. Please try again.",
        );
      }

      setSubmitState("success");
      reset(contactFormDefaultValues);
    } catch (err) {
      setSubmitState("error");
      setServerError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  if (submitState === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-16 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={1.75} />
        </div>
        <h3 className="font-heading text-2xl font-semibold text-text">
          Message sent
        </h3>
        <p className="max-w-sm font-body text-sm leading-relaxed text-secondary-text">
          Thanks for reaching out. We&apos;ve sent a confirmation to your inbox
          and will follow up within 1–2 business days.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="mt-2 rounded-lg border border-border px-5 py-2.5 font-body text-sm font-medium text-text transition-colors duration-200 hover:bg-background"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      {/* Honeypot — hidden from sighted users and screen readers, and
          removed from tab order. Left empty by humans, filled by bots. */}
      <div
        className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="company_website">Leave this field empty</label>
        <input
          id="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("company_website")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            {...register("name")}
            aria-invalid={!!errors.name}
            className={inputClass(!!errors.name)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="jane@company.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
          />
        </Field>

        <Field label="Company" htmlFor="company" optional>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc."
            {...register("company")}
            className={inputClass(false)}
          />
        </Field>

        <Field label="Phone" htmlFor="phone" optional>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            {...register("phone")}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Service"
          htmlFor="service"
          error={errors.service?.message}
        >
          <select
            id="service"
            {...register("service")}
            aria-invalid={!!errors.service}
            className={inputClass(!!errors.service)}
          >
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Budget" htmlFor="budget" optional>
          <select
            id="budget"
            {...register("budget")}
            className={inputClass(false)}
          >
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Project details"
        htmlFor="message"
        error={errors.message?.message}
      >
        <textarea
          id="message"
          rows={5}
          placeholder="Tell us about your business, timeline, and what you're trying to build."
          {...register("message")}
          aria-invalid={!!errors.message}
          className={`${inputClass(!!errors.message)} resize-none`}
        />
      </Field>

      {submitState === "error" && serverError && (
        <p className="rounded-lg bg-error/10 px-4 py-3 font-body text-sm text-error">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || submitState === "submitting"}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-body text-sm font-medium text-text transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitState === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={1.75} />
            Send message
          </>
        )}
      </button>

      <p className="font-body text-xs text-secondary-text">
        By submitting this form, you agree to our{" "}
        <a
          href="/privacy"
          className="underline underline-offset-2 hover:text-text"
        >
          privacy policy
        </a>
        . We&apos;ll never share your information.
      </p>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return [
    "rounded-lg border bg-background px-4 py-2.5 font-body text-sm text-text",
    "placeholder:text-secondary-text",
    "focus:outline-none focus:ring-2 focus:ring-primary/40",
    hasError ? "border-error" : "border-border",
  ].join(" ");
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-body text-sm font-medium text-text"
      >
        {label}{" "}
        {optional && <span className="text-secondary-text">(optional)</span>}
      </label>
      {children}
      {error && (
        <p className="font-body text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
