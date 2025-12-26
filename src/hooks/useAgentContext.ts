import { useState, useEffect } from "react";

export interface AgentContext {
    id: string;
    role: "agent" | "customer";
    fullName: string;
    walletBalance: number;
    agentStatus: "active" | "inactive" | "pending_deposit";
    pricingSettings?: {
        discountPercent: number;
        fixedPriceListId?: string;
    };
    loading: boolean;
}

export const useAgentContext = () => {
    const [agent, setAgent] = useState<AgentContext | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const res = await fetch("/api/agent/profile");
                if (res.ok) {
                    const data = await res.json();
                    setAgent({ ...data, loading: false });
                } else {
                    setAgent(null);
                }
            } catch (err) {
                console.error("Failed to fetch agent context", err);
                setAgent(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAgent();
    }, []);

    return { agent, loading };
};
