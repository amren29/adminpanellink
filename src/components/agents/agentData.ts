export type AgentTier = "Silver" | "Gold" | "Platinum" | "Diamond";
export type ContractStatus = "Signed" | "Unsigned";

export interface Agent {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    icNumber: string; // IC / Identity Card Number
    ssmNumber?: string; // Business Registration / SSM Number (optional for company agents)
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    agentCode: string; // Unique referral ID
    commissionRate: number; // Percentage
    agentTier: AgentTier;
    contractStatus: ContractStatus;
    createdDate: string;
    avatar?: string;
    walletBalance: number;
}

export const emptyAgent: Omit<Agent, "id" | "createdDate" | "agentCode"> = {
    fullName: "",
    email: "",
    phone: "",
    icNumber: "",
    ssmNumber: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountHolder: "",
    commissionRate: 5,
    agentTier: "Silver",
    contractStatus: "Unsigned",
    walletBalance: 0,
};

export const agentTiers: AgentTier[] = ["Silver", "Gold", "Platinum", "Diamond"];

export const tierColors: Record<AgentTier, { bg: string; text: string }> = {
    Silver: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-600 dark:text-gray-300",
    },
    Gold: {
        bg: "bg-warning-50 dark:bg-warning-500/15",
        text: "text-warning-600 dark:text-orange-400",
    },
    Platinum: {
        bg: "bg-blue-light-50 dark:bg-blue-light-500/15",
        text: "text-blue-light-600 dark:text-blue-light-400",
    },
    Diamond: {
        bg: "bg-brand-50 dark:bg-brand-500/15",
        text: "text-brand-600 dark:text-brand-400",
    },
};

export const bankOptions = [
    "Maybank",
    "CIMB Bank",
    "Public Bank",
    "RHB Bank",
    "Hong Leong Bank",
    "AmBank",
    "Bank Islam",
    "Bank Rakyat",
    "OCBC Bank",
    "UOB Malaysia",
    "Standard Chartered",
    "HSBC Malaysia",
];

export const generateAgentCode = (): string => {
    const prefix = "AG";
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNum}`;
};

export const sampleAgents: Agent[] = [];

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
