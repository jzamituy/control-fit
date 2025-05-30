import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting to populate the database...');

    // Create the gym company
    const gym = await prisma.company.create({
      data: {
        name: 'Gimnasio Control Fit',
        description: 'Main gym for expense control',
        address: 'Main Street 123',
      },
    });

    console.log(`Company created: ${gym.name} (${gym.id})`);

    // Find all existing users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} existing users.`);

    // Assign all users to the gym company
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: gym.id },
      });
      console.log(`User ${user.name} assigned to ${gym.name}`);
    }

    // Assign existing categories to the company
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} existing categories.`);

    for (const category of categories) {
      await prisma.category.update({
        where: { id: category.id },
        data: { companyId: gym.id },
      });
      console.log(`Category ${category.name} assigned to ${gym.name}`);
    }

    // Assign existing expenses to the company
    const expenses = await prisma.expense.findMany();
    console.log(`Found ${expenses.length} existing expenses.`);

    for (const expense of expenses) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: { companyId: gym.id },
      });
      console.log(`Expense ID ${expense.id} assigned to ${gym.name}`);
    }

    console.log('Database populated successfully!');
  } catch (error) {
    console.error('Error populating the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Seed for exchange rates
const seedExchangeRates = async (prisma: PrismaClient) => {
  console.log('Seeding exchange rates...');

  const today = new Date();

  // Create current exchange rates (example with fixed values)
  const exchangeRates = [
    // USD to other currencies
    { fromCurrency: 'USD', toCurrency: 'UYU', rate: 42.5, date: today },
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.93, date: today },
    { fromCurrency: 'USD', toCurrency: 'ARS', rate: 870, date: today },
    { fromCurrency: 'USD', toCurrency: 'CLP', rate: 920, date: today },
    { fromCurrency: 'USD', toCurrency: 'MXN', rate: 17.5, date: today },
    { fromCurrency: 'USD', toCurrency: 'COP', rate: 4000, date: today },

    // EUR to other currencies
    { fromCurrency: 'EUR', toCurrency: 'UYU', rate: 45.7, date: today },
  ];

  // Clear existing exchange rates (optional)
  await prisma.exchangeRate.deleteMany({});

  // Insert new rates
  for (const rate of exchangeRates) {
    await prisma.exchangeRate.create({
      data: rate,
    });
  }

  console.log(`Seeded ${exchangeRates.length} exchange rates`);
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
