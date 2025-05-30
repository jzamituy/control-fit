import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '../types';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });
    return categories;
  }

  async findOne(id: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });
    return category;
  }

  async create(data: {
    name: string;
    description?: string;
    userId: string;
  }): Promise<Category> {
    const category = await this.prisma.category.create({
      data,
    });
    return category;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<Category> {
    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data,
    });
    return updatedCategory;
  }

  async remove(id: string): Promise<Category> {
    // Check that the category doesn't have associated expenses
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (category && category._count && category._count.expenses > 0) {
      throw new Error('Cannot delete a category with associated expenses');
    }

    const deletedCategory = await this.prisma.category.delete({
      where: { id },
    });
    return deletedCategory;
  }
}
