import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser, Category } from '../types';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    createCategoryData: {
      name: string;
      description?: string;
    },
    @Request() req: RequestWithUser,
  ): Promise<Category> {
    // Use the user ID from the JWT token
    const userId = req.user.sub;

    return this.categoriesService.create({
      ...createCategoryData,
      userId,
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateCategoryData: {
      name?: string;
      description?: string;
    },
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Category> {
    try {
      return await this.categoriesService.remove(id);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error deleting the category';

      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}
