"use client";
import React from "react";
import Image from "next/image";
import { Agent, tierColors, formatDate } from "./agentData";
import { formatCurrency } from "@/components/products/productData";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface AgentTableProps {
    agents: Agent[];
    onView: (agent: Agent) => void;
    onEdit: (agent: Agent) => void;
    onDelete: (agent: Agent) => void;
    onManageWallet: (agent: Agent) => void;
}

import ActionConfirmationModal from "@/components/ui/modal/ActionConfirmationModal";

const AgentTable: React.FC<AgentTableProps> = ({
    agents,
    onView,
    onEdit,
    onDelete,
    onManageWallet,
}) => {
    // Login Modal Removed

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <div className="min-w-[1100px]">
                        <Table>
                            {/* Table Header */}
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                <TableRow>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Agent
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Agent Code
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Wallet
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Commission
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Tier
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Contract
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Created
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHeader>

                            {/* Table Body */}
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                {agents.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="px-5 py-12 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                                            No agents found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    agents.map((agent) => (
                                        <TableRow key={agent.id}>
                                            {/* Agent Name & Email */}
                                            <TableCell className="px-5 py-4 text-start">
                                                <div className="flex flex-col">
                                                    <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                        {agent.fullName}
                                                    </span>
                                                    <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                                        {agent.email}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Agent Code */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <span className="font-mono text-sm font-medium text-brand-500 dark:text-brand-400">
                                                    {agent.agentCode}
                                                </span>
                                            </TableCell>

                                            {/* Wallet Balance */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <span className={`font-medium ${agent.walletBalance < 100 ? 'text-red-500' : 'text-success-600'}`}>
                                                    {formatCurrency(agent.walletBalance)}
                                                </span>
                                            </TableCell>

                                            {/* Commission Rate */}
                                            <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90">
                                                <span className="font-medium">{agent.commissionRate}%</span>
                                            </TableCell>

                                            {/* Agent Tier */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${tierColors[agent.agentTier].bg
                                                        } ${tierColors[agent.agentTier].text}`}
                                                >
                                                    {agent.agentTier}
                                                </span>
                                            </TableCell>

                                            {/* Contract Status */}
                                            <TableCell className="px-4 py-3 text-start">
                                                <Badge
                                                    size="sm"
                                                    color={agent.contractStatus === "Signed" ? "success" : "warning"}
                                                >
                                                    {agent.contractStatus}
                                                </Badge>
                                            </TableCell>

                                            {/* Created Date */}
                                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                                {formatDate(agent.createdDate)}
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="px-4 py-3">
                                                <div className="flex items-center gap-2">

                                                    {/* Manage Wallet Button */}
                                                    <button
                                                        onClick={() => onManageWallet(agent)}
                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors dark:hover:bg-green-900/20"
                                                        title="Manage Wallet"
                                                    >
                                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>

                                                    {/* View Button */}
                                                    <button
                                                        onClick={() => onView(agent)}
                                                        className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                        title="View"
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 18 18"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={() => onEdit(agent)}
                                                        className="p-2 text-gray-500 hover:text-warning-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                        title="Edit"
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 18 18"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M8.25 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V15C1.5 15.3978 1.65804 15.7794 1.93934 16.0607C2.22064 16.342 2.60218 16.5 3 16.5H13.5C13.8978 16.5 14.2794 16.342 14.5607 16.0607C14.842 15.7794 15 15.3978 15 15V9.75"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                d="M13.875 1.87499C14.1734 1.57662 14.578 1.40901 15 1.40901C15.422 1.40901 15.8266 1.57662 16.125 1.87499C16.4234 2.17336 16.591 2.57801 16.591 2.99999C16.591 3.42198 16.4234 3.82662 16.125 4.12499L9 11.25L6 12L6.75 9L13.875 1.87499Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => onDelete(agent)}
                                                        className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-gray-800"
                                                        title="Delete"
                                                    >
                                                        <svg
                                                            width="18"
                                                            height="18"
                                                            viewBox="0 0 18 18"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                d="M2.25 4.5H3.75H15.75"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                            <path
                                                                d="M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5H14.25Z"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Login Confirmation Modal */}

        </>
    );
};

export default AgentTable;
