// Create Demo Organizations for Each Plan
// Run: node prisma/seed-demo-orgs.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Creating test organizations with subscriptions...');

    // Get plans
    const plans = await prisma.plan.findMany();
    const basicPlan = plans.find(p => p.slug === 'basic');
    const proPlan = plans.find(p => p.slug === 'pro');
    const enterprisePlan = plans.find(p => p.slug === 'enterprise');

    if (!basicPlan || !proPlan || !enterprisePlan) {
        console.log('Plans not found. Run seed-plans.ts first.');
        return;
    }

    const passwordHash = await bcrypt.hash('demo123', 10);

    // Create 3 test orgs
    const orgs = [
        { name: 'Demo Basic Shop', slug: 'demo-basic', plan: basicPlan },
        { name: 'Demo Pro Shop', slug: 'demo-pro', plan: proPlan },
        { name: 'Demo Enterprise Shop', slug: 'demo-enterprise', plan: enterprisePlan },
    ];

    for (const org of orgs) {
        // Check if exists
        const existing = await prisma.organization.findUnique({ where: { slug: org.slug } });
        if (existing) {
            console.log('  ⏭️  Skipping', org.name, '(already exists)');
            continue;
        }

        // Create org
        const newOrg = await prisma.organization.create({
            data: {
                name: org.name,
                slug: org.slug,
                storeName: org.name,
                themeColor: '#6366f1',
            }
        });

        // Create subscription
        await prisma.subscription.create({
            data: {
                organizationId: newOrg.id,
                planId: org.plan.id,
                status: 'active',
                billingCycle: 'monthly',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
        });

        // Create admin user
        await prisma.user.create({
            data: {
                organizationId: newOrg.id,
                name: org.name.replace('Demo ', '') + ' Admin',
                email: org.slug + '@demo.linkprint.com',
                passwordHash: passwordHash,
                role: 'admin',
            }
        });

        console.log('  ✅', org.name, '->', org.plan.name, 'plan');
    }

    console.log('\n🎉 Done! Login credentials:');
    console.log('   Email: demo-basic@demo.linkprint.com');
    console.log('   Email: demo-pro@demo.linkprint.com');
    console.log('   Email: demo-enterprise@demo.linkprint.com');
    console.log('   Password: demo123');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
