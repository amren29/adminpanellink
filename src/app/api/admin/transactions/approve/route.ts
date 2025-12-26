import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileDb";

interface User {
    id: string;
    walletBalance: number;
    agentStatus?: string;
    [key: string]: any;
}

interface Transaction {
    id: string;
    userId: string;
    type: "DEPOSIT" | "PAYMENT";
    amount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    [key: string]: any;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { transactionId, adminNote } = body;

        if (!transactionId) {
            return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
        }

        const transactions = await readJson<Transaction[]>("transactions.json");
        const users = await readJson<User[]>("users.json");

        const txnIndex = transactions.findIndex((t) => t.id === transactionId);
        if (txnIndex === -1) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        const transaction = transactions[txnIndex];

        if (transaction.status !== "PENDING") {
            return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
        }

        // Approve Transaction
        transaction.status = "APPROVED";
        transaction.adminNote = adminNote || "Approved by Admin";
        transactions[txnIndex] = transaction;

        // Update User Balance
        const userIndex = users.findIndex((u) => u.id === transaction.userId);
        if (userIndex !== -1) {
            const user = users[userIndex];
            // Increment balance
            user.walletBalance = (user.walletBalance || 0) + transaction.amount;

            // Auto-activate if pending and balance is sufficient (Optional logic, but requested in previous turn)
            if (user.agentStatus === 'pending_deposit' && user.walletBalance >= 100) {
                user.agentStatus = 'active';
            }

            users[userIndex] = user;
        } else {
            return NextResponse.json({ error: "User not found for transaction" }, { status: 404 });
        }

        // Write back both files
        await writeJson("transactions.json", transactions);
        await writeJson("users.json", users);

        return NextResponse.json({ success: true, transaction, newBalance: users[userIndex].walletBalance });
    } catch (error) {
        console.error("Approval Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
