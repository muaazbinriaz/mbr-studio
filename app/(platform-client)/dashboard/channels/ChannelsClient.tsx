"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  MessageCircle,
  Camera,
  MessagesSquare,
  Send,
  Unlink,
} from "lucide-react";

import {
  connectWhatsApp,
  connectMessenger,
  connectInstagram,
  disconnectChannel,
  sendTestMessage,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Connection {
  id: string;
  channel: string;
  external_account_id: string;
  phone_number_id: string | null;
  status: string;
  maskedToken: string;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline"> = {
  connected: "success",
  pending: "warning",
  disconnected: "outline",
  error: "outline",
};

export function ChannelsClient({ connections }: { connections: Connection[] }) {
  const whatsapp = connections.find((c) => c.channel === "whatsapp");
  const messenger = connections.find((c) => c.channel === "messenger");
  const instagram = connections.find((c) => c.channel === "instagram");

  return (
    <div className="flex flex-col gap-6">
      <ChannelCard
        icon={MessageCircle}
        title="WhatsApp"
        connection={whatsapp}
        note="Connecting WhatsApp requires a verified Meta Business account; this typically takes 1–3 days the first time."
      >
        <WhatsAppForm connection={whatsapp} />
      </ChannelCard>

      <ChannelCard
        icon={MessagesSquare}
        title="Messenger"
        connection={messenger}
        note="Requires a connected Facebook Page and Page access token from Meta Business Suite."
      >
        <MessengerForm connection={messenger} />
      </ChannelCard>

      <ChannelCard
        icon={Camera}
        title="Instagram"
        connection={instagram}
        note="Requires an Instagram Business account linked to a Facebook Page."
      >
        <InstagramForm connection={instagram} />
      </ChannelCard>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  connection,
  note,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  connection?: Connection;
  note: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleDisconnect = () => {
    if (!connection) return;
    startTransition(async () => {
      await disconnectChannel(connection.id);
    });
  };

  const handleTestMessage = () => {
    if (!connection || !testPhone.trim()) return;
    setTestResult(null);
    startTransition(async () => {
      const result = await sendTestMessage(connection.id, testPhone.trim());
      setTestResult(result.error ?? "Test message sent successfully!");
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">
            {title}
          </h2>
        </div>
        {connection && (
          <Badge
            variant={STATUS_VARIANT[connection.status] ?? "outline"}
            className="text-xs capitalize"
          >
            {connection.status}
          </Badge>
        )}
      </div>

      <p className="mb-4 font-body text-xs text-secondary-text">{note}</p>

      {connection && connection.status === "connected" ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-background px-3 py-2.5 font-body text-xs text-secondary-text">
            Account ID:{" "}
            <span className="text-foreground">
              {connection.external_account_id}
            </span>
            <br />
            Token:{" "}
            <span className="text-foreground">{connection.maskedToken}</span>
          </div>

          {connection.channel === "whatsapp" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Your WhatsApp number (e.g. 923001234567)"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleTestMessage}
                disabled={isPending || !testPhone.trim()}
              >
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send test message
              </Button>
            </div>
          )}

          {testResult && (
            <p className="font-body text-xs text-secondary-text">
              {testResult}
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleDisconnect}
            disabled={isPending}
            className="w-fit text-error hover:bg-error/10"
          >
            <Unlink className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function WhatsAppForm({ connection }: { connection?: Connection }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await connectWhatsApp(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field name="waba_id" label="WhatsApp Business Account ID" />
      <Field name="phone_number_id" label="Phone Number ID" />
      <Field name="access_token" label="Access Token" type="password" />
      {error && <p className="font-body text-sm text-error">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="animate-spin" />}
        Connect WhatsApp
      </Button>
    </form>
  );
}

function MessengerForm({ connection }: { connection?: Connection }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await connectMessenger(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field name="page_id" label="Facebook Page ID" />
      <Field name="access_token" label="Page Access Token" type="password" />
      {error && <p className="font-body text-sm text-error">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="animate-spin" />}
        Connect Messenger
      </Button>
    </form>
  );
}

function InstagramForm({ connection }: { connection?: Connection }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await connectInstagram(formData);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <Field name="ig_business_id" label="Instagram Business Account ID" />
      <Field name="access_token" label="Access Token" type="password" />
      {error && <p className="font-body text-sm text-error">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="animate-spin" />}
        Connect Instagram
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-body text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="rounded-lg border border-border bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}
