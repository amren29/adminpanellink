import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/storefront/[slug]/theme
// Public endpoint - fetches organization branding for storefront
export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params

        // Find organization by slug or custom domain
        const org = await prisma.organization.findFirst({
            where: {
                OR: [
                    { slug },
                    { customDomain: slug }
                ]
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                storeName: true,
                themeColor: true,
                accentColor: true,
                customDomain: true,
            }
        })

        if (!org) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 })
        }

        return NextResponse.json({
            id: org.id,
            name: org.storeName || org.name,
            slug: org.slug,
            logo: org.logoUrl,
            theme: {
                primary: org.themeColor || '#6366f1',
                accent: org.accentColor || '#f59e0b',
            },
            customDomain: org.customDomain,
        })
    } catch (error) {
        console.error('Error fetching storefront theme:', error)
        return NextResponse.json(
            { error: 'Failed to fetch store info' },
            { status: 500 }
        )
    }
}
