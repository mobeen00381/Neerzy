import Stripe from "stripe";

// Lazy initialization — don't crash at build time if key is missing
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2024-04-10" as any,
    typescript: true,
  });
}

// Export a lazy getter so Stripe only initializes when actually called at runtime
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripeClient() as any)[prop];
  },
});
