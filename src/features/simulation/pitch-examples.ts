import type { NegotiationPitch } from "./negotiation/session";

export const pitchExamples: readonly { readonly id: string; readonly title: string; readonly description: string; readonly pitch: NegotiationPitch }[] = [
  {
    id: "containers", title: "LunchLoop · reusable containers",
    description: "The documented campus-café example. All figures and customer details are fictional.",
    pitch: {
      startup: "LunchLoop",
      pitch: "LunchLoop supplies reusable lunch containers to campus cafes. Students borrow a box with their meal and return it to any partner cafe. We collect, wash and redistribute the containers. Cafes pay a service fee to reduce disposable packaging.",
      currency: "EUR", amount: 10_000_000, equity: 1000, founderOwnershipBps: 6000,
    },
  },
  {
    id: "orders", title: "LunchLoop · campus meal orders",
    description: "A separate fictional campus meal-ordering prototype example. Its ask and ownership differ from the container scenario.",
    pitch: {
      startup: "LunchLoop",
      pitch: "LunchLoop connects campus kitchens with students who want affordable lunches, using advance orders to reduce waste.",
      currency: "EUR", amount: 10_000_000, equity: 2000, founderOwnershipBps: 8000,
    },
  },
];
