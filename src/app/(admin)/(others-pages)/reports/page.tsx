"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import {
    generateMockTransactions,
    aggregateData,
    ReportTransaction
} from "@/utils/mockReportData";
import {
    CalenderIcon,
    ArrowDownIcon
} from "@/icons"; // Assuming FilterIcon exists or I'll use another
// Using native inputs for simplicity in this complex view, or could use custom components
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Badge from "@/components/ui/badge/Badge";

import PlanGuard from "@/components/common/PlanGuard";

// Dynamically import ApexCharts
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

export default function ReportsPage() {
    // Top Level Tabs
    const [activeTab, setActiveTab] = useState<'sales' | 'production' | 'agents'>('sales');

    // Filter State
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Last 30 days
        end: new Date().toISOString().split('T')[0]
    });
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');
    const [groupBy, setGroupBy] = useState<'none' | 'agent'>('none');

    // Data State
    const [allData, setAllData] = useState<ReportTransaction[]>([]);
    const [filteredData, setFilteredData] = useState<ReportTransaction[]>([]);
    const [chartData, setChartData] = useState<any>({ categories: [], series: [] });

    // Load Initial Data
    useEffect(() => {
        const data = generateMockTransactions(1000); // Generate 1000 records
        setAllData(data);
    }, []);

    // Filter & Aggregate Data Effect
    useEffect(() => {
        if (allData.length === 0) return;

        // 1. Filter by Date Range & Tab Context
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime();

        const filtered = allData.filter(txn => {
            const txnDate = new Date(txn.date).getTime();
            const inDate = txnDate >= start && txnDate <= end;

            // Context Filtering
            if (activeTab === 'sales') return inDate && txn.type === 'invoice';
            if (activeTab === 'agents') return inDate; // Show all for agents? Or just topups? Let's show all for agents context
            return inDate;
        });

        setFilteredData(filtered);

        // 2. Aggregate for Chart
        const aggregated = aggregateData(filtered, period, groupBy);

        // 3. Format for ApexCharts
        const categories = Object.keys(aggregated).sort();
        const seriesData = categories.map(k => aggregated[k]);

        setChartData({
            categories,
            series: [{ name: 'Values', data: seriesData }]
        });

    }, [allData, dateRange, period, groupBy, activeTab]);

    // Chart Options
    const chartOptions: ApexOptions = {
        chart: { type: 'bar', height: 350, toolbar: { show: false } }, // Changed to bar for better readability
        plotOptions: { bar: { borderRadius: 4, horizontal: false } },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        xaxis: { categories: chartData.categories },
        yaxis: { title: { text: activeTab === 'sales' ? 'Revenue (RM)' : 'Count' } },
        fill: { opacity: 1 },
        colors: ['#3C50E0'],
        tooltip: {
            y: { formatter: (val) => `RM ${val}` }
        }
    };

    return (
        <PlanGuard feature="analytics">
            <div className="space-y-6">
                {/* Header & Main Tabs */}
                {/* ... existing header code ... */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Advanced Reports
                        </h2>
                        <p className="text-sm text-gray-500">
                            Analyze performance by date, period, and team.
                        </p>
                    </div>
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                        {['sales', 'production', 'agents'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="p-4 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 flex flex-wrap gap-4 items-end">
                    {/* Date Selection */}
                    <div className="w-full sm:w-auto flex flex-col gap-1">
                        <Label>Date Range</Label>
                        <div className="flex items-center gap-2">
                            <div className="w-[180px]">
                                <DatePicker
                                    id="startDate"
                                    defaultDate={new Date(dateRange.start)}
                                    onChange={(dates: Date[]) => {
                                        if (dates[0]) setDateRange(prev => ({ ...prev, start: dates[0].toISOString().split('T')[0] }))
                                    }}
                                />
                            </div>
                            <span className="text-gray-400">-</span>
                            <div className="w-[180px]">
                                <DatePicker
                                    id="endDate"
                                    defaultDate={new Date(dateRange.end)}
                                    onChange={(dates: Date[]) => {
                                        if (dates[0]) setDateRange(prev => ({ ...prev, end: dates[0].toISOString().split('T')[0] }))
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Period Selection */}
                    <div className="w-full sm:w-48 flex flex-col gap-1">
                        <Label>Group By Period</Label>
                        <Select
                            options={[
                                { value: "day", label: "Daily" },
                                { value: "week", label: "Weekly" },
                                { value: "month", label: "Monthly" },
                                { value: "quarter", label: "Quarterly" },
                                { value: "year", label: "Yearly" },
                            ]}
                            value={period}
                            onChange={(val) => setPeriod(val as any)}
                        />
                    </div>

                    {/* Group Selection */}
                    <div className="w-full sm:w-48 flex flex-col gap-1">
                        <Label>Group By Entity</Label>
                        <Select
                            options={[
                                { value: "none", label: "None (Total)" },
                                { value: "agent", label: "By Agent" },
                            ]}
                            value={groupBy}
                            onChange={(val) => setGroupBy(val as any)}
                        />
                    </div>
                </div>

                {/* Chart Section */}
                <div className="p-5 bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                        {activeTab === 'sales' ? 'Revenue Trend' : 'Activity Trend'}
                    </h3>
                    {chartData.series.length > 0 && typeof window !== 'undefined' && (
                        <ReactApexChart
                            options={chartOptions}
                            series={chartData.series}
                            type="bar"
                            height={350}
                        />
                    )}
                </div>

                {/* Detailed Table */}
                <div className="overflow-hidden bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Detailed Breakdown</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Transaction ID</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.slice(0, 50).map((txn) => ( // Show top 50, pagination would be better
                                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                            {txn.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">
                                            {txn.agentName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge color={txn.type === 'invoice' ? 'success' : 'warning'}>
                                                {txn.type}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-white text-right">
                                            RM {txn.amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredData.length > 50 && (
                            <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100 dark:border-gray-800">
                                Showing first 50 of {filteredData.length} records
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PlanGuard>
    );
}
