"use client";
import React from "react";
import { ProductionBoard } from "@/components/production-board";

export default function ProductionBoardPage() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
                        Operation Board
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Track and manage operation orders
                    </p>
                </div>
                <nav>
                    <ol className="flex items-center gap-2 text-sm">
                        <li>
                            <a href="/" className="text-gray-500 hover:text-brand-500 dark:text-gray-400">
                                Home
                            </a>
                        </li>
                        <li className="text-gray-400 dark:text-gray-500">/</li>
                        <li className="text-brand-500">Operation Board</li>
                    </ol>
                </nav>
            </div>

            {/* Production Board */}
            <ProductionBoard />
        </div>
    );
}
