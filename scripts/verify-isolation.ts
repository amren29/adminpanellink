
import { PrismaClient } from '@prisma/client'
import { getSecurePrisma } from '../src/lib/prisma-secure'

const prisma = new PrismaClient()

async function main() {
    console.log('🔒 Verifying SaaS Data Isolation...')

    // 1. Get the Default Organization
    const defaultOrg = await prisma.organization.findFirst({
        where: { slug: 'default-org' }
    })

    if (!defaultOrg) {
        throw new Error('Default Organization not found. Run migration first.')
    }

    console.log(`organizationId: ${defaultOrg.id}`)

    // 2. Test Access WITH correct ID
    console.log('\n--- Test 1: Access with Authorized Org ID ---')
    const authorizedDb = getSecurePrisma(defaultOrg.id)

    const users = await authorizedDb.user.findMany()
    console.log(`Found ${users.length} users. (Expected > 0)`)

    const specificOrder = await authorizedDb.order.findFirst()
    console.log(`Found order: ${specificOrder?.orderNumber ?? 'None'}`)

    if (users.length === 0) throw new Error('Failed to fetch data with correct Org ID')

    // 3. Test Access WITH FAKE ID (Simulate another tenant)
    console.log('\n--- Test 2: Access with Unauthorized Org ID ---')
    const fakeOrgId = '00000000-0000-0000-0000-000000000000'
    const unauthorizedDb = getSecurePrisma(fakeOrgId)

    const leakedUsers = await unauthorizedDb.user.findMany()
    console.log(`Found ${leakedUsers.length} users. (Expected 0)`)

    if (leakedUsers.length > 0) {
        console.error('❌ SECURITY FAILURE: Data leaked across organizations!')
        process.exit(1)
    } else {
        console.log('✅ SUCCESS: No data returned for unauthorized Org ID.')
    }

    // 4. Test Create (Should auto-inject Org ID)
    console.log('\n--- Test 3: Creation Injection ---')
    // We won't actually create to avoid polluting DB, but we can check the query if we could mock it.
    // Instead, we'll assume the extension works if findMany worked.
    // Or create a dummy tag/setting if possible?
    // Let's create a temporary Page draft

    const newPage = await authorizedDb.page.create({
        data: {
            title: 'Isolation Test Page',
            slug: 'isolation-test-' + Date.now(),
            status: 'draft'
        }
    })

    console.log(`Created page: ${newPage.id}`)

    // Verify it has the Org ID
    const directCheck = await prisma.page.findUnique({
        where: { id: newPage.id }
    })

    if (directCheck?.organizationId === defaultOrg.id) {
        console.log('✅ SUCCESS: organizationId was automatically injected.')
    } else {
        console.error('❌ FAILURE: organizationId was NOT injected.')
        console.log('Actual:', directCheck?.organizationId)
    }

    // Cleanup
    await prisma.page.delete({ where: { id: newPage.id } })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
