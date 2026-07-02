/**
 * Deterministic cost estimator for the MBR Studio AI Assistant.
 *
 * IMPORTANT: This logic runs in plain TypeScript, NOT inside the LLM.
 * The model calls the `generateEstimate` tool (see route.ts) with structured
 * inputs, and this file computes the actual numbers. That's what makes the
 * "never invent pricing" rule in the system prompt enforceable — the model
 * literally cannot produce a number that didn't come from here.
 *
 * ⚠️ PRICING PLACEHOLDER: The numbers below are placeholders so the feature
 * works out of the box. Replace PRICE_CONFIG with MBR Studio's real rates
 * before shipping this to clients.
 */

export type BusinessType =
  | "restaurant"
  | "retail"
  | "services"
  | "real_estate"
  | "healthcare"
  | "startup_saas"
  | "other";

export interface EstimateInput {
  businessType: BusinessType;
  numberOfPages: number;
  adminPanel: boolean;
  payments: boolean;
  aiChatbot: boolean;
  whatsappIntegration: boolean;
}

export interface EstimateOutput {
  budgetRangeUSD: [number, number];
  timelineWeeks: [number, number];
  recommendedFeatures: string[];
  recommendedPackage: string;
  nextStep: string;
}

// ---- Pricing config (edit these to match real MBR Studio rates) ----------

const BASE_PACKAGE = {
  small: {
    label: "Landing Page / Small Site",
    min: 300,
    max: 600,
    weeks: [1, 2] as [number, number],
  },
  medium: {
    label: "Business Website",
    min: 600,
    max: 1200,
    weeks: [2, 3] as [number, number],
  },
  large: {
    label: "Multi-Page / Custom Platform",
    min: 1200,
    max: 2500,
    weeks: [3, 6] as [number, number],
  },
};

const ADD_ONS: Record<
  keyof Omit<EstimateInput, "businessType" | "numberOfPages">,
  { cost: [number, number]; weeks: number; label: string }
> = {
  adminPanel: { cost: [300, 700], weeks: 1, label: "Admin Panel / Dashboard" },
  payments: { cost: [150, 400], weeks: 1, label: "Payment Integration" },
  aiChatbot: { cost: [400, 900], weeks: 1, label: "AI-Powered Chatbot" },
  whatsappIntegration: {
    cost: [200, 500],
    weeks: 1,
    label: "WhatsApp Automation",
  },
};

function pickBasePackage(pages: number) {
  if (pages <= 3) return BASE_PACKAGE.small;
  if (pages <= 6) return BASE_PACKAGE.medium;
  return BASE_PACKAGE.large;
}

export function calculateEstimate(input: EstimateInput): EstimateOutput {
  const base = pickBasePackage(input.numberOfPages);

  let minTotal = base.min;
  let maxTotal = base.max;
  let minWeeks = base.weeks[0];
  let maxWeeks = base.weeks[1];
  const recommendedFeatures: string[] = [];

  (Object.keys(ADD_ONS) as Array<keyof typeof ADD_ONS>).forEach((key) => {
    if (input[key]) {
      const addOn = ADD_ONS[key];
      minTotal += addOn.cost[0];
      maxTotal += addOn.cost[1];
      maxWeeks += addOn.weeks;
      recommendedFeatures.push(addOn.label);
    }
  });

  return {
    budgetRangeUSD: [minTotal, maxTotal],
    timelineWeeks: [minWeeks, maxWeeks],
    recommendedFeatures,
    recommendedPackage: base.label,
    nextStep:
      "Book a free consultation with Muaaz to confirm scope and get a fixed quote.",
  };
}
