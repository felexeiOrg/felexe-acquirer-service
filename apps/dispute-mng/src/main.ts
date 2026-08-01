import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DisputeMngModule } from './dispute-mng.module';

async function bootstrap() {
  const app = await NestFactory.create(DisputeMngModule);
  const configService = app.get(ConfigService);

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('DISPUTE_MNG_HOST', 'localhost');
  if (host === 'DISPUTE_MNG_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('DISPUTE_MNG_PORT', 3003);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      DisputeMngModule,
      {
        transport: Transport.TCP,
        options: {
          port,
          host,
        },
      },
    );

  await microservice.listen();
  console.log(`🚀 Dispute Management microservice is running on ${host}:${port}`);
}
bootstrap();
