import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding default departments...')

    const departments = [
        { id: "solvent", name: "Solvent / Eco-Solvent", description: "Banners, Stickers, Large Format Prints", displayOrder: 1 },
        { id: "uv-flatbed", name: "UV Flatbed", description: "Rigid substrate printing", displayOrder: 2 },
        { id: "digital-cutting", name: "Digital Cutting & CNC", description: "Precision cutting and shaping", displayOrder: 3 },
        { id: "fabrication", name: "Fabrication / Metalworks", description: "Metal structures and frames", displayOrder: 4 },
        { id: "offset", name: "Offset Machine", description: "High volume printing - flyers, brochures", displayOrder: 5 },
        { id: "sublimation", name: "Sublimation", description: "Full print jerseys, apparel", displayOrder: 6 },
        { id: "dtf-shirt", name: "DTF Shirt", description: "Direct-to-Film printing on shirts", displayOrder: 7 },
    ]

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { id: dept.id },
            update: {
                name: dept.name,
                description: dept.description,
                displayOrder: dept.displayOrder
            },
            create: {
                id: dept.id,
                name: dept.name,
                description: dept.description,
                displayOrder: dept.displayOrder,
                isActive: true
            }
        })
    }

    // Also upsert the general categories if needed or legacy ones map to these?
    // The previous seed created "Design", "Print", "Apparel" - we leave them be if they exist, or they might be auto-uuids.

    console.log(`✅ Upserted ${departments.length} departments.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
