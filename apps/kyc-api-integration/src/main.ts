import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { createValidationPipe } from './common/validation/create-validation-pipe';
import { KycApiIntegrationModule } from './kyc-api-integration.module';

async function bootstrap() {
  const app = await NestFactory.create(KycApiIntegrationModule);
  const configService = app.get(ConfigService);

  let host = configService.get<string>('KYC_API_INTEGRATION_HOST', 'localhost');
  if (host === 'KYC_API_INTEGRATION_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('KYC_API_INTEGRATION_PORT', 3006);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      KycApiIntegrationModule,
      {
        transport: Transport.TCP,
        options: {
          port,
          host,
        },
      },
    );

  microservice.useGlobalPipes(createValidationPipe());

  await microservice.listen();
  console.log(
    `🚀 KYC API Integration microservice is running on ${host}:${port}`,
  );
}
bootstrap();
