"use client";

import { useState } from "react";

interface Props {
    data: {
        teamSize: string;
        printTypes: string[];
        currentSystem: string;
    };
    updateData: (updates: Partial<Props["data"]>) => void;
    onNext: () => Promise<void>;
    onBack: () => void;
}

export default function Step3Customize({ data, updateData, onNext, onBack }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onNext();
        } finally {
            setIsLoading(false);
        }
    };

    const togglePrintType = (type: string) => {
        const current = data.printTypes;
        if (current.includes(type)) {
            updateData({ printTypes: current.filter((t) => t !== type) });
        } else {
            updateData({ printTypes: [...current, type] });
        }
    };

    const teamSizes = [
        { value: "1-5", label: "1-5", icon: "👤", desc: "Solo / Small team" },
        { value: "6-20", label: "6-20", icon: "👥", desc: "Growing business" },
        { value: "20+", label: "20+", icon: "🏭", desc: "Factory scale" },
    ];

    const printTypes = [
        { value: "large_format", label: "Large Format", icon: "🖼️", desc: "Banners, Posters" },
        { value: "digital", label: "Digital Print", icon: "🃏", desc: "Cards, Stickers" },
        { value: "offset", label: "Offset", icon: "📰", desc: "Booklets, Catalogs" },
        { value: "apparel", label: "Apparel", icon: "👕", desc: "T-shirts, Caps" },
    ];

    const systems = [
        { value: "excel", label: "Excel / Paper" },
        { value: "accounting", label: "QuickBooks / SQL Accounting" },
        { value: "other_saas", label: "Other SaaS Software" },
        { value: "none", label: "Just started, no system yet" },
    ];

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customize Your Experience</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Help us set up the best defaults for you</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        How many staff in your team?
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {teamSizes.map((size) => (
                            <button
                                key={size.value}
                                type="button"
                                onClick={() => updateData({ teamSize: size.value })}
                                className={`p-4 rounded-xl border-2 text-center transition ${data.teamSize === size.value
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className="text-2xl mb-1">{size.icon}</div>
                                <div className="font-semibold text-gray-900 dark:text-white">{size.label}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{size.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* What do you print? */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        What do you print? <span className="text-gray-400">(Select all that apply)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {printTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => togglePrintType(type.value)}
                                className={`p-4 rounded-xl border-2 text-left transition ${data.printTypes.includes(type.value)
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{type.icon}</span>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{type.label}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{type.desc}</div>
                                    </div>
                                    {data.printTypes.includes(type.value) && (
                                        <svg className="w-5 h-5 text-indigo-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current System */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        What system are you currently using?
                    </label>
                    <div className="space-y-2">
                        {systems.map((system) => (
                            <button
                                key={system.value}
                                type="button"
                                onClick={() => updateData({ currentSystem: system.value })}
                                className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center justify-between ${data.currentSystem === system.value
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{system.label}</span>
                                {data.currentSystem === system.value && (
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
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
                        disabled={isLoading || !data.teamSize}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
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
