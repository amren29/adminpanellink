import { create } from "zustand";
import { Quote, Invoice } from "./documentData";
import { ProductionOrder } from "../production-board/productionData";

interface DocumentState {
    quotes: Quote[];
    invoices: Invoice[];
    orders: ProductionOrder[];

    // Quote Actions
    setQuotes: (quotes: Quote[]) => void;
    addQuote: (quote: Quote) => void;
    updateQuote: (id: string, updates: Partial<Quote>) => void;
    deleteQuote: (id: string) => void;

    // Invoice Actions
    setInvoices: (invoices: Invoice[]) => void;
    addInvoice: (invoice: Invoice) => void;
    updateInvoice: (id: string, updates: Partial<Invoice>) => void;
    deleteInvoice: (id: string) => void;

    // Order Actions
    setOrders: (orders: ProductionOrder[]) => void;
    addOrder: (order: ProductionOrder | ProductionOrder[]) => void;
    updateOrder: (id: string, updates: Partial<ProductionOrder>) => void;
    deleteOrder: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
    quotes: [],
    invoices: [],
    orders: [],

    // Quote Actions
    setQuotes: (quotes) => set({ quotes }),
    addQuote: (quote) => set((state) => ({ quotes: [quote, ...state.quotes] })),
    updateQuote: (id, updates) => set((state) => ({
        quotes: state.quotes.map((q) => q.id === id ? { ...q, ...updates } : q)
    })),
    deleteQuote: (id) => set((state) => ({
        quotes: state.quotes.filter((q) => q.id !== id)
    })),

    // Invoice Actions
    setInvoices: (invoices) => set({ invoices }),
    addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
    updateInvoice: (id, updates) => set((state) => ({
        invoices: state.invoices.map((i) => i.id === id ? { ...i, ...updates } : i)
    })),
    deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter((i) => i.id !== id)
    })),

    // Order Actions
    setOrders: (orders) => set({ orders }),
    addOrder: (order) => set((state) => {
        const newOrders = Array.isArray(order) ? order : [order];
        return { orders: [...newOrders, ...state.orders] };
    }),
    updateOrder: (id, updates) => set((state) => ({
        orders: state.orders.map((o) => o.id === id ? { ...o, ...updates } : o)
    })),
    deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter((o) => o.id !== id)
    })),
}));
