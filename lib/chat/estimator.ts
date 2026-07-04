/**
 * Deterministic cost estimator for the MBR Studio AI Assistant.
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
    min: 150,
    max: 300,
    weeks: [1, 2] as [number, number],
  },
  medium: {
    label: "Business Website",
    min: 300,
    max: 500,
    weeks: [2, 3] as [number, number],
  },
  large: {
    label: "E-commerce / Multi-Page Platform",
    min: 800,
    max: 1500,
    weeks: [3, 6] as [number, number],
  },
};

/**
 * PROPORTIONALITY NOTE:
 * Add-on costs are sized against feature-engineering effort, which is
 * roughly constant regardless of page count. Base package cost scales
 * with page count. This means an add-on can cost more than a small base
 * package without being a bug.
 */
const ADD_ONS: Record<
  keyof Omit<EstimateInput, "businessType" | "numberOfPages">,
  { cost: [number, number]; weeks: number; label: string }
> = {
  adminPanel: { cost: [200, 400], weeks: 1, label: "Admin Panel / Dashboard" },
  payments: { cost: [150, 300], weeks: 1, label: "Payment Integration" },
  aiChatbot: { cost: [300, 600], weeks: 1, label: "AI-Powered Chatbot" },
  whatsappIntegration: {
    cost: [200, 400],
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
  const minWeeks = base.weeks[0];
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
