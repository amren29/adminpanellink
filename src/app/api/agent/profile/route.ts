import { NextResponse } from "next/server";
import { readJson } from "@/lib/fileDb";

// Mock Session - in real app, get ID from session/cookie
const DEFAULT_USER_ID = "agent-001";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || DEFAULT_USER_ID;

        const users = await readJson<any[]>("users.json");
        const user = users.find((u) => u.id === userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
