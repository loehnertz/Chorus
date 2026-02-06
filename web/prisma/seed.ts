import { Frequency, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alexId = '04ca594b-42e0-4f92-8cf4-74ba68e95e57'
  const samId = '3eefe3f4-26c6-4742-b2a4-ad7a5237f3d0'

  await prisma.choreCompletion.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.choreAssignment.deleteMany()
  await prisma.chore.deleteMany()
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [alexId, samId],
      },
    },
  })

  const [alex, sam] = await Promise.all([
    prisma.user.create({
      data: {
        id: alexId,
        name: 'Alex',
        approved: true,
      },
    }),
    prisma.user.create({
      data: {
        id: samId,
        name: 'Sam',
        approved: true,
      },
    }),
  ])

  const chores = await Promise.all([
    prisma.chore.create({
      data: {
        title: 'Daily dishes',
        description: 'Unload and reload the dishwasher',
        frequency: Frequency.DAILY,
      },
    }),
    prisma.chore.create({
      data: {
        title: 'Laundry cycle',
        description: 'Wash, dry, and fold one load',
        frequency: Frequency.WEEKLY,
      },
    }),
    prisma.chore.create({
      data: {
        title: 'Pantry audit',
        description: 'Rotate groceries and update list',
        frequency: Frequency.MONTHLY,
      },
    }),
    prisma.chore.create({
      data: {
        title: 'Deep clean oven',
        description: 'Full degrease and filter refresh',
        frequency: Frequency.YEARLY,
      },
    }),
  ])

  const [dailyDishes, laundry, pantryAudit] = chores

  await prisma.choreAssignment.createMany({
    data: [
      { userId: alex.id, choreId: dailyDishes.id },
      { userId: sam.id, choreId: laundry.id },
      { userId: alex.id, choreId: pantryAudit.id },
    ],
  })

  const nextFriday = new Date()
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7))
  nextFriday.setHours(18, 0, 0, 0)

  const schedule = await prisma.schedule.create({
    data: {
      choreId: laundry.id,
      slotType: Frequency.WEEKLY,
      scheduledFor: nextFriday,
      suggested: true,
    },
  })

  await prisma.choreCompletion.create({
    data: {
      choreId: dailyDishes.id,
      userId: alex.id,
      notes: 'Finished after dinner',
    },
  })

  await prisma.choreCompletion.create({
    data: {
      choreId: laundry.id,
      scheduleId: schedule.id,
      userId: sam.id,
      notes: 'Completed early this week',
    },
  })

  console.log('Seed complete:')
  console.log(`- users: ${2}`)
  console.log(`- chores: ${chores.length}`)
  console.log(`- assignments: ${3}`)
  console.log(`- schedules: ${1}`)
  console.log(`- completions: ${2}`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
