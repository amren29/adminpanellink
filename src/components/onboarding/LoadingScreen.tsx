"use client";

import { useState, useEffect } from "react";

interface Props {
    onComplete: () => void;
}

const loadingMessages = [
    { text: "Generating your database...", duration: 1200 },
    { text: "Setting up your domain...", duration: 1000 },
    { text: "Configuring pricing engine...", duration: 1000 },
    { text: "Preparing your dashboard...", duration: 800 },
    { text: "Almost ready...", duration: 500 },
];

export default function LoadingScreen({ onComplete }: Props) {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const totalDuration = loadingMessages.reduce((sum, m) => sum + m.duration, 0);
        let elapsed = 0;

        const interval = setInterval(() => {
            elapsed += 50;
            setProgress((elapsed / totalDuration) * 100);

            // Check which message to show
            let accumulatedTime = 0;
            for (let i = 0; i < loadingMessages.length; i++) {
                accumulatedTime += loadingMessages[i].duration;
                if (elapsed < accumulatedTime) {
                    setCurrentMessageIndex(i);
                    break;
                }
            }

            if (elapsed >= totalDuration) {
                clearInterval(interval);
                setTimeout(onComplete, 300);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center">
            <div className="text-center px-4">
                {/* Animated Logo */}
                <div className="mb-8">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center animate-pulse">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                        </div>
                        {/* Orbiting dots */}
                        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
                        </div>
                        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "-1s" }}>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/60 rounded-full" />
                        </div>
                        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "-2s" }}>
                            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 bg-white/40 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                <h2 className="text-2xl font-bold text-white mb-2">
                    Setting up your shop
                </h2>
                <p className="text-white/80 mb-8 h-6 transition-opacity duration-300">
                    {loadingMessages[currentMessageIndex]?.text}
                </p>

                {/* Progress Bar */}
                <div className="w-64 mx-auto">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <p className="text-white/60 text-sm mt-2">
                        {Math.round(progress)}%
                    </p>
                </div>

                {/* Dots animation */}
                <div className="flex justify-center gap-2 mt-8">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
