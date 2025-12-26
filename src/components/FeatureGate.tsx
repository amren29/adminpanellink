'use client'

/**
 * FeatureGate Component
 * 
 * Wraps content that requires a specific plan feature.
 * Shows upgrade prompt if feature is not available.
 * 
 * Usage:
 *   <FeatureGate feature="paymentGateway" access={access}>
 *     <PaymentSettings />
 *   </FeatureGate>
 */

import React from 'react'

interface PlanFeatures {
    [key: string]: boolean
}

interface FeatureGateProps {
    feature: string
    features: PlanFeatures
    children: React.ReactNode
    fallback?: React.ReactNode
    showUpgrade?: boolean
}

export function FeatureGate({
    feature,
    features,
    children,
    fallback,
    showUpgrade = true
}: FeatureGateProps) {
    const hasAccess = features[feature] === true

    if (hasAccess) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    if (showUpgrade) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Upgrade Required
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                        This feature requires a higher plan. Upgrade to unlock more features.
                    </p>
                    <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">
                        Upgrade Plan
                    </button>
                </div>
            </div>
        )
    }

    return null
}

/**
 * Hook-like helper for checking features in client components
 */
export function useFeatureAccess(features: PlanFeatures) {
    return {
        can: (feature: string) => features[feature] === true,
        cannot: (feature: string) => features[feature] !== true,
        features
    }
}
