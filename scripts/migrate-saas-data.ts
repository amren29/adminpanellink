
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting SaaS Data Migration...')

    // 1. Create or Find Default Organization
    let defaultOrg = await prisma.organization.findFirst({
        where: { slug: 'default-org' }
    })

    if (!defaultOrg) {
        console.log('Creating Default Organization...')
        defaultOrg = await prisma.organization.create({
            data: {
                name: 'Default Organization',
                slug: 'default-org',
            }
        })
        console.log(`✅ Created Default Organization: ${defaultOrg.id}`)
    } else {
        console.log(`ℹ️ Default Organization already exists: ${defaultOrg.id}`)
    }

    const orgId = defaultOrg.id

    // 2. Helper to update models
    const updateModel = async (modelName: string, model: any) => {
        // Check if model has updateMany and organizationId field
        // In TS we can just trust the schema, but we'll try/catch for safety
        try {
            const result = await model.updateMany({
                where: { organizationId: null },
                data: { organizationId: orgId }
            })
            if (result.count > 0) {
                console.log(`✅ Updated ${result.count} ${modelName} records.`)
            } else {
                console.log(`Coinfig: No orphaned ${modelName} records found.`)
            }
        } catch (e: any) {
            console.error(`❌ Error updating ${modelName}: ${e.message}`)
        }
    }

    // 3. Update all core models
    console.log('Migrating data...')

    await updateModel('User', prisma.user)
    await updateModel('Customer', prisma.customer)
    await updateModel('Agent', prisma.agent)
    await updateModel('Department', prisma.department)
    await updateModel('Product', prisma.product)
    await updateModel('Order', prisma.order)
    await updateModel('Quote', prisma.quote)
    await updateModel('Invoice', prisma.invoice)
    await updateModel('Promotion', prisma.promotion)
    await updateModel('Package', prisma.package)
    await updateModel('Page', prisma.page)
    await updateModel('Payment', prisma.payment)

    // Settings is unique by [category, key] so updateMany is fine, 
    // but if we had conflicting constraints it might fail. 
    // Since we haven't strictly enforced [orgId, cat, key] yet, this is safe.
    await updateModel('Settings', prisma.settings)

    console.log('🎉 Migration completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
