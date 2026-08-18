import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/validation-exception.filter';
import { createValidationPipe } from './common/validation/create-validation-pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('v2/api');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  let host = configService.get<string>('GATEWAY_HOST', 'localhost');
  if (host === 'GATEWAY_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('GATEWAY_PORT', 3000);

  await app.listen(port, host);
  console.log(`🚀 Felexe Acquirer Gateway is running on ${host}:${port}`);
}
bootstrap();
