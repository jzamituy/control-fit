import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';

@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  @Get('latest')
  getLatestRate(
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    return this.exchangeRatesService.getLatestRate(fromCurrency, toCurrency);
  }

  @Post()
  upsertRate(
    @Body()
    data: {
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      date: string;
    },
  ) {
    return this.exchangeRatesService.upsertRate({
      ...data,
      date: new Date(data.date),
    });
  }

  @Get('convert')
  async convertAmount(
    @Query('amount') amount: string,
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    const convertedAmount = await this.exchangeRatesService.convertAmount(
      parseFloat(amount),
      fromCurrency,
      toCurrency,
    );

    return {
      originalAmount: parseFloat(amount),
      originalCurrency: fromCurrency,
      convertedAmount,
      targetCurrency: toCurrency,
    };
  }
}
