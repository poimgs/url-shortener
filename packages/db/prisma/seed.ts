import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create some test URLs
  const urls = await Promise.all([
    prisma.url.upsert({
      where: { shortCode: 'github' },
      update: {},
      create: {
        shortCode: 'github',
        originalUrl: 'https://github.com',
        title: 'GitHub',
        description: 'Where the world builds software',
        userId: user.id,
        clickCount: 42,
      },
    }),
    prisma.url.upsert({
      where: { shortCode: 'google' },
      update: {},
      create: {
        shortCode: 'google',
        originalUrl: 'https://google.com',
        title: 'Google',
        description: 'Search the world',
        clickCount: 123,
      },
    }),
  ])

  console.log('✅ Database seeded successfully')
  console.log(`Created user: ${user.email}`)
  console.log(`Created ${urls.length} URLs`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
