import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MisReportsModule } from './mis-reports.module';

async function bootstrap() {
  const app = await NestFactory.create(MisReportsModule);
  const configService = app.get(ConfigService);

  // Get host value, but if it's the placeholder string, use default
  let host = configService.get<string>('MIS_REPORTS_HOST', 'localhost');
  if (host === 'MIS_REPORTS_HOST' || !host) {
    host = 'localhost';
  }

  const port = configService.get<number>('MIS_REPORTS_PORT', 3005);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      MisReportsModule,
      {
        transport: Transport.TCP,
        options: {
          port,
          host,
        },
      },
    );

  await microservice.listen();
  console.log(`🚀 MIS Reports microservice is running on ${host}:${port}`);
}
bootstrap();
