import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const categories = await prisma.category.findMany();
    console.log('Available categories:');
    categories.forEach((category) => {
      console.log(`ID: ${category.id}, Name: ${category.name}`);
    });
  } catch (error) {
    console.error('Error querying categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
