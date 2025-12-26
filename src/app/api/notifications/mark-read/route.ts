import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/fileDb";

export async function POST(request: Request) {
    try {
        const { id } = await request.json(); // id can be a specific ID or 'all'

        let notifications = await readJson<any[]>("notifications.json");

        if (id === 'all') {
            notifications = notifications.map(n => ({ ...n, isRead: true }));
        } else {
            const index = notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                notifications[index].isRead = true;
            }
        }

        await writeJson("notifications.json", notifications);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}
