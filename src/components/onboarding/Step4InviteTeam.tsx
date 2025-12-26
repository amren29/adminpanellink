"use client";

import { useState } from "react";

interface Props {
    data: {
        inviteEmails: string[];
    };
    updateData: (updates: Partial<Props["data"]>) => void;
    onNext: () => Promise<void>;
    onBack: () => void;
}

export default function Step4InviteTeam({ data, updateData, onNext, onBack }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onNext();
        } finally {
            setIsLoading(false);
        }
    };

    const addEmail = () => {
        const email = emailInput.trim().toLowerCase();

        // Validate email
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email");
            return;
        }
        if (data.inviteEmails.includes(email)) {
            setEmailError("Email already added");
            return;
        }

        updateData({ inviteEmails: [...data.inviteEmails, email] });
        setEmailInput("");
        setEmailError("");
    };

    const removeEmail = (email: string) => {
        updateData({ inviteEmails: data.inviteEmails.filter((e) => e !== email) });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEmail();
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invite Your Team</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Get your staff on board from day one</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Staff Email Addresses <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => {
                                setEmailInput(e.target.value);
                                setEmailError("");
                            }}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                            placeholder="colleague@yourcompany.com"
                        />
                        <button
                            type="button"
                            onClick={addEmail}
                            className="px-4 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition"
                        >
                            Add
                        </button>
                    </div>
                    {emailError && (
                        <p className="mt-1.5 text-xs text-red-500">{emailError}</p>
                    )}
                </div>

                {/* Added Emails */}
                {data.inviteEmails.length > 0 && (
                    <div className="space-y-2">
                        {data.inviteEmails.map((email) => (
                            <div
                                key={email}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                            {email[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-gray-700 dark:text-gray-300">{email}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeEmail(email)}
                                    className="text-gray-400 hover:text-red-500 transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Box */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium">You can always invite more later</p>
                            <p className="mt-1 text-blue-600 dark:text-blue-400">
                                Go to Settings → User Management to add or manage team members.
                            </p>
                        </div>
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
                        disabled={isLoading}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Finishing...
                            </>
                        ) : (
                            <>
                                {data.inviteEmails.length > 0 ? "Send Invites & Finish" : "Skip & Finish"}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
