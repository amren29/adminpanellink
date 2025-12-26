import { NextResponse } from "next/server";
import { createNotification } from "@/utils/notificationUtils"; // Assuming this is safe to use in API route (server)

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, message, link, resourceId } = body;

        if (!type || !title || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const notification = await createNotification(type, title, message, link || '#', resourceId);

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }
}
