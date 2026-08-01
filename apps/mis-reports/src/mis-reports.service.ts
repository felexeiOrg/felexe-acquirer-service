import { Injectable } from '@nestjs/common';

@Injectable()
export class MisReportsService {
  getHello(): string {
    return 'Hello World!';
  }
}
