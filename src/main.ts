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
    .setTitle('IdeaSpark API')
    .setDescription(
      `
# IdeaSpark - AI-Powered Video Content Generator

This API provides comprehensive functionality for video content generation with AI.

## 🎥 Features
- **AI-Powered Video Script Generation** using Gemini 1.5 Flash
- **Multimodal Support** (Vision analysis of product images)
- **AI-Suggested Locations** and location-specific hooks
- **Personalized Content** based on user persona and preferences
- **Multi-language Support** (French, English, Arabic)
- **Multi-platform Optimization** (TikTok, Instagram, YouTube)
- **User Authentication** with JWT and social login (Google, Facebook)
- **Persona Management** for tailored content generation

## 🔐 Authentication Features
- Email/Password Registration & Login
- Google OAuth Integration
- Facebook OAuth Integration
- JWT Token-based Authentication
- Email Verification
- Password Reset
- Account Management

## 🗄️ Database
- **MongoDB** with Mongoose ODM
- User profiles and authentication
- Persona data storage
- Generated video ideas archive

## 📱 Getting Started
1. **Register** using \`POST /auth/register\`
2. **Verify Email** using \`POST /auth/verify-email\`
3. **Login** to get JWT token using \`POST /auth/login\`
4. **Complete Persona Onboarding** using \`POST /persona\`
5. **Generate Video Ideas** using \`POST /video-generator/generate\`

## 🔑 Authorization
Click the "Authorize" button (🔓) and enter your JWT token to test protected endpoints.
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
    .addTag('Authentication', '🔐 User registration, login, and profile management')
    .addTag('Users', '👤 User profile management')
    .addTag('Persona', '🎭 User persona and onboarding')
    .addTag('Video Generator', '🎥 AI-powered video content generation')
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

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api\n`);
}
bootstrap();
