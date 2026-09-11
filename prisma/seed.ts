import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Akun Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password123', // Dalam produksi, gunakan hashing (misal: bcrypt)
      role: 'ADMIN',
    },
  })

  // Akun Operator Divisi
  const divisions = ['ROV', 'ASV', 'ERC', 'FERC', 'IDK', 'ISPK'] as const
  
  for (const division of divisions) {
    await prisma.user.upsert({
      where: { username: `operator_${division}` },
      update: {},
      create: {
        username: `operator_${division}`,
        password: `password123`, 
        role: 'OPERATOR',
        division: division,
      },
    })
  }

  console.log('✅ Database telah di-seed dengan akun admin dan operator.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
