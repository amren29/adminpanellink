
import { Quote, Invoice, LineItem, generateInvoiceNumber, generateLineItemId, calculateLineItemTotal, calculateSubtotal, calculateTaxAmount, calculateTotal } from "./documentData";
import { ProductionOrder, OrderItem } from "@/components/production-board/productionData";

/**
 * Converts a Quote to an Invoice object.
 * Useful for automated workflows where an accepted quote automatically generates an invoice.
 */
export const convertQuoteToInvoice = (quote: Quote): Invoice => {
    return {
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        invoiceNumber: generateInvoiceNumber(),
        customerId: quote.customerId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        lineItems: quote.lineItems.map(item => ({ ...item })), // Deep copy items
        subtotal: quote.subtotal,
        taxRate: quote.taxRate,
        taxAmount: quote.taxAmount,
        total: quote.total,
        status: "Draft", // Default status for converted invoices
        createdDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default 30 days
        notes: `Converted from Quote ${quote.quoteNumber}. ${quote.notes || ""}`
    };
};

/**
 * Maps Invoice LineItems to Production OrderItems.
 */
export const mapInvoiceItemsToOrderItems = (lineItems: LineItem[]): OrderItem[] => {
    return lineItems.map((li, idx) => ({
        id: li.id || `oi-${Date.now()}-${idx}`,
        name: li.description,
        quantity: li.quantity,
        status: 'pending',
        departmentId: '', // Ideally, this comes from the product catalog if linked
        totalPrice: li.total,
        unitPrice: li.unitPrice,
        productId: li.productId, // Copy productId
        // Add more mapping if products are linked in the future
    }));
};

/**
 * Converts an Invoice to Production Order(s).
 * - Handles splitting orders by Department if items belong to different departments.
 * - If no department info is present, creates a single order.
 */
export const convertInvoiceToOrders = (
    invoice: Invoice,
    defaultDepartmentId: string = ""
): Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'>[] => {

    // map items
    const startItems = mapInvoiceItemsToOrderItems(invoice.lineItems);

    // Group items by Department
    const itemsByDept: Record<string, OrderItem[]> = {};

    startItems.forEach(item => {
        const dept = item.departmentId || defaultDepartmentId;
        if (!itemsByDept[dept]) itemsByDept[dept] = [];
        itemsByDept[dept].push(item);
    });

    const distinctDepts = Object.keys(itemsByDept);
    const baseOrderNumber = `ORD-${invoice.invoiceNumber.replace('INV-', '')}`;
    const groupId = distinctDepts.length > 1 ? `GRP-${Date.now()}` : undefined;

    const ordersToCreate: Omit<ProductionOrder, 'id' | 'proofHistory' | 'proofData'>[] = [];

    // If no specific departments found (or only one empty one), create single order
    if (distinctDepts.length === 0 || (distinctDepts.length === 1 && !distinctDepts[0])) {
        const totalAmount = startItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        ordersToCreate.push({
            orderNumber: baseOrderNumber,
            customerId: invoice.customerId, // Pass ID
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            departmentId: defaultDepartmentId,
            status: 'new-order',
            priority: 'normal',
            dueDate: invoice.dueDate,
            items: startItems,
            customerFiles: [],
            printFiles: [],
            deliveryMethod: 'pickup', // Default
            history: [{
                id: Math.random().toString(),
                action: 'Order created from Invoice',
                userId: 'system',
                userName: 'System',
                userRole: 'system',
                timestamp: new Date().toISOString(),
                notes: `Generated from ${invoice.invoiceNumber}`
            }],
            totalAmount: totalAmount,
            paidAmount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return ordersToCreate;
    }

    // Split Logic
    distinctDepts.forEach((deptId, idx) => {
        const suffix = distinctDepts.length > 1 ? `-${String.fromCharCode(65 + idx)}` : '';
        const deptItems = itemsByDept[deptId];
        const deptOrderNumber = `${baseOrderNumber}${suffix}`;
        const splitTotal = deptItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        ordersToCreate.push({
            orderNumber: deptOrderNumber,
            customerId: invoice.customerId, // Pass ID
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            departmentId: deptId,
            status: 'new-order',
            priority: 'normal',
            dueDate: invoice.dueDate,
            items: deptItems,
            customerFiles: [],
            printFiles: [],
            deliveryMethod: 'pickup', // Default
            history: [{
                id: Math.random().toString(),
                action: 'Order created from Invoice (Split)',
                userId: 'system',
                userName: 'System',
                userRole: 'system',
                timestamp: new Date().toISOString(),
                notes: `Generated from ${invoice.invoiceNumber}${groupId ? `, Group ID: ${groupId}` : ''}`
            }],
            totalAmount: splitTotal,
            paidAmount: 0,
            groupId: groupId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    });

    return ordersToCreate;
};
