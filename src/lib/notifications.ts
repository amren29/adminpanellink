
import { Order, OrderItem, Customer, User } from '@prisma/client';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface EmailResult {
    success: boolean;
    error?: string;
    id?: string;
    simulated?: boolean;
}

// Helper to get emoji for status
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

/**
 * Send Order Status Update Email to Customer
 */
export async function sendOrderStatusEmail(
    order: Order & { items: OrderItem[] },
    customer: { email: string; fullName: string },
    newStatus: string
): Promise<EmailResult> {
    if (!RESEND_API_KEY) {
        console.log('📧 [SIMULATION] Status Update Email');
        console.log(`To: ${customer.email}`);
        console.log(`Order: ${order.orderNumber} -> ${newStatus}`);
        return { success: true, simulated: true };
    }

    const statusEmoji = getStatusEmoji(newStatus);
    const statusColor = getStatusColor(newStatus);
    const statusText = formatStatus(newStatus);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Order Status Update</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">Order #${order.orderNumber}</p>
        </div>
        
        <div style="padding: 24px;">
            <p style="margin: 0 0 16px; color: #374151;">Hello ${customer.fullName},</p>
            <p style="margin: 0 0 20px; color: #374151;">Your order status has been updated:</p>
            
            <div style="background: ${statusColor}20; border-left: 4px solid ${statusColor}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${statusColor};">
                    ${statusEmoji} ${statusText}
                </p>
            </div>
            
            ${order.items?.length ? `
            <h3 style="margin: 0 0 12px; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Items</h3>
            <ul style="margin: 0 0 20px; padding-left: 20px; color: #6b7280;">
                ${order.items.map(item =>
        `<li style="margin-bottom: 4px;">${item.name}${item.quantity ? ` x ${item.quantity}` : ''}</li>`
    ).join('')}
            </ul>
            ` : ''}
            
            <p style="margin: 0; color: #9ca3af; font-size: 14px;">Thank you for your business!</p>
        </div>
        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            Automated message from EJ Event Management. Please do not reply.
        </div>
    </div>
</body>
</html>`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: EMAIL_FROM,
                to: customer.email,
                subject: `Order ${order.orderNumber} Status: ${statusText} ${statusEmoji}`,
                html: htmlContent
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Resend error:', error);
            return { success: false, error: JSON.stringify(error) };
        }

        const result = await response.json();
        return { success: true, id: result.id };
    } catch (error: any) {
        console.error('Email send failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send Assignment Email to Staff
 */
export async function sendAssignmentEmail(
    order: Order,
    staff: { email: string; name: string },
    role: string
): Promise<EmailResult> {
    if (!RESEND_API_KEY) {
        console.log('📧 [SIMULATION] Assignment Email');
        console.log(`To: ${staff.email}`);
        console.log(`Order: ${order.orderNumber} -> Assigned as ${role}`);
        return { success: true, simulated: true };
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; padding: 20px;">
    <h2>New Order Assignment</h2>
    <p>Hi ${staff.name},</p>
    <p>You have been assigned to order <strong>${order.orderNumber}</strong>.</p>
    <p><strong>Role:</strong> ${role}</p>
    <p><strong>Due Date:</strong> ${order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A'}</p>
    <p>Please check the production board for details.</p>
</body>
</html>`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: EMAIL_FROM,
                to: staff.email,
                subject: `New Assignment: Order ${order.orderNumber}`,
                html: htmlContent
            })
        });

        if (!response.ok) return { success: false, error: 'Failed to send' };
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}
