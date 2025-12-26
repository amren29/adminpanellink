// LinkPrint Plan Seed Script - uses upsert to avoid foreign key issues
// Run: npx ts-node prisma/seed-plans.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// BASIC PLAN FEATURES
const basicFeatures = {
    products: true,
    orders: true,
    quotes: true,
    invoices: true,
    departments: true,      // Operation Board
    staff: true,            // User Management
    workflow: true,         // Workflow Settings
    profile: true,          // User Profile

    // Hidden for Basic
    customers: true,        // Customers visible
    agents: false,
    transactions: false,
    paymentGateway: false,
    promotions: false,
    packages: false,
    analytics: false,
    shipments: false,
    pricingEngine: false,   // No Pricing Engine for Basic
    liveTracking: false,    // No Live Order Tracking for Basic
    storefront: false,
    publicLogin: false,
    customerLogin: false,
    agentManualTopup: true,
    agentAutoTopup: false,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false
}

// PRO PLAN FEATURES (everything)
const proFeatures = {
    products: true,
    orders: true,
    quotes: true,
    invoices: true,
    departments: true,
    staff: true,
    workflow: true,
    profile: true,
    customers: true,
    agents: true,
    transactions: true,
    paymentGateway: true,
    promotions: true,
    packages: true,
    analytics: true,
    shipments: true,
    pricingEngine: true,    // Pricing Engine for Pro
    liveTracking: true,     // Live Order Tracking for Pro
    storefront: true,
    publicLogin: true,
    customerLogin: true,
    agentManualTopup: true,
    agentAutoTopup: true,
    whiteLabel: false,
    customDomain: false,
    apiAccess: false
}

// ENTERPRISE PLAN FEATURES (everything + white label)
const enterpriseFeatures = {
    ...proFeatures,
    whiteLabel: true,
    customDomain: true,
    apiAccess: true
}

async function main() {
    console.log('🌱 Updating LinkPrint Plans...')

    // Use upsert to avoid foreign key issues
    const basic = await prisma.plan.upsert({
        where: { slug: 'basic' },
        update: {
            name: 'Basic',
            description: 'Internal Operations - Staff Only',
            monthlyPrice: 299,
            yearlyPrice: 2990,
            maxUsers: 5,
            maxOrders: 100,
            maxProducts: 50,
            maxStorageMb: 1000,
            features: basicFeatures,
            displayOrder: 1,
            isActive: true
        },
        create: {
            name: 'Basic',
            slug: 'basic',
            description: 'Internal Operations - Staff Only',
            monthlyPrice: 299,
            yearlyPrice: 2990,
            maxUsers: 5,
            maxOrders: 100,
            maxProducts: 50,
            maxStorageMb: 1000,
            features: basicFeatures,
            displayOrder: 1,
            isActive: true
        }
    })
    console.log('✅ Basic plan updated')

    const pro = await prisma.plan.upsert({
        where: { slug: 'pro' },
        update: {
            name: 'Pro',
            description: 'Full Automation + Storefront',
            monthlyPrice: 599,
            yearlyPrice: 5990,
            maxUsers: 20,
            maxOrders: 500,
            maxProducts: 200,
            maxStorageMb: 5000,
            features: proFeatures,
            displayOrder: 2,
            isActive: true
        },
        create: {
            name: 'Pro',
            slug: 'pro',
            description: 'Full Automation + Storefront',
            monthlyPrice: 599,
            yearlyPrice: 5990,
            maxUsers: 20,
            maxOrders: 500,
            maxProducts: 200,
            maxStorageMb: 5000,
            features: proFeatures,
            displayOrder: 2,
            isActive: true
        }
    })
    console.log('✅ Pro plan updated')

    const enterprise = await prisma.plan.upsert({
        where: { slug: 'enterprise' },
        update: {
            name: 'Enterprise',
            description: 'White Label + Custom Domain',
            monthlyPrice: 1200,
            yearlyPrice: 12000,
            maxUsers: 100,
            maxOrders: 10000,
            maxProducts: 1000,
            maxStorageMb: 50000,
            features: enterpriseFeatures,
            displayOrder: 3,
            isActive: true
        },
        create: {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'White Label + Custom Domain',
            monthlyPrice: 1200,
            yearlyPrice: 12000,
            maxUsers: 100,
            maxOrders: 10000,
            maxProducts: 1000,
            maxStorageMb: 50000,
            features: enterpriseFeatures,
            displayOrder: 3,
            isActive: true
        }
    })
    console.log('✅ Enterprise plan updated')

    console.log('\n🎉 Plans updated successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
