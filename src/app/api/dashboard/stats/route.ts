import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { getSecurePrisma } from '@/lib/prisma-secure';
import { authOptions } from '@/lib/auth';

// Dashboard stats API - aggregates data from multiple sources
// Patch BigInt serialization for JSON
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const db = getSecurePrisma(session.user.organizationId);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // 1. Efficient Bulk Queries
        // Instead of 40+ loops, we do huge parallel chunks
        const [
            totalRevenueAgg,
            customerCount,
            orderCount,
            productCount,
            agentCount,
            ordersByStatus,
            invoiceStats,
            walletStats,
            recentOrders, // For trends & lists
            staffPerformance
        ] = await Promise.all([
            // Revenue Aggregates
            db.order.aggregate({
                _sum: { totalAmount: true },
            }),
            // Entity Counts
            db.customer.count(),
            db.order.count(),
            db.product.count({ where: { isActive: true } }),
            db.agent.count({ where: { isActive: true } }),
            // Status Distributions
            db.order.groupBy({
                by: ['status', 'departmentId'],
                _count: { id: true }
            }),
            // Invoice Stats
            db.invoice.groupBy({
                by: ['status'],
                _count: { id: true },
                _sum: { total: true }
            }),
            // Wallet Stats
            db.walletTransaction.aggregate({
                where: { status: 'pending' },
                _sum: { amount: true },
                _count: { id: true }
            }),
            // Fetch relevant orders for Trends, Lists & Revenue Calculations (Last 30 days + Urgent)
            // This replaces specific loops for daily sparklines
            db.order.findMany({
                where: {
                    createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } // Last 12 months for monthly chart
                },
                select: {
                    id: true,
                    totalAmount: true,
                    createdAt: true,
                    updatedAt: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    customer: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            // Staff Performance (Keep separate for complexity)
            db.user.findMany({
                where: { workflowRole: { in: ['designer', 'production', 'qc', 'admin'] } },
                select: {
                    id: true,
                    name: true,
                    workflowRole: true,
                    ordersAssigned: {
                        select: { id: true }, // Just count in JS to avoid subquery nesting issues if any, or utilize _count if preferred
                        where: {
                            status: { in: ['completed', 'collected', 'delivered', 'shipped'] },
                            updatedAt: { gte: new Date(now.setMonth(now.getMonth() - 1)) }
                        }
                    }
                }
            })
        ]);

        // --- In-Memory Processing (0ms latency vs Network) ---

        // 1. Revenue Calculations
        // Filter recentOrders array instead of new DB calls
        const currentRevenue = recentOrders
            .filter(o => o.createdAt >= startOfMonth)
            .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        const lastRevenue = recentOrders
            .filter(o => o.createdAt >= startOfLastMonth && o.createdAt <= endOfLastMonth)
            .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100) : 0;

        // 2. Status Counts
        const statusCounts: Record<string, number> = {};
        let activeOrders = 0;
        const activeStatuses = new Set(['new_order', 'pending_artwork', 'designing', 'proof_sent', 'design_revision', 'artwork_ready', 'in_production', 'qc_check']);

        ordersByStatus.forEach(group => {
            statusCounts[group.status] = (statusCounts[group.status] || 0) + group._count.id;
            if (activeStatuses.has(group.status)) {
                activeOrders += group._count.id;
            }
        });

        // 3. Department Stats
        // We have group.departmentId from ordersByStatus
        const deptMap: Record<string, number> = {};
        ordersByStatus.forEach(group => {
            if (group.departmentId) {
                deptMap[group.departmentId] = (deptMap[group.departmentId] || 0) + group._count.id;
            }
        });
        // We still need names, but that's a small query
        const departments = await prisma.department.findMany({ select: { id: true, name: true } });
        const departmentStats = Object.entries(deptMap).map(([id, count]) => ({
            departmentId: id,
            name: departments.find(d => d.id === id)?.name || 'Unknown',
            count
        }));

        // 4. Urgent & Late Lists
        // We already have recentOrders. Let's filter them.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const urgentList = recentOrders.filter(o =>
            !['completed', 'delivered', 'collected', 'shipped'].includes(o.status) &&
            (o.priority === 'urgent' || (o.priority === 'high' && o.dueDate && new Date(o.dueDate) < today) || (o.dueDate && new Date(o.dueDate) < today))
        ).slice(0, 5); // Just take top 5

        const urgentOrdersCount = recentOrders.filter(o =>
            !['completed', 'delivered', 'collected', 'shipped'].includes(o.status) &&
            (o.priority === 'urgent' || (o.priority === 'high' && o.dueDate && new Date(o.dueDate) < today))
        ).length;

        const lateOrdersCount = recentOrders.filter(o =>
            o.dueDate && new Date(o.dueDate) < today &&
            !['completed', 'delivered', 'collected', 'shipped'].includes(o.status)
        ).length;

        // 5. Trends (Sparklines)
        const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        // Revenue Trend
        const revenueSparkline = last7DaysData.map(dateStr => {
            const dayOrders = recentOrders.filter(o => o.createdAt.toISOString().startsWith(dateStr));
            return dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        });

        // Completion Trend
        const completionTrend = last7DaysData.map(dateStr => {
            const dayCompleted = recentOrders.filter(o =>
                ['completed', 'delivered', 'collected', 'shipped'].includes(o.status) &&
                o.updatedAt && o.updatedAt.toISOString().startsWith(dateStr)
            );
            return { date: dateStr, count: dayCompleted.length };
        });

        // 6. Monthly Revenue (Last 12)
        // Group recentOrders by YYYY-MM
        const monthlyRevenueMap: Record<string, number> = {};
        recentOrders.forEach(o => {
            const monthKey = o.createdAt.toISOString().slice(0, 7); // YYYY-MM
            monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + (Number(o.totalAmount) || 0);
        });

        // Generate last 12 months keys
        const monthlyRevenueData = Array.from({ length: 12 }).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            const key = d.toISOString().slice(0, 7);
            return monthlyRevenueMap[key] || 0;
        });

        // 7. Production Leaderboard
        const maxCompleted = Math.max(...staffPerformance.map(u => u.ordersAssigned.length), 1);
        const productionLeaderboard = staffPerformance
            .map(u => ({
                userId: u.id,
                name: u.name || 'Unknown',
                role: u.workflowRole || 'Staff',
                ordersCompleted: u.ordersAssigned.length,
                performance: u.ordersAssigned.length === 0 ? 'On Track' : (u.ordersAssigned.length / maxCompleted >= 0.8 ? 'Fast' : u.ordersAssigned.length / maxCompleted >= 0.4 ? 'On Track' : 'Slow')
            }))
            .sort((a, b) => b.ordersCompleted - a.ordersCompleted)
            .slice(0, 5);

        // 8. Wallet
        const pendingWalletList = await prisma.walletTransaction.findMany({
            where: { status: 'pending' },
            take: 5,
            include: { agent: { select: { fullName: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // 9. Avg Turnaround
        const completedRecent = recentOrders.filter(o => ['completed', 'delivered', 'collected', 'shipped'].includes(o.status) && o.updatedAt);
        const totalDuration = completedRecent.reduce((sum, o) => {
            return sum + (new Date(o.updatedAt!).getTime() - new Date(o.createdAt).getTime());
        }, 0);
        const avgTurnaroundTime = completedRecent.length ? Math.round(totalDuration / completedRecent.length / (1000 * 60 * 60)) + 'h' : '0h';

        // 10. Production Load
        const inProduction = activeOrders; // Rough approximation or strictly use active statuses
        const maxCapacity = 32;
        const productionLoad = Math.round((inProduction / maxCapacity) * 100);

        // Invoice Helpers
        const unpaidInvoices = invoiceStats.find(s => s.status === 'Sent' || s.status === 'Draft');
        const paidInvoices = invoiceStats.find(s => s.status === 'Paid');

        return NextResponse.json({
            success: true,
            data: {
                totalRevenue: Number(totalRevenueAgg._sum.totalAmount || 0),
                monthlyRevenue: currentRevenue,
                revenueChange: Math.round(revenueChange * 10) / 10,
                revenueSparkline,
                monthlyRevenueData,
                totalOrders: orderCount,
                activeOrders,
                urgentOrders: urgentOrdersCount,
                lateOrders: urgentOrdersCount, // Logic reuse
                ordersByStatus: statusCounts,
                urgentOrdersList: urgentList.map(o => ({
                    id: o.id,
                    orderNumber: 'ORD', // Mock
                    status: o.status,
                    priority: o.priority,
                    dueDate: o.dueDate,
                    customer: o.customer
                })),
                inProduction,
                productionLoad,
                maxCapacity,
                pendingWalletAmount: Number(walletStats._sum.amount || 0),
                pendingWalletCount: walletStats._count.id || 0,
                pendingWalletList: pendingWalletList.map(w => ({ ...w, amount: Number(w.amount) })),
                totalCustomers: customerCount,
                totalProducts: productCount,
                totalAgents: agentCount,
                unpaidInvoicesCount: unpaidInvoices?._count.id || 0,
                unpaidInvoicesAmount: Number(unpaidInvoices?._sum.total || 0),
                paidInvoicesCount: paidInvoices?._count.id || 0,
                paidInvoicesAmount: Number(paidInvoices?._sum.total || 0),
                productionLeaderboard,
                departmentStats,
                completionTrend,
                avgTurnaroundTime
            }
        });

    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard stats: ' + error.message },
            { status: 500 }
        );
    }
}
