import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const agentId = searchParams.get("agentId") || userId;

        const where: any = {};
        if (agentId) {
            where.agentId = agentId;
        }

        const transactions = await prisma.walletTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                agent: {
                    select: { fullName: true, email: true, agentCode: true }
                },
                approver: {
                    select: { name: true }
                }
            }
        });

        // Map to expected format for frontend
        const mapped = transactions.map(t => ({
            id: t.id,
            userId: t.agentId,
            amount: Number(t.amount),
            type: t.type || 'credit',
            description: t.description,
            date: t.createdAt.toISOString(),
            status: t.status || 'completed',
            balanceAfter: Number(t.balanceAfter),
            reference: t.reference,
            proofUrl: t.proofUrl,
            agent: t.agent,
            approver: t.approver,
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, agentId, amount, type, description, proofUrl, reference } = body;

        const targetAgentId = agentId || userId;

        if (!targetAgentId || !amount || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find agent
        const agent = await prisma.agent.findUnique({
            where: { id: targetAgentId }
        });

        if (!agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        // If type is "deposit_request", create pending transaction
        if (type === "deposit_request") {
            const transaction = await prisma.walletTransaction.create({
                data: {
                    agentId: targetAgentId,
                    amount: amount,
                    balanceAfter: Number(agent.walletBalance), // Balance hasn't changed yet
                    type: 'credit', // Will be a credit when approved
                    description: description || "Deposit Request",
                    status: 'pending',
                    reference: reference || null,
                    proofUrl: proofUrl || null,
                }
            });

            return NextResponse.json({
                success: true,
                transaction: {
                    id: transaction.id,
                    userId: transaction.agentId,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    description: transaction.description,
                    date: transaction.createdAt.toISOString(),
                    status: transaction.status,
                }
            });
        }

        // For immediate credit/debit
        let newBalance = Number(agent.walletBalance);

        if (type === "debit") {
            if (newBalance < amount) {
                return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
            }
            newBalance -= amount;
        } else if (type === "credit") {
            newBalance += amount;
        }

        // Map type to valid enum
        const txnType = type === "debit" ? "debit" : "credit";

        // Update agent balance and create transaction
        const [updatedAgent, transaction] = await prisma.$transaction([
            prisma.agent.update({
                where: { id: targetAgentId },
                data: { walletBalance: newBalance }
            }),
            prisma.walletTransaction.create({
                data: {
                    agentId: targetAgentId,
                    amount: amount,
                    balanceAfter: newBalance,
                    type: txnType,
                    description: description,
                    status: 'completed',
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            newBalance: Number(updatedAgent.walletBalance),
            transaction: {
                id: transaction.id,
                userId: transaction.agentId,
                amount: Number(transaction.amount),
                type: transaction.type,
                description: transaction.description,
                date: transaction.createdAt.toISOString(),
                status: transaction.status,
            }
        });

    } catch (error: any) {
        console.error("Transaction Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { transactionId, action, approvedBy } = body; // action: 'approve' | 'reject'

        if (!transactionId || !action) {
            return NextResponse.json({ error: "Missing transactionId or action" }, { status: 400 });
        }

        // Find transaction
        const transaction = await prisma.walletTransaction.findUnique({
            where: { id: transactionId },
            include: { agent: true }
        });

        if (!transaction) {
            return NextResponse.json({ error: `Transaction not found: ${transactionId}` }, { status: 404 });
        }

        if (transaction.status !== "pending") {
            return NextResponse.json({ error: `Transaction is not pending (Status: ${transaction.status})` }, { status: 400 });
        }

        if (action === 'approve') {
            // Calculate new balance
            const currentBalance = Number(transaction.agent?.walletBalance || 0);
            const amount = Number(transaction.amount);
            const newBalance = currentBalance + amount;

            // Update agent balance and transaction status
            await prisma.$transaction([
                prisma.agent.update({
                    where: { id: transaction.agentId! },
                    data: { walletBalance: newBalance }
                }),
                prisma.walletTransaction.update({
                    where: { id: transactionId },
                    data: {
                        status: 'completed',
                        balanceAfter: newBalance,
                        approvedBy: approvedBy || null,
                    }
                })
            ]);

            return NextResponse.json({
                success: true,
                transaction: {
                    id: transaction.id,
                    userId: transaction.agentId,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    status: 'completed',
                }
            });

        } else if (action === 'reject') {
            // For reject, use 'failed' status since 'rejected' is not in enum
            await prisma.walletTransaction.update({
                where: { id: transactionId },
                data: { status: 'failed' }
            });

            return NextResponse.json({
                success: true,
                transaction: {
                    id: transaction.id,
                    userId: transaction.agentId,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    status: 'failed',
                }
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("PUT Transaction Error:", error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
