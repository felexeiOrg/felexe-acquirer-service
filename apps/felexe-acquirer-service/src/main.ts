import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('v2/api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('GATEWAY_HOST', 'localhost');
  if (host === 'GATEWAY_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('GATEWAY_PORT', 3000);

  await app.listen(port, host);
  console.log(`🚀 Felexe Acquirer Gateway is running on ${host}:${port}`);
}
bootstrap();
