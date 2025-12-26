"use client";
import React from "react";
import { Modal } from "@/components/ui/modal";
import { AppNotification } from "@/utils/notificationUtils";
import Button from "@/components/ui/button/Button";

interface NotificationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: AppNotification | null;
    onNavigate: (link: string) => void;
}

export default function NotificationDetailModal({
    isOpen,
    onClose,
    notification,
    onNavigate
}: NotificationDetailModalProps) {
    if (!notification) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'order':
                return (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                );
            case 'finance':
                return (
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'system':
                return (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                );
        }
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            order: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            finance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            system: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        };
        return styles[type] || 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md w-full">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-2 ${getTypeBadge(notification.type)}`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {notification.message}
                    </p>
                </div>

                {/* Resource ID (Order Number, etc.) */}
                {notification.resourceId && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Reference
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            #{notification.resourceId}
                        </p>
                    </div>
                )}

                {/* Timestamp */}
                <div className="mb-6 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(notification.createdAt).toLocaleString('en-MY', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => onNavigate(notification.link)}
                    >
                        View Details
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
