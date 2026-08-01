import { Injectable } from '@nestjs/common';

@Injectable()
export class DisputeMngService {
  getHello(): string {
    return 'Hello World!';
  }
}
