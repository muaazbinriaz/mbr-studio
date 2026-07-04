import { z } from "zod";

export const widgetChatSchema = z.object({
  publicKey: z.string().trim().min(1, "Missing client key."),
  visitorId: z.string().trim().min(1).max(200),
  message: z
    .string()
    .trim()
    .min(1, "Message can't be empty.")
    .max(2000, "Message is too long."),
  pageUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type WidgetChatInput = z.infer<typeof widgetChatSchema>;
