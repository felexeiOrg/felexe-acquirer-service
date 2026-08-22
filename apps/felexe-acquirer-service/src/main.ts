import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/validation-exception.filter';
import { createValidationPipe } from './common/validation/create-validation-pipe';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.set('etag', false);
  app.setGlobalPrefix('v2/api');
  app.use(cookieParser());
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigin = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:5173',
  );

  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const uploadDir = configService.get<string>(
    'UPLOAD_DIR',
    join(process.cwd(), 'upload'),
  );
  app.useStaticAssets(uploadDir, {
    prefix: '/v2/api/uploads',
  });

  let host = configService.get<string>('GATEWAY_HOST', 'localhost');
  if (host === 'GATEWAY_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('GATEWAY_PORT', 3000);

  await app.listen(port, host);
  console.log(`🚀 Felexe Acquirer Gateway is running on ${host}:${port}`);
}
bootstrap();
