"use client";

import { usePlan } from "@/context/PlanContext";
import Link from "next/link";

export default function TrialBanner() {
    const { subscription, isLoading } = usePlan();

    if (isLoading) return null;

    // Don't show for paid subscriptions or if no subscription
    if (!subscription || subscription.status !== "trialing") {
        return null;
    }

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(subscription.currentPeriodEnd);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Determine urgency level
    const isUrgent = daysRemaining <= 3;
    const isExpired = daysRemaining === 0;

    if (isExpired) {
        return (
            <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
                <span className="font-medium">Your trial has expired.</span>
                {" "}
                <Link href="/billing" className="underline font-semibold hover:text-red-100">
                    Upgrade now
                </Link>
                {" "}to continue using all features.
            </div>
        );
    }

    return (
        <div className={`${isUrgent ? 'bg-amber-500' : 'bg-blue-600'} text-white px-4 py-2 text-center text-sm`}>
            <span>
                {isUrgent ? "⚠️ " : ""}
                <span className="font-medium">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> left in your trial.
            </span>
            {" "}
            <Link href="/billing" className="underline font-semibold hover:opacity-80">
                Upgrade to Pro
            </Link>
        </div>
    );
}
