import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to create a test expense with valid data...');

    // Use valid IDs from our database
    const userId = '488417b2-4cda-446e-aa82-76d5d49def0a';
    const categoryId = '0ddcecfa-685f-46ef-be38-55a183d27101';

    const newExpense = await prisma.expense.create({
      data: {
        amount: 100.0,
        description: 'Test expense',
        date: new Date(),
        categoryId: categoryId,
        userId: userId,
      },
    });

    console.log('Expense created successfully:', newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
