import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Default workflow status permissions
const defaultWorkflowSettings = [
    { id: 'new-order', name: 'New Order', color: 'bg-blue-500', order: 1, allowedRoles: ['admin'], description: 'Verify payment received' },
    { id: 'artwork-checking', name: 'Artwork Checking', color: 'bg-purple-500', order: 2, allowedRoles: ['admin'], description: 'Review customer files' },
    { id: 'designing', name: 'Designing', color: 'bg-pink-500', order: 3, allowedRoles: ['designer'], description: 'Create print-ready artwork with bleed' },
    { id: 'refining', name: 'Refining', color: 'bg-orange-500', order: 4, allowedRoles: ['designer'], description: 'Revise based on customer feedback' },
    { id: 'waiting-feedback', name: 'Waiting Customer Feedback', color: 'bg-yellow-500', order: 5, allowedRoles: ['admin'], description: 'Customer reviews proof' },
    { id: 'ready-to-print', name: 'Ready to Print', color: 'bg-cyan-500', order: 6, allowedRoles: ['production'], description: 'Download print files' },
    { id: 'in-production', name: 'In Production', color: 'bg-indigo-500', order: 7, allowedRoles: ['production'], description: 'Printing in progress' },
    { id: 'finishing', name: 'Finishing', color: 'bg-teal-500', order: 8, allowedRoles: ['production'], description: 'Post-print finishing' },
    { id: 'completed', name: 'Completed', color: 'bg-green-500', order: 9, allowedRoles: ['qc'], description: 'Quality check complete' },
    { id: 'collected', name: 'Collected', color: 'bg-gray-500', order: 10, allowedRoles: ['qc'], description: 'Customer picked up / delivered' },
];

const WORKFLOW_SETTINGS_KEY = 'workflow_status_permissions';

// GET - Fetch workflow settings
export async function GET() {
    try {
        // Try to get saved settings from database
        const settings = await prisma.settings.findFirst({
            where: {
                category: 'workflow',
                key: WORKFLOW_SETTINGS_KEY
            }
        });

        if (settings && settings.value) {
            // Return saved settings
            return NextResponse.json({
                success: true,
                data: settings.value
            });
        }

        // Return default settings if none saved
        return NextResponse.json({
            success: true,
            data: defaultWorkflowSettings
        });
    } catch (error) {
        console.error('Error fetching workflow settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch workflow settings' },
            { status: 500 }
        );
    }
}

// POST - Save workflow settings
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { statuses } = body;

        if (!statuses || !Array.isArray(statuses)) {
            return NextResponse.json(
                { success: false, error: 'Invalid workflow settings data' },
                { status: 400 }
            );
        }

        // Upsert the settings
        await prisma.settings.upsert({
            where: {
                category_key: {
                    category: 'workflow',
                    key: WORKFLOW_SETTINGS_KEY
                }
            },
            update: {
                value: statuses
            },
            create: {
                category: 'workflow',
                key: WORKFLOW_SETTINGS_KEY,
                value: statuses,
                description: 'Workflow status role permissions configuration'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Workflow settings saved successfully'
        });
    } catch (error) {
        console.error('Error saving workflow settings:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save workflow settings' },
            { status: 500 }
        );
    }
}
