import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    private prisma: PrismaService,
    private exchangeRatesService: ExchangeRatesService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    targetCurrency?: string;
    userId?: string; // Current user ID
  }) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      startDate,
      endDate,
      targetCurrency = 'UYU',
      userId,
    } = params;
    const skip = (page - 1) * limit;

    // Build filter based on provided parameters
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        // Use the date as it comes from the controller
        where.date.gte = startDate;
        this.logger.debug(`Service - Start date: ${startDate.toISOString()}`);
      }

      if (endDate) {
        // Use the date as it comes from the controller
        where.date.lte = endDate;
        this.logger.debug(`Service - End date: ${endDate.toISOString()}`);
      }
    }

    // Get user and company
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
      });

      // If user belongs to a company, filter by company
      if (user?.companyId) {
        where.companyId = user.companyId;
      } else {
        // If no company, show only personal expenses
        where.userId = userId;
      }
    }

    // Get expenses with pagination and filters
    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip,
      take: limit,
    });

    // Count total expenses for pagination
    const total = await this.prisma.expense.count({ where });

    // Convert amounts to target currency
    const totalInTargetCurrency =
      await this.exchangeRatesService.convertAmounts(
        expenses.map((expense) => ({
          amount: expense.amount,
          currency: expense.currency || 'UYU',
        })),
        targetCurrency,
      );

    // Calculate converted amounts for each expense
    const expensesWithConvertedAmounts = await Promise.all(
      expenses.map(async (expense) => {
        const convertedAmount = await this.exchangeRatesService.convertAmount(
          expense.amount,
          expense.currency || 'UYU',
          targetCurrency,
        );
        return {
          ...expense,
          convertedAmount,
          originalAmount: expense.amount,
          originalCurrency: expense.currency,
        };
      }),
    );

    return {
      data: expensesWithConvertedAmounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalAmount: totalInTargetCurrency,
        targetCurrency,
      },
    };
  }

  async getTotal(params: {
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    targetCurrency?: string;
  }) {
    const { categoryId, startDate, endDate, targetCurrency = 'UYU' } = params;

    // Filter by date and category if provided
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      // Adjust end date to include the entire day (until 23:59:59.999)
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter.lte = endOfDay;
    }

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Get all expenses with applied filters
    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        category: true,
      },
    });

    // Convert all amounts to target currency and sum
    const totalInTargetCurrency =
      await this.exchangeRatesService.convertAmounts(
        expenses.map((expense) => ({
          amount: expense.amount,
          currency: expense.currency,
        })),
        targetCurrency,
      );

    // Calculate totals by category
    const categoriesMap = new Map();

    // Group expenses by category
    for (const expense of expenses) {
      const { categoryId, category } = expense;

      if (!categoriesMap.has(categoryId)) {
        categoriesMap.set(categoryId, {
          categoryId,
          categoryName: category.name,
          expenses: [],
        });
      }

      categoriesMap.get(categoryId).expenses.push(expense);
    }

    // Calculate totals by category
    const byCategory = await Promise.all(
      Array.from(categoriesMap.values()).map(async (item) => {
        const categoryTotal = await this.exchangeRatesService.convertAmounts(
          item.expenses.map((expense) => ({
            amount: expense.amount,
            currency: expense.currency,
          })),
          targetCurrency,
        );

        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          total: categoryTotal,
        };
      }),
    );

    return {
      total: totalInTargetCurrency,
      byCategory,
      targetCurrency,
    };
  }

  async findOne(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: {
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
    userId: string;
    companyId?: string;
  }) {
    return this.prisma.expense.create({
      data,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      amount?: number;
      description?: string;
      date?: Date;
      categoryId?: string;
    },
  ) {
    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  // Method to get user information
  async getUserInfo(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
