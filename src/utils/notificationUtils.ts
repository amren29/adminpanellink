import { readJson, writeJson } from "@/lib/fileDb";

export interface AppNotification {
    id: string;
    type: 'order' | 'finance' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    link: string;
    resourceId?: string; // Optional: order number, agent ID, etc.
    createdAt: string;
}

export const createNotification = async (
    type: 'order' | 'finance' | 'system',
    title: string,
    message: string,
    link: string,
    resourceId?: string
) => {
    try {
        const notifications = await readJson<AppNotification[]>('notifications.json');

        const newNotification: AppNotification = {
            id: `notif_${Date.now()}`,
            type,
            title,
            message,
            isRead: false,
            link,
            resourceId,
            createdAt: new Date().toISOString()
        };

        notifications.unshift(newNotification); // Add to top

        // Keep only last 100 for performance in this file-based demo
        if (notifications.length > 100) {
            notifications.length = 100;
        }

        await writeJson('notifications.json', notifications);
        return newNotification;
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};
