"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppNotification } from "@/utils/notificationUtils";
import Badge from "@/components/ui/badge/Badge";
import { NotificationToast } from "@/components/ui/toast/NotificationToast";
import NotificationDetailModal from "./NotificationDetailModal";

export default function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async (isPolling = false) => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();

                // Check for new unread notifications if polling
                if (isPolling && data.unreadCount > unreadCount) {
                    // Find the newest unread to toast
                    const newest = data.notifications.find((n: AppNotification) => !n.isRead);
                    if (newest) {
                        toast.custom((t) => (
                            <NotificationToast
                                t={t}
                                title={newest.title}
                                description={newest.message}
                                onClose={() => router.push(newest.link)}
                            />
                        ), { duration: 5000 });
                        // Optional: Play sound
                    }
                }

                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications");
        }
    };

    // Initial fetch and Polling
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => {
            fetchNotifications(true);
        }, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [unreadCount]); // Re-run if unreadCount changes? No, interval captures state closure, strict mode might double mount. Actually simpler to just poll.

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: AppNotification) => {
        // Mark as read optimistically
        if (!notification.isRead) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await fetch('/api/notifications/mark-read', {
                method: 'POST',
                body: JSON.stringify({ id: notification.id }),
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Open modal with notification details
        setSelectedNotification(notification);
        setIsModalOpen(true);
        setIsOpen(false); // Close dropdown
    };

    const handleNavigateFromModal = (link: string) => {
        setIsModalOpen(false);
        setSelectedNotification(null);

        // Only navigate if we're going somewhere different
        if (link && link !== '/' && link !== window.location.pathname) {
            router.push(link);
        }
        // Otherwise just close the modal - user is already on the relevant page
    };

    const handleMarkAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        await fetch('/api/notifications/mark-read', {
            method: 'POST',
            body: JSON.stringify({ id: 'all' }), // 'all' handled by API
            headers: { 'Content-Type': 'application/json' }
        });
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors"
                >
                    <svg
                        className="w-6 h-6 fill-current"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                        />
                    </svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg dark:bg-gray-900 dark:border-gray-800 z-50">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    No notifications
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {notifications.map((notif) => (
                                        <li
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-brand-500' : 'bg-transparent'}`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center">
                            <Link href="/notifications" className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                View All History
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Detail Modal */}
            <NotificationDetailModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedNotification(null);
                }}
                notification={selectedNotification}
                onNavigate={handleNavigateFromModal}
            />
        </>
    );
}
