/**
 * LinkPrint Access Control Utility
 * 
 * Checks if an organization has access to features based on their plan.
 * 
 * Usage:
 *   const access = await getOrgAccess(organizationId);
 *   if (access.can('paymentGateway')) { ... }
 *   if (access.isBasic) { ... }
 */

import prisma from './prisma'

// Feature names that can be checked
export type FeatureName =
    // Core
    | 'products' | 'orders' | 'customers'
    // Staff & CRM
    | 'staff' | 'agents' | 'agentManualTopup' | 'agentAutoTopup'
    // Storefront
    | 'storefront' | 'publicLogin' | 'customerLogin'
    // Financial
    | 'quotes' | 'invoices' | 'paymentGateway'
    // Advanced
    | 'departments' | 'promotions' | 'packages' | 'analytics'
    // Branding
    | 'whiteLabel' | 'customDomain' | 'apiAccess'

// Plan feature interface
interface PlanFeatures {
    [key: string]: boolean
}

// Access control result
interface OrgAccess {
    planName: string
    planSlug: string
    isBasic: boolean
    isPro: boolean
    isEnterprise: boolean
    features: PlanFeatures
    limits: {
        maxUsers: number
        maxOrders: number
        maxProducts: number
        maxStorageMb: number
    }
    can: (feature: FeatureName) => boolean
    cannot: (feature: FeatureName) => boolean
}

// Default access for orgs without subscription (treat as Basic)
const DEFAULT_ACCESS: OrgAccess = {
    planName: 'Basic',
    planSlug: 'basic',
    isBasic: true,
    isPro: false,
    isEnterprise: false,
    features: {
        products: true,
        orders: true,
        customers: true,
        staff: true,
        agents: true,
        agentManualTopup: true,
        agentAutoTopup: false,
        storefront: false,
        publicLogin: false,
        customerLogin: false,
        quotes: true,
        invoices: true,
        paymentGateway: false,
        departments: false,
        promotions: false,
        packages: false,
        analytics: false,
        whiteLabel: false,
        customDomain: false,
        apiAccess: false
    },
    limits: {
        maxUsers: 5,
        maxOrders: 100,
        maxProducts: 50,
        maxStorageMb: 1000
    },
    can: function (feature: FeatureName) { return this.features[feature] === true },
    cannot: function (feature: FeatureName) { return this.features[feature] !== true }
}

/**
 * Get access control for an organization
 */
export async function getOrgAccess(organizationId: string): Promise<OrgAccess> {
    try {
        const subscription = await prisma.subscription.findUnique({
            where: { organizationId },
            include: { plan: true }
        })

        if (!subscription || !subscription.plan) {
            return DEFAULT_ACCESS
        }

        const plan = subscription.plan
        const features = (plan.features as PlanFeatures) || {}

        const access: OrgAccess = {
            planName: plan.name,
            planSlug: plan.slug,
            isBasic: plan.slug === 'basic',
            isPro: plan.slug === 'pro',
            isEnterprise: plan.slug === 'enterprise',
            features,
            limits: {
                maxUsers: plan.maxUsers,
                maxOrders: plan.maxOrders,
                maxProducts: plan.maxProducts,
                maxStorageMb: plan.maxStorageMb
            },
            can: function (feature: FeatureName) { return this.features[feature] === true },
            cannot: function (feature: FeatureName) { return this.features[feature] !== true }
        }

        return access
    } catch (error) {
        console.error('Error getting org access:', error)
        return DEFAULT_ACCESS
    }
}

/**
 * Quick check if org can access a feature
 */
export async function canAccess(organizationId: string, feature: FeatureName): Promise<boolean> {
    const access = await getOrgAccess(organizationId)
    return access.can(feature)
}

/**
 * Get cached access (for use in components after initial load)
 * This should be passed from server component to client
 */
export function createAccessChecker(features: PlanFeatures) {
    return {
        can: (feature: FeatureName) => features[feature] === true,
        cannot: (feature: FeatureName) => features[feature] !== true
    }
}
/**
 * Check if org has reached usage limit for a resource
 * Throws error if limit reached
 */
export async function checkUsageLimit(organizationId: string, resource: 'users' | 'orders' | 'products'): Promise<void> {
    const access = await getOrgAccess(organizationId)
    const limit = resource === 'users' ? access.limits.maxUsers :
        resource === 'orders' ? access.limits.maxOrders :
            resource === 'products' ? access.limits.maxProducts : 0

    // -1 means unlimited
    if (limit === -1) return

    let count = 0
    if (resource === 'users') {
        count = await prisma.user.count({ where: { organizationId } })
    } else if (resource === 'orders') {
        count = await prisma.order.count({ where: { organizationId } })
    } else if (resource === 'products') {
        count = await prisma.product.count({ where: { organizationId } })
    }

    if (count >= limit) {
        throw new Error(`Plan limit reached for ${resource} (${limit}). Upgrade your plan to add more.`)
    }
}
