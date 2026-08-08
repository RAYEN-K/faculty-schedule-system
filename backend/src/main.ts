import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  // Enable Global Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Enable Global Error Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Flexible Faculty Work Schedule API')
    .setDescription(
      'API documentation for managing faculty schedules, requests, and events',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addSecurityRequirements('JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log('🚀 Server running on: http://localhost:3000');
  console.log('📚 Swagger Documentation: http://localhost:3000/api');
}
void bootstrap();
