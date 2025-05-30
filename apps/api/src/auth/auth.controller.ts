import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from '../types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    registerData: {
      email: string;
      password: string;
      name: string;
      role?: 'ADMIN' | 'USER';
    },
  ) {
    return this.authService.register(registerData);
  }

  @Post('login')
  login(@Body() loginData: { email: string; password: string }) {
    return this.authService.login(loginData.email, loginData.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Post('validate-token')
  validateToken(@Body() data: { token: string }) {
    return this.authService.validateToken(data.token);
  }

  @Get('validate-token')
  validateTokenInfo() {
    return {
      message:
        'This endpoint requires a POST request with a token in the request body',
      method: 'POST',
      endpoint: '/api/auth/validate-token',
      body: {
        token: 'your-jwt-token-here',
      },
      example:
        'curl -X POST http://localhost:3001/api/auth/validate-token -H "Content-Type: application/json" -d \'{"token":"your-token"}\'',
    };
  }
}
