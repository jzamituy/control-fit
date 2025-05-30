import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  private readonly logger = new Logger(ExpensesController.name);

  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('categoryId') categoryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('targetCurrency') targetCurrency: string,
    @Request() req: any,
  ) {
    // Extract user ID from JWT token
    const userId = req.user.sub;

    // Process dates
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      // Make sure start date is at the beginning of the day
      parsedStartDate.setHours(0, 0, 0, 0);
      this.logger.debug(`Start date: ${parsedStartDate.toISOString()}`);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      // Make sure end date is at the end of the day
      parsedEndDate.setHours(23, 59, 59, 999);
      this.logger.debug(`End date: ${parsedEndDate.toISOString()}`);
    }

    return this.expensesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      categoryId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      targetCurrency,
      userId,
    });
  }

  @Get('total')
  getTotal(
    @Query('categoryId') categoryId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('targetCurrency') targetCurrency: string,
  ) {
    // Process dates
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      // Make sure start date is at the beginning of the day
      parsedStartDate.setHours(0, 0, 0, 0);
      this.logger.debug(`Total - Start date: ${parsedStartDate.toISOString()}`);
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      // Make sure end date is at the end of the day
      parsedEndDate.setHours(23, 59, 59, 999);
      this.logger.debug(`Total - End date: ${parsedEndDate.toISOString()}`);
    }

    return this.expensesService.getTotal({
      categoryId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      targetCurrency,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  async create(
    @Body()
    createExpenseData: {
      amount: number;
      description: string;
      date: Date;
      categoryId: string;
      currency?: string;
    },
    @Request() req: any,
  ) {
    // Use user ID from JWT token
    const userId = req.user.sub;

    // Get user information including company
    const user = await this.expensesService.getUserInfo(userId);

    return this.expensesService.create({
      ...createExpenseData,
      userId,
      companyId: user?.companyId || undefined, // Convert null to undefined
    });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateExpenseData: {
      amount?: number;
      description?: string;
      date?: Date;
      categoryId?: string;
      currency?: string;
    },
  ) {
    return this.expensesService.update(id, updateExpenseData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
