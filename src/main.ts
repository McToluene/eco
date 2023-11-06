import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const server = await app.listen(process.env.PORT || 3000);
  server.setTimeout(1800000000);
}
bootstrap();
