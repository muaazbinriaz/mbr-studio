export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  systemPromptContext: string;
  guardrailDefaults: {
    no_competitors: boolean;
    stay_on_topic: boolean;
    no_pricing: boolean;
    always_polite: boolean;
    no_opinions: boolean;
    push_contact: boolean;
    no_refund_promise: boolean;
    capture_leads: boolean;
    tone: string;
  };
  greetingChips: string[];
  starterFaqs: { title: string; content: string }[];
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "general",
    name: "General Business",
    description: "A safe, flexible starting point for any type of business.",
    systemPromptContext:
      "This business serves customers with a range of products or services. Be helpful, accurate, and always defer to the knowledge base for specifics.",
    guardrailDefaults: {
      no_competitors: false,
      stay_on_topic: true,
      no_pricing: false,
      always_polite: true,
      no_opinions: false,
      push_contact: false,
      no_refund_promise: false,
      capture_leads: true,
      tone: "professional",
    },
    greetingChips: [
      "What do you offer?",
      "How can I contact you?",
      "What are your hours?",
    ],
    starterFaqs: [
      {
        title: "Hours & Contact (example — replace with real info)",
        content:
          "Q: What are your business hours?\nA: We're open Monday to Saturday, 9am to 6pm.\n\nQ: How can I contact you?\nA: You can reach us by phone, email, or through this chat.\n\nQ: Where are you located?\nA: Replace this with your real address.",
      },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant",
    description: "For restaurants, cafes, and food businesses.",
    systemPromptContext:
      "This is a restaurant. Visitors commonly ask about the menu, hours, reservations, delivery, and dietary options.",
    guardrailDefaults: {
      no_competitors: false,
      stay_on_topic: true,
      no_pricing: false,
      always_polite: true,
      no_opinions: false,
      push_contact: false,
      no_refund_promise: true,
      capture_leads: true,
      tone: "friendly",
    },
    greetingChips: [
      "See the menu",
      "Book a table",
      "Do you deliver?",
      "What are your hours?",
    ],
    starterFaqs: [
      {
        title: "Menu & Hours (example — replace with real info)",
        content:
          "Q: What are your opening hours?\nA: We're open daily from 12pm to 11pm.\n\nQ: Do you take reservations?\nA: Yes, call us or message here to book a table.\n\nQ: Do you offer delivery?\nA: Yes, through our own delivery service and major delivery apps.\n\nQ: Do you have vegetarian options?\nA: Yes, our menu includes several vegetarian dishes clearly marked.",
      },
    ],
  },
  {
    id: "clinic",
    name: "Clinic / Healthcare",
    description: "For clinics, dental practices, and healthcare providers.",
    systemPromptContext:
      "This is a healthcare clinic. Visitors ask about appointments, services offered, and general clinic information. Never give medical advice or diagnose — always direct medical questions to booking an appointment with a professional.",
    guardrailDefaults: {
      no_competitors: true,
      stay_on_topic: true,
      no_pricing: true,
      always_polite: true,
      no_opinions: true,
      push_contact: true,
      no_refund_promise: true,
      capture_leads: true,
      tone: "professional",
    },
    greetingChips: [
      "Book an appointment",
      "What services do you offer?",
      "Where are you located?",
    ],
    starterFaqs: [
      {
        title: "Appointments & Services (example — replace with real info)",
        content:
          "Q: How do I book an appointment?\nA: You can book through this chat, by phone, or by visiting our clinic.\n\nQ: What services do you offer?\nA: Replace with your real list of services.\n\nQ: Do you accept walk-ins?\nA: Replace with your real policy.\n\nNote: this assistant does not provide medical advice or diagnoses — for any health concern, please book an appointment with our team.",
      },
    ],
  },
  {
    id: "retail",
    name: "Retail / Store",
    description: "For retail stores and product-based businesses.",
    systemPromptContext:
      "This is a retail store. Visitors ask about products, stock availability, shipping, returns, and store hours.",
    guardrailDefaults: {
      no_competitors: false,
      stay_on_topic: true,
      no_pricing: false,
      always_polite: true,
      no_opinions: false,
      push_contact: false,
      no_refund_promise: true,
      capture_leads: true,
      tone: "friendly",
    },
    greetingChips: [
      "Browse products",
      "Shipping info",
      "Return policy",
      "Store hours",
    ],
    starterFaqs: [
      {
        title: "Shipping & Returns (example — replace with real info)",
        content:
          "Q: Do you ship nationwide?\nA: Yes, we ship across the country. Delivery usually takes 3-5 business days.\n\nQ: What is your return policy?\nA: Replace with your real return window and conditions.\n\nQ: Do you have a physical store?\nA: Replace with your real store address and hours.",
      },
    ],
  },
  {
    id: "real_estate",
    name: "Real Estate",
    description: "For real estate agencies and property listings.",
    systemPromptContext:
      "This is a real estate agency. Visitors ask about available listings, viewings, pricing ranges, and the buying/renting process.",
    guardrailDefaults: {
      no_competitors: true,
      stay_on_topic: true,
      no_pricing: false,
      always_polite: true,
      no_opinions: true,
      push_contact: true,
      no_refund_promise: true,
      capture_leads: true,
      tone: "professional",
    },
    greetingChips: [
      "See available listings",
      "Book a viewing",
      "How does buying work?",
    ],
    starterFaqs: [
      {
        title: "Listings & Viewings (example — replace with real info)",
        content:
          "Q: How can I see available properties?\nA: Replace with a link or description of how listings are shared.\n\nQ: How do I book a viewing?\nA: Message us here with your preferred date and time, or call our office.\n\nQ: Do you handle both buying and renting?\nA: Replace with your real service scope.",
      },
    ],
  },
  {
    id: "salon",
    name: "Salon / Beauty",
    description: "For salons, spas, and beauty businesses.",
    systemPromptContext:
      "This is a salon/beauty business. Visitors ask about services, pricing, booking appointments, and stylist availability.",
    guardrailDefaults: {
      no_competitors: false,
      stay_on_topic: true,
      no_pricing: false,
      always_polite: true,
      no_opinions: false,
      push_contact: false,
      no_refund_promise: true,
      capture_leads: true,
      tone: "fun",
    },
    greetingChips: [
      "Book an appointment",
      "See our services",
      "What are your hours?",
    ],
    starterFaqs: [
      {
        title: "Services & Booking (example — replace with real info)",
        content:
          "Q: What services do you offer?\nA: Replace with your real list (e.g. haircuts, coloring, manicures, facials).\n\nQ: How do I book an appointment?\nA: You can book through this chat, by phone, or in person.\n\nQ: Do you accept walk-ins?\nA: Replace with your real policy.",
      },
    ],
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find((t) => t.id === id);
}
