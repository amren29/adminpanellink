
import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileDb";

export async function GET() {
    try {
        const users = await readJson("users.json") as any[];
        const agents = users.filter((u: any) => u.role === "agent");

        const formattedAgents = agents.map((agent: any) => ({
            id: agent.id,
            fullName: agent.fullName,
            email: agent.email,
            phone: agent.phone || "",
            agentCode: agent.agentCode || agent.id,
            status: agent.agentStatus || "active",
            avatar: agent.avatar || "/images/user/user-01.jpg",
            sales: 0,
            commission: 0,
            joinDate: agent.createdDate || "2024-01-01",
            walletBalance: agent.walletBalance || 0,
            agentTier: agent.agentTier || "Silver",
            commissionRate: agent.commissionRate || 5, // Default 5%
            contractStatus: agent.contractStatus || "Unsigned",
            icNumber: agent.icNumber || "",
            bankName: agent.bankName || "",
            bankAccountNumber: agent.bankAccountNumber || "",
            bankAccountHolder: agent.bankAccountHolder || ""
        }));

        return NextResponse.json(formattedAgents);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch agents" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const users = await readJson("users.json") as any[];

        const newAgent = {
            id: `agent-${Date.now()}`,
            role: "agent",
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            password: "password123", // Default password
            walletBalance: body.walletBalance || 0,
            agentTier: body.agentTier || "Silver",
            commissionRate: body.commissionRate || 5,
            contractStatus: body.contractStatus || "Unsigned",
            agentStatus: "active",
            createdDate: new Date().toISOString().split("T")[0],
            icNumber: body.icNumber || "",
            ssmNumber: body.ssmNumber || "",
            bankName: body.bankName || "",
            bankAccountNumber: body.bankAccountNumber || "",
            bankAccountHolder: body.bankAccountHolder || "",
            agentCode: body.agentCode || `AG${Math.floor(10000 + Math.random() * 90000)}`,
            avatar: "/images/user/user-01.jpg"
        };

        const updatedUsers = [...users, newAgent];
        await writeJson("users.json", updatedUsers);

        return NextResponse.json(newAgent);
    } catch (error) {
        console.error("Error creating agent:", error);
        return NextResponse.json(
            { error: "Failed to create agent" },
            { status: 500 }
        );
    }
}
