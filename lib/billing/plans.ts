// lib/billing/plans.ts
// Single source of truth for plan definitions. Priced in PKR since
// initial clients are Pakistan-based, paying via bank transfer,
// JazzCash, or Easypaisa (see the manual billing flow in
// app/(platform-client)/dashboard/settings/billing).
//
// TODO: confirm final PKR pricing against real early clients before
// treating these as fixed — the numbers below are a starting proposal
// to unblock launch, not validated pricing.

export const PLANS = {
  starter: {
    label: "Starter",
    priceMonthlyPKR: 6000,
    monthlyMessageLimit: 500,
    maxAgents: 1,
    channels: ["website"] as const,
  },
  growth: {
    label: "Growth",
    priceMonthlyPKR: 15000,
    monthlyMessageLimit: 2500,
    maxAgents: 3,
    channels: ["website", "whatsapp"] as const,
  },
  pro: {
    label: "Pro",
    priceMonthlyPKR: 35000,
    monthlyMessageLimit: 10000,
    maxAgents: 10,
    channels: ["website", "whatsapp", "instagram", "messenger"] as const,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function isPlanId(value: string): value is PlanId {
  return Object.prototype.hasOwnProperty.call(PLANS, value);
}

export function getPlan(planId: string) {
  return isPlanId(planId) ? PLANS[planId] : PLANS.starter;
}

// Manual payment instructions shown to clients on the billing page.
// TODO: replace bracketed placeholders with real account details
// before taking a real payment.
export const MANUAL_PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    instructions:
      "Account title: [TODO]\nBank: [TODO]\nAccount #: [TODO]\nIBAN: [TODO]",
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    instructions: "JazzCash number: [TODO]",
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    instructions: "Easypaisa number: [TODO]",
  },
] as const;

export type PaymentMethodId = (typeof MANUAL_PAYMENT_METHODS)[number]["id"];
