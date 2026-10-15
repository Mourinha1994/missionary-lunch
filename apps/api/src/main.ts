import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [/^http:\/\/localhost:\d+$/];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Missionary Lunch API')
    .setDescription('API para gerenciamento de almoço dos missionários')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;

  // '0.0.0.0' deixa a API acessível na rede local (testes em outros aparelhos)
  await app.listen(port, '0.0.0.0');

  const lanIp = Object.values(networkInterfaces())
    .flatMap((list) => list ?? [])
    .find((iface) => iface.family === 'IPv4' && !iface.internal)?.address;

  console.log(`🚀 API rodando em http://localhost:${port}/api`);
  console.log(`📡 Rede local: http://${lanIp ?? '0.0.0.0'}:${port}/api`);
  console.log(`📚 Swagger em http://localhost:${port}/api/docs`);
}

void bootstrap();
