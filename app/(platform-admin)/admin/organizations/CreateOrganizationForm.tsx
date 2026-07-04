"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";

import { createOrganization } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateOrganizationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createOrganization(formData);

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    formRef.current?.reset();
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="name">New organization name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Dental Clinic"
          required
        />
      </div>

      <Button type="submit" disabled={loading} className="sm:w-auto">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Create organization
          </>
        )}
      </Button>

      {error && (
        <p role="alert" className="font-body text-sm text-error sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}
