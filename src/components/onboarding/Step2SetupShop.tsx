"use client";

import { useState, useEffect } from "react";

interface Props {
    data: {
        shopName: string;
        shopSlug: string;
        currency: string;
    };
    updateData: (updates: Partial<Props["data"]>) => void;
    onNext: () => Promise<void>;
    onBack: () => void;
}

export default function Step2SetupShop({ data, updateData, onNext, onBack }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    // Auto-generate slug from shop name
    useEffect(() => {
        const slug = data.shopName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .slice(0, 30);

        updateData({ shopSlug: slug });
    }, [data.shopName]);

    // Check slug availability with debounce
    useEffect(() => {
        if (!data.shopSlug || data.shopSlug.length < 3) {
            setSlugAvailable(null);
            return;
        }

        const checkSlug = setTimeout(async () => {
            setCheckingSlug(true);
            try {
                const res = await fetch(`/api/register/check-slug?slug=${data.shopSlug}`);
                const result = await res.json();
                setSlugAvailable(result.available);
            } catch {
                setSlugAvailable(null);
            } finally {
                setCheckingSlug(false);
            }
        }, 500);

        return () => clearTimeout(checkSlug);
    }, [data.shopSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!slugAvailable) return;

        setIsLoading(true);
        try {
            await onNext();
        } finally {
            setIsLoading(false);
        }
    };

    const currencies = [
        { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
        { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
    ];

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Setup Your Shop</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">This will be your unique shop identity</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Shop Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Shop Name
                    </label>
                    <input
                        type="text"
                        value={data.shopName}
                        onChange={(e) => updateData({ shopName: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        placeholder="E.g., EastMy Printing"
                        required
                        minLength={2}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This appears on invoices and your storefront
                    </p>
                </div>

                {/* Shop Link (Slug) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Shop Link
                    </label>
                    <div className="flex">
                        <input
                            type="text"
                            value={data.shopSlug}
                            onChange={(e) => updateData({ shopSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="your-shop-name"
                            required
                            minLength={3}
                            maxLength={30}
                        />
                        <span className="inline-flex items-center px-4 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-xl text-gray-500 dark:text-gray-400 text-sm">
                            .linkprint.com
                        </span>
                    </div>
                    {/* Availability Status */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                        {checkingSlug ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-xs text-gray-500">Checking availability...</span>
                            </>
                        ) : slugAvailable === true ? (
                            <>
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs text-green-500">Available!</span>
                            </>
                        ) : slugAvailable === false ? (
                            <>
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-xs text-red-500">Already taken, try another</span>
                            </>
                        ) : data.shopSlug.length > 0 && data.shopSlug.length < 3 ? (
                            <span className="text-xs text-gray-500">Minimum 3 characters</span>
                        ) : null}
                    </div>
                </div>

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Primary Currency
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {currencies.map((currency) => (
                            <button
                                key={currency.code}
                                type="button"
                                onClick={() => updateData({ currency: currency.code })}
                                className={`p-4 rounded-xl border-2 text-left transition ${data.currency === currency.code
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {currency.symbol} {currency.code}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {currency.name}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || slugAvailable !== true}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Setting up...
                            </>
                        ) : (
                            <>
                                Continue
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
