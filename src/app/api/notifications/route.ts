import { NextResponse } from "next/server";
import { readJson } from "@/lib/fileDb";

export async function GET() {
    try {
        const notifications = await readJson<any[]>("notifications.json");
        // Limit to latest 20 for UI
        const latestInfo = notifications.slice(0, 20);
        const unreadCount = notifications.filter((n: any) => !n.isRead).length;

        return NextResponse.json({
            notifications: latestInfo,
            unreadCount
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
