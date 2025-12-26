export interface ReportTransaction {
    id: string;
    date: string; // ISO string
    amount: number;
    agentId: string;
    agentName: string;
    type: 'invoice' | 'topup'; // Sales vs Wallet
    status: 'completed' | 'pending';
}

export const generateMockTransactions = (count: number = 500): ReportTransaction[] => {
    const transactions: ReportTransaction[] = [];
    const now = new Date();
    const agents = [
        { id: '1', name: 'Alex Lim' },
        { id: '2', name: 'Sarah Jennings' },
        { id: '3', name: 'Mike K' },
        { id: '4', name: 'Ali Muthu' },
        { id: '5', name: 'John Doe' },
    ];

    for (let i = 0; i < count; i++) {
        // Random date within last 365 days
        const date = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const isSale = Math.random() > 0.3; // 70% sales, 30% topups

        transactions.push({
            id: `txn-${i}`,
            date: date.toISOString(),
            amount: isSale ? Math.floor(Math.random() * 500) + 50 : Math.floor(Math.random() * 2000) + 100, // Sales smaller, topups larger
            agentId: agent.id,
            agentName: agent.name,
            type: isSale ? 'invoice' : 'topup',
            status: 'completed'
        });
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Aggregation Utilities
export const aggregateData = (
    data: ReportTransaction[],
    period: 'day' | 'week' | 'month' | 'quarter' | 'year',
    groupBy: 'none' | 'agent'
) => {
    const grouped: Record<string, number> = {};

    data.forEach(txn => {
        const date = new Date(txn.date);
        let key = '';

        // Determine Time Key
        if (period === 'day') key = date.toISOString().split('T')[0];
        else if (period === 'week') {
            const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
            key = firstDay.toISOString().split('T')[0];
        }
        else if (period === 'month') key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        else if (period === 'quarter') key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
        else if (period === 'year') key = `${date.getFullYear()}`;

        // Append Group Key
        if (groupBy === 'agent') {
            key += `::${txn.agentName}`;
        }

        grouped[key] = (grouped[key] || 0) + txn.amount;
    });

    // Transform into Chart Data format
    // If grouped by agent, we need a different structure (series)

    return grouped;
};
