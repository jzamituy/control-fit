import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS to allow requests from the frontend
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Add a global prefix for API routes
  app.setGlobalPrefix('api');

  // Use port 3001 to avoid conflict with Next.js which uses 3000
  await app.listen(3001);

  console.log(`The application is running at: ${await app.getUrl()}`);
}
bootstrap();
