import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminWebhookKey = process.env.ADMIN_WEBHOOK_KEY;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is not set in .env file');
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      webhookKey: adminWebhookKey,
      createdAt: BigInt(Date.now()),
      isAdmin: true,
      canManageTemplates: true,
      cardLinkTags: JSON.stringify(['向日葵', '3天']),
      showFooter: true,
      showAds: true,
    },
  });

  console.log('Admin user created successfully');

  await prisma.user.upsert({
    where: { username: 'aaa' },
    update: {},
    create: {
      username: 'aaa',
      password: 'aaa',
      webhookKey: 'aaa',
      createdAt: BigInt(Date.now()),
      isAdmin: false,
      canManageTemplates: true,
      cardLinkTags: JSON.stringify(['爱奇艺', '10天']),
      showFooter: true,
      showAds: true,
    },
  });

  console.log('Regular user "aaa" created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
