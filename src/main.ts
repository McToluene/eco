import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DatabaseConfig } from './config/database.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Optimize logging
  });

  // Enable CORS with specific configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Enable global validation with transform
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Create database indexes
  const dbConfig = app.get(DatabaseConfig);
  await dbConfig.createIndexes();

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);

  // Set reasonable timeout (30 minutes instead of 30 minutes)
  server.setTimeout(30 * 60 * 1000); // 30 minutes

  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
});
