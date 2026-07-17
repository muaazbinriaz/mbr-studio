import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText, tool, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import {
  calculateEstimate,
  type EstimateInput,
  type BusinessType,
} from "@/lib/chat/estimator";
import { checkRateLimit, getClientIp } from "@/lib/chat/rate-limit";
import { searchProjects } from "@/data/projects";
import { getWhatsappLink, siteConfig } from "@/config/site";
import { NextRequest } from "next/server";

const uiMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.object({}).passthrough()).max(20).optional(),
  content: z.string().max(4000).optional(),
});

const chatRequestSchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(50),
});

// Node.js runtime (not edge) — required per project decision.
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// OpenRouter setup
// ---------------------------------------------------------------------------
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PRIMARY_MODEL = "openrouter/free";

const FALLBACK_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1:free",
  "qwen/qwen-2.5-7b-instruct:free",
];

const chatModel = openrouter(PRIMARY_MODEL, {
  extraBody: {
    models: FALLBACK_MODELS,
  },
});

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------
const businessTypeEnum = z.enum([
  "restaurant",
  "retail",
  "services",
  "real_estate",
  "healthcare",
  "startup_saas",
  "other",
]);

const estimateInputSchema = z.object({
  businessType: businessTypeEnum,
  numberOfPages: z.number().int().min(1).max(50),
  adminPanel: z.boolean(),
  payments: z.boolean(),
  aiChatbot: z.boolean(),
  whatsappIntegration: z.boolean(),
});

const portfolioSearchSchema = z.object({
  category: businessTypeEnum.optional(),
  keyword: z.string().optional(),
});

const handoffSchema = z.object({
  reason: z
    .string()
    .describe(
      "Short reason for the handoff, e.g. 'ready to book' or 'question outside FAQ scope'",
    ),
});

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "You're sending messages a bit fast — try again in a moment.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSeconds ?? 30),
        },
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = parsed.data.messages as UIMessage[];

  const result = streamText({
    model: chatModel,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 600,
    tools: {
      generateEstimate: tool({
        description:
          "Compute a deterministic project cost and timeline range from structured project details. ALWAYS use this instead of stating a number yourself once you have enough information about scope.",
        inputSchema: estimateInputSchema,
        execute: async (input: EstimateInput) => calculateEstimate(input),
      }),

      searchPortfolio: tool({
        description:
          "Search past MBR Studio projects by business category and/or keyword. Use this whenever a visitor asks to see examples of work, instead of describing projects from memory.",
        inputSchema: portfolioSearchSchema,
        execute: async ({ category, keyword }) => {
          const results = searchProjects(
            category as BusinessType | undefined,
            keyword,
          );
          return {
            count: results.length,
            projects: results,
          };
        },
      }),

      requestHandoff: tool({
        description:
          "Surface a WhatsApp + consultation handoff to the visitor. Use this when a question is outside FAQ scope, the visitor wants to talk pricing specifics, explicitly asks for a human, or a qualification/estimate flow has just concluded.",
        inputSchema: handoffSchema,
        execute: async ({ reason }) => ({
          reason,
          whatsappUrl: getWhatsappLink(),
          consultationUrl: siteConfig.consultationUrl,
          contactEmail: siteConfig.contactEmail,
        }),
      }),
    },
    stopWhen: ({ steps }) => steps.length >= 4,
  });

  return result.toUIMessageStreamResponse();
}
