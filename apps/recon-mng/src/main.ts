import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReconMngModule } from './recon-mng.module';

async function bootstrap() {
  const app = await NestFactory.create(ReconMngModule);
  const configService = app.get(ConfigService);

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('RECON_MNG_HOST', 'localhost');
  if (host === 'RECON_MNG_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('RECON_MNG_PORT', 3004);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      ReconMngModule,
      {
        transport: Transport.TCP,
        options: {
          port,
          host,
        },
      },
    );

  await microservice.listen();
  console.log(`🚀 Recon Management microservice is running on ${host}:${port}`);
}
bootstrap();
