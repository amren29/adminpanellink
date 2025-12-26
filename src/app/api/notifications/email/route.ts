import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Email notification API - sends status change emails
// Requires RESEND_API_KEY environment variable

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { to, orderNumber, customerName, newStatus, items, subject } = body;

        if (!to || !orderNumber || !newStatus) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for Resend API key
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            // Log email instead of sending
            console.log('📧 Email Notification (No RESEND_API_KEY configured):');
            console.log(`   To: ${to}`);
            console.log(`   Subject: ${subject || `Order ${orderNumber} - Status Update`}`);
            console.log(`   Order: ${orderNumber}`);
            console.log(`   Customer: ${customerName}`);
            console.log(`   New Status: ${newStatus}`);
            console.log(`   Items: ${items?.map((i: { name: string }) => i.name).join(', ') || 'N/A'}`);

            return NextResponse.json({
                success: true,
                message: 'Email logged (RESEND_API_KEY not configured)',
                simulated: true
            });
        }

        // Build HTML email
        const statusEmoji = getStatusEmoji(newStatus);
        const statusColor = getStatusColor(newStatus);

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Order #${orderNumber}</p>
        </div>
        
        <div style="padding: 24px;">
            <p style="margin: 0 0 16px; color: #374151;">Hello ${customerName || 'Valued Customer'},</p>
            
            <p style="margin: 0 0 20px; color: #374151;">Your order status has been updated:</p>
            
            <div style="background: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${statusColor};">
                    ${statusEmoji} ${formatStatus(newStatus)}
                </p>
            </div>
            
            ${items?.length ? `
            <h3 style="margin: 0 0 12px; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Items</h3>
            <ul style="margin: 0 0 20px; padding-left: 20px; color: #6b7280;">
                ${items.map((item: { name: string; quantity?: number }) =>
            `<li style="margin-bottom: 4px;">${item.name}${item.quantity ? ` x ${item.quantity}` : ''}</li>`
        ).join('')}
            </ul>
            ` : ''}
            
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Thank you for your business!
            </p>
        </div>
        
        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            This is an automated message. Please do not reply directly.
        </div>
    </div>
</body>
</html>`;

        // Send via Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
                to,
                subject: subject || `Order ${orderNumber} - Status Update: ${formatStatus(newStatus)}`,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend error:', error);
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
        }

        const result = await response.json();
        return NextResponse.json({ success: true, id: result.id });

    } catch (error) {
        console.error('Email notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper functions
function getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
        'new_order': '🆕',
        'pending_artwork': '🎨',
        'designing': '✏️',
        'proof_sent': '📤',
        'design_revision': '🔄',
        'artwork_ready': '✅',
        'in_production': '🏭',
        'qc_check': '🔍',
        'completed': '✨',
        'ready_to_ship': '📦',
        'shipped': '🚚',
        'delivered': '🎉',
        'collected': '🙌'
    };
    return emojis[status] || '📋';
}

function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        'new_order': '#3b82f6',
        'pending_artwork': '#f59e0b',
        'designing': '#8b5cf6',
        'proof_sent': '#06b6d4',
        'design_revision': '#f97316',
        'artwork_ready': '#10b981',
        'in_production': '#6366f1',
        'qc_check': '#14b8a6',
        'completed': '#22c55e',
        'ready_to_ship': '#eab308',
        'shipped': '#3b82f6',
        'delivered': '#22c55e',
        'collected': '#22c55e'
    };
    return colors[status] || '#6b7280';
}

function formatStatus(status: string): string {
    return status.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}
