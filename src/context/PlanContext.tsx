"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface PlanFeatures {
    [key: string]: boolean;
}

interface SubscriptionData {
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
}

// Default Basic plan features - matches what Basic plan should show
const DEFAULT_BASIC_FEATURES: PlanFeatures = {
    products: true,
    orders: true,
    quotes: true,
    invoices: true,
    departments: true,      // Operation Board
    staff: true,            // User Management
    workflow: true,         // Workflow Settings
    profile: true,          // User Profile

    // Hidden for Basic
    customers: true,       // Customers visible
    agents: false,
    transactions: false,
    paymentGateway: false,
    promotions: false,
    packages: false,
    analytics: false,
    payments: false,
    shipments: false,
    pricingEngine: false,   // No Pricing Engine for Basic
    liveTracking: false,    // No Live Order Tracking for Basic
};

interface PlanContextType {
    planName: string;
    planSlug: string;
    features: PlanFeatures;
    limits: {
        maxUsers: number;
        maxOrders: number;
        maxProducts: number;
        maxStorageMb: number;
    };
    subscription: SubscriptionData | null;
    isLoading: boolean;
    can: (feature: string) => boolean;
    cannot: (feature: string) => boolean;
    isBasic: boolean;
    isPro: boolean;
    isEnterprise: boolean;
    refreshPlan: () => Promise<void>;
}

const defaultContext: PlanContextType = {
    planName: "Basic",
    planSlug: "basic",
    features: DEFAULT_BASIC_FEATURES,
    limits: { maxUsers: 5, maxOrders: 100, maxProducts: 50, maxStorageMb: 1000 },
    subscription: null,
    isLoading: true,
    can: (feature: string) => DEFAULT_BASIC_FEATURES[feature] === true,
    cannot: (feature: string) => DEFAULT_BASIC_FEATURES[feature] !== true,
    isBasic: true,
    isPro: false,
    isEnterprise: false,
    refreshPlan: async () => { },
};

const PlanContext = createContext<PlanContextType>(defaultContext);

export function usePlan() {
    return useContext(PlanContext);
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
    const [planData, setPlanData] = useState<PlanContextType>(defaultContext);

    const fetchPlanData = useCallback(async () => {
        try {
            const res = await fetch("/api/org/plan");
            if (res.ok) {
                const data = await res.json();
                const features = data.features || DEFAULT_BASIC_FEATURES;
                setPlanData(prev => ({
                    ...prev,
                    planName: data.planName || "Basic",
                    planSlug: data.planSlug || "basic",
                    features: features,
                    limits: data.limits || defaultContext.limits,
                    subscription: data.subscription || null,
                    isLoading: false,
                    can: (feature: string) => features[feature] === true,
                    cannot: (feature: string) => features[feature] !== true,
                    isBasic: data.planSlug === "basic",
                    isPro: data.planSlug === "pro",
                    isEnterprise: data.planSlug === "enterprise",
                }));
            } else {
                // Default to Basic plan
                setPlanData(prev => ({ ...prev, isLoading: false }));
            }
        } catch (error) {
            console.error("Failed to fetch plan data:", error);
            setPlanData(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const refreshPlan = useCallback(async () => {
        setPlanData(prev => ({ ...prev, isLoading: true }));
        await fetchPlanData();
    }, [fetchPlanData]);

    useEffect(() => {
        fetchPlanData();
    }, [fetchPlanData]);

    const contextValue: PlanContextType = {
        ...planData,
        refreshPlan,
    };

    return (
        <PlanContext.Provider value={contextValue}>{children}</PlanContext.Provider>
    );
}

