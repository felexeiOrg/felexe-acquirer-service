import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MerchantOnboardingModule } from './merchant-onboarding.module';

async function bootstrap() {
  const app = await NestFactory.create(MerchantOnboardingModule);
  const configService = app.get(ConfigService);

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('MERCHANT_ONBOARDING_HOST', 'localhost');
  if (host === 'MERCHANT_ONBOARDING_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('MERCHANT_ONBOARDING_PORT', 3001);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      MerchantOnboardingModule,
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
    `🚀 Merchant Onboarding microservice is running on ${host}:${port}`,
  );
}
bootstrap();
