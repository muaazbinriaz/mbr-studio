"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { addClient } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddClientForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await addClient(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="name">New client name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Dental Clinic"
          required
        />
      </div>
      <Button type="submit" disabled={isPending} className="sm:w-auto">
        {isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add client
      </Button>
      {error && (
        <p role="alert" className="font-body text-sm text-error sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
