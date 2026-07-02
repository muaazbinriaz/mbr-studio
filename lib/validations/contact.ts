import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Name is too long."),

  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),

  company: z
    .string()
    .trim()
    .max(100, "Company name is too long.")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long.")
    .optional()
    .or(z.literal("")),

  service: z.enum(
    [
      "digital-product",
      "ai-automation",
      "whatsapp-automation",
      "landing-page",
      "saas-development",
      "dashboard",
      "ui-ux",
      "api-integration",
      "seo",
      "maintenance",
      "not-sure",
    ],
    {
      error: () => ({ message: "Select the service you're interested in." }),
    },
  ),

  budget: z
    .enum(["under-1k", "1k-5k", "5k-15k", "15k-plus", "not-sure"])
    .optional()
    .or(z.literal("")),

  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(2000, "Message is too long."),

  // Honeypot. Real visitors never see this field (it's visually and
  // ARIA-hidden, and excluded from tab order), so it should always
  // arrive empty. Bots that fill every input trip it.
  company_website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export const contactFormDefaultValues: ContactFormValues = {
  name: "",
  email: "",
  company: "",
  phone: "",
  service: "not-sure",
  budget: "",
  message: "",
  company_website: "",
};
