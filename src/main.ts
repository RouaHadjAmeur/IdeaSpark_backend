import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for mobile app
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Mobile App Backend API')
    .setDescription(
      `
# Mobile App Backend with Authentication

This API provides comprehensive authentication functionality for mobile applications with:

## 🔐 Authentication Features
- **Email/Password Registration & Login** with bcrypt password hashing
- **JWT Token-based Authentication** for secure API access
- **Auth0 Integration** for OAuth and social login (when configured)
- **Protected Routes** requiring valid JWT tokens

## 🗄️ Database
- **PostgreSQL** database with TypeORM
- Automatic schema synchronization (development mode)
- Secure password storage with bcrypt hashing

## 📱 Usage
1. **Register** a new account using \`POST /auth/register\`
2. **Login** to get your JWT access token using \`POST /auth/login\`
3. **Authorize**: Click the "Authorize" button and enter your token as \`Bearer YOUR_TOKEN\`
4. **Access Protected Routes** like \`GET /auth/profile\`

## 🔑 Authorization
Use the "Authorize" button (🔓) to add your JWT token for testing protected endpoints.
      `.trim(),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token (it will be prefixed with "Bearer " automatically)',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'User registration, login, and profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Mobile App API Documentation',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api\n`);
}
bootstrap();
