const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get Kaler Print org
    const org = await prisma.organization.findUnique({ where: { slug: 'kalerprint' } });
    if (!org) { console.log('Org not found'); return; }

    console.log('Creating products for:', org.name, '(', org.id, ')');

    const products = [
        {
            name: 'Business Cards',
            slug: 'business-cards',
            description: 'Premium quality business cards with matte or glossy finish',
            category: 'Print Materials',
            basePrice: 50,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'],
            organizationId: org.id
        },
        {
            name: 'Flyers & Brochures',
            slug: 'flyers-brochures',
            description: 'Full color flyers and brochures for your marketing needs',
            category: 'Print Materials',
            basePrice: 80,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400'],
            organizationId: org.id
        },
        {
            name: 'Banners & Signage',
            slug: 'banners-signage',
            description: 'Large format banners and signs for events and promotions',
            category: 'Large Format',
            basePrice: 150,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
            organizationId: org.id
        },
        {
            name: 'T-Shirt Printing',
            slug: 't-shirt-printing',
            description: 'Custom t-shirt printing with your logo or design',
            category: 'Apparel',
            basePrice: 35,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
            organizationId: org.id
        },
        {
            name: 'Stickers & Labels',
            slug: 'stickers-labels',
            description: 'Custom stickers and labels in various sizes and materials',
            category: 'Print Materials',
            basePrice: 25,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1600493505591-988aee7b923d?w=400'],
            organizationId: org.id
        },
        {
            name: 'Canvas Prints',
            slug: 'canvas-prints',
            description: 'High quality canvas prints for home or office decoration',
            category: 'Large Format',
            basePrice: 120,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1579783900882-c0d0e3a74b5f?w=400'],
            organizationId: org.id
        }
    ];

    for (const p of products) {
        try {
            await prisma.product.upsert({
                where: { slug: p.slug },
                update: p,
                create: p
            });
            console.log('✅ Created:', p.name);
        } catch (e) {
            console.log('❌ Error:', p.name, e.message);
        }
    }

    console.log('\n🎉 Done! Refresh the storefront to see products.');
}

main().finally(() => prisma.$disconnect());
