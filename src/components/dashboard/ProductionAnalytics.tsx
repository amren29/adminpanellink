"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AnalyticsData {
    departmentStats: { name: string; count: number }[];
    completionTrend: { date: string; count: number }[];
    avgTurnaroundTime: string;
}

export const ProductionAnalytics = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const json = await res.json();
                if (json.success && json.data) {
                    setData({
                        departmentStats: json.data.departmentStats || [],
                        completionTrend: json.data.completionTrend || [],
                        avgTurnaroundTime: json.data.avgTurnaroundTime || '0h',
                    });
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Department Chart Config
    const deptOptions: ApexOptions = {
        chart: {
            type: 'donut',
            fontFamily: 'inherit',
            background: 'transparent',
            toolbar: { show: false }
        },
        labels: data?.departmentStats.map(d => d.name) || [],
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '12px', fontWeight: 600 },
                        value: { show: true, fontSize: '20px', fontWeight: 700 },
                        total: {
                            show: true,
                            label: 'Total',
                            fontSize: '12px',
                            color: '#6b7280',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString()
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontFamily: 'inherit' },
        stroke: { show: false },
        theme: { mode: 'light' }
    };

    const deptSeries = data?.departmentStats.map(d => d.count) || [];

    // Trend Chart Config
    const trendOptions: ApexOptions = {
        chart: {
            type: 'area',
            fontFamily: 'inherit',
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        colors: ['#22c55e'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [20, 100]
            }
        },
        xaxis: {
            categories: data?.completionTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#9ca3af', fontSize: '12px' } }
        },
        yaxis: {
            show: false,
        },
        grid: {
            show: true,
            strokeDashArray: 4,
            padding: { top: 0, right: 0, bottom: 0, left: 10 }
        },
        tooltip: {
            theme: 'dark',
            y: { formatter: (val) => `${val} Orders` }
        }
    };

    const trendSeries = [{
        name: 'Completed',
        data: data?.completionTrend.map(d => d.count) || []
    }];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[350px]">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded-full w-64 h-64 mx-auto"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Completion Trend */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Production Velocity</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Orders completed in last 7 days</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-bold text-brand-600 dark:text-brand-400">{data?.avgTurnaroundTime}</span>
                        <span className="text-xs text-gray-400">Avg Turnaround</span>
                    </div>
                </div>
                <div className="h-[300px]">
                    <Chart options={trendOptions} series={trendSeries} type="area" height="100%" />
                </div>
            </div>

            {/* Department Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Orders by Department</h3>
                <div className="h-[300px] flex items-center justify-center">
                    {deptSeries.length > 0 ? (
                        <Chart options={deptOptions} series={deptSeries} type="donut" width="100%" />
                    ) : (
                        <div className="text-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};
