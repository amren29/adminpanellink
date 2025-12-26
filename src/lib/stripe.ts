import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

// Plan to Stripe Price ID mapping
// You need to create these products in Stripe Dashboard and add the price IDs here
export const STRIPE_PRICE_IDS = {
    basic: {
        monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
    },
    pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
    },
    enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
    },
};

export function getStripePriceId(planSlug: string, billingCycle: 'monthly' | 'yearly'): string | null {
    const plan = STRIPE_PRICE_IDS[planSlug as keyof typeof STRIPE_PRICE_IDS];
    if (!plan) return null;
    return plan[billingCycle] || null;
}
