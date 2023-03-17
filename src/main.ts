import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const secure: SecuritySchemeObject = {
    type: 'http',
    description: 'JWT Authorization header using the Bearer scheme. ',
  };
  const config = new DocumentBuilder()
    .setTitle('Eco app')
    .setDescription('Eco app API description')
    .setVersion('1.0')
    .addBearerAuth(secure)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
