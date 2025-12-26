"use client";

import { useState, useEffect } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface CardFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

function CardForm({ onSuccess, onCancel }: CardFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    // Get SetupIntent client secret from our API
    useEffect(() => {
        const fetchSetupIntent = async () => {
            try {
                const res = await fetch("/api/billing/payment-methods", {
                    method: "POST",
                });
                const data = await res.json();
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    setError("Failed to initialize payment form");
                }
            } catch (err) {
                setError("Failed to connect to payment service");
            }
        };
        fetchSetupIntent();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setProcessing(true);
        setError(null);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError("Card element not found");
            setProcessing(false);
            return;
        }

        const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
            clientSecret,
            {
                payment_method: {
                    card: cardElement,
                },
            }
        );

        if (confirmError) {
            setError(confirmError.message || "Failed to add card");
            setProcessing(false);
            return;
        }

        if (setupIntent?.status === "succeeded") {
            onSuccess();
        } else {
            setError("Card setup incomplete. Please try again.");
        }

        setProcessing(false);
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                    color: "#aab7c4",
                },
                fontFamily: "system-ui, -apple-system, sans-serif",
            },
            invalid: {
                color: "#9e2146",
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {!clientSecret ? (
                    <div className="h-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <CardElement options={cardElementOptions} />
                )}
            </div>

            {error && (
                <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || !clientSecret || processing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Adding...
                        </span>
                    ) : (
                        "Add Card"
                    )}
                </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your card will be saved securely with Stripe
            </p>
        </form>
    );
}

interface StripeCardFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function StripeCardForm({ onSuccess, onCancel }: StripeCardFormProps) {
    const options: StripeElementsOptions = {
        appearance: {
            theme: "stripe",
        },
    };

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        return (
            <div className="p-4 text-center text-gray-500">
                <p className="mb-2">Stripe is not configured</p>
                <p className="text-xs">Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments</p>
                <button
                    onClick={onCancel}
                    className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <CardForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
    );
}
