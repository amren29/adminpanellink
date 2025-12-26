import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting clean database seed...')

    // Clear ALL existing data
    console.log('Clearing all existing data...')

    // Clear in reverse order of dependencies
    await prisma.platformActivityLog.deleteMany()
    await prisma.platformAdmin.deleteMany()
    await prisma.activityLog.deleteMany()
    await prisma.orderComment.deleteMany()
    await prisma.orderAssignment.deleteMany()
    await prisma.promotionUsage.deleteMany()
    await prisma.artworkProof.deleteMany()
    await prisma.fileAttachment.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.lineItem.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.packageItem.deleteMany()
    await prisma.package.deleteMany()
    await prisma.promotion.deleteMany()
    await prisma.walletTransaction.deleteMany()
    await prisma.productOption.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.inventoryLog.deleteMany()
    await prisma.fixedQuantity.deleteMany()
    await prisma.pricingTier.deleteMany()
    await prisma.product.deleteMany()
    await prisma.agent.deleteMany()
    await prisma.address.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.shopCart.deleteMany()
    await prisma.shopOrder.deleteMany()
    await prisma.shopCustomer.deleteMany()
    await prisma.page.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.department.deleteMany()
    await prisma.user.deleteMany()
    await prisma.usageLog.deleteMany()
    await prisma.billingInvoice.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.orderSequence.deleteMany()
    await prisma.announcement.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.plan.deleteMany()

    console.log('✅ All data cleared!')

    // Create Platform Super Admin
    console.log('Creating Platform Super Admin...')
    const passwordHash = await bcrypt.hash('admin123', 10)

    const superAdmin = await prisma.platformAdmin.create({
        data: {
            email: 'admin@linkprint.com',
            passwordHash,
            name: 'LinkPrint Admin',
            role: 'superadmin',
            isActive: true,
        }
    })

    console.log(`✅ Platform Super Admin created!`)
    console.log(`   Email: admin@linkprint.com`)
    console.log(`   Password: admin123`)
    console.log(`   Role: superadmin`)

    // Create Default Plans (for new organizations to subscribe to)
    console.log('Creating default plans...')

    const basicPlan = await prisma.plan.create({
        data: {
            name: 'Basic',
            slug: 'basic',
            description: 'Internal Operations - Staff Only',
            monthlyPrice: 299,
            yearlyPrice: 2990,
            maxUsers: 5,
            maxOrders: 100,
            maxProducts: 50,
            maxStorageMb: 1000,
            features: {
                products: true,
                orders: true,
                quotes: true,
                invoices: true,
                departments: true,
                staff: true,
                workflow: true,
                profile: true,
                customers: true,
                agents: false,
                transactions: false,
                paymentGateway: false,
                promotions: false,
                packages: false,
                analytics: false,
                shipments: false,
                pricingEngine: false,
                liveTracking: false,
                storefront: false,
            },
            displayOrder: 1,
            isActive: true
        }
    })

    const proPlan = await prisma.plan.create({
        data: {
            name: 'Pro',
            slug: 'pro',
            description: 'Full Automation + Storefront',
            monthlyPrice: 599,
            yearlyPrice: 5990,
            maxUsers: 10,
            maxOrders: 500,
            maxProducts: 200,
            maxStorageMb: 5000,
            features: {
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
                pricingEngine: true,
                liveTracking: true,
                storefront: true,
            },
            displayOrder: 2,
            isActive: true
        }
    })

    const enterprisePlan = await prisma.plan.create({
        data: {
            name: 'Enterprise',
            slug: 'enterprise',
            description: 'White Label + Custom Domain',
            monthlyPrice: 1200,
            yearlyPrice: 12000,
            maxUsers: -1, // Unlimited
            maxOrders: 10000,
            maxProducts: 1000,
            maxStorageMb: 50000,
            features: {
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
                pricingEngine: true,
                liveTracking: true,
                storefront: true,
                whiteLabel: true,
                customDomain: true,
                apiAccess: true,
            },
            displayOrder: 3,
            isActive: true
        }
    })

    console.log(`✅ Plans created: Basic, Pro, Enterprise`)

    console.log('')
    console.log('🎉 Clean database setup complete!')
    console.log('')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║                    SUPER ADMIN LOGIN                         ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  Email:    admin@linkprint.com                               ║')
    console.log('║  Password: admin123                                          ║')
    console.log('║  Role:     superadmin (access to all organizations)          ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Login to /superadmin with the above credentials')
    console.log('  2. Create new Organizations for print shop clients')
    console.log('  3. Each org gets their own Users, Products, Orders, etc.')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
