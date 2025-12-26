import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileDb";

// Types (should ideally be imported from shared location, but defining here for speed)
interface Transaction {
    id: string;
    userId: string;
    type: "DEPOSIT" | "PAYMENT";
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    proofImage?: string;
    date: string;
    adminNote?: string;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount, proofImage } = body;

        if (!userId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const transactions = await readJson<Transaction[]>("transactions.json");

        const newTransaction: Transaction = {
            id: `TXN-${Date.now()}`,
            userId,
            type: "DEPOSIT",
            amount: parseFloat(amount),
            status: "PENDING",
            proofImage: proofImage || "", // In real app, this would be a URL from upload
            date: new Date().toISOString(),
        };

        transactions.push(newTransaction);
        await writeJson("transactions.json", transactions);

        return NextResponse.json({ success: true, transaction: newTransaction });
    } catch (error) {
        console.error("Topup Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
