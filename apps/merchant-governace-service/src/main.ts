import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MerchantGovernaceServiceModule } from './merchant-governace-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MerchantGovernaceServiceModule);
  const configService = app.get(ConfigService);

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('MERCHANT_GOVERNACE_HOST', 'localhost');
  if (host === 'MERCHANT_GOVERNACE_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('MERCHANT_GOVERNACE_PORT', 3002);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      MerchantGovernaceServiceModule,
      {
        transport: Transport.TCP,
        options: {
          port,
          host,
        },
      },
    );

  await microservice.listen();
  console.log(
    `🚀 Merchant Governance microservice is running on ${host}:${port}`,
  );
}
bootstrap();
