import { Injectable } from '@nestjs/common';

@Injectable()
export class ReconMngService {
  getHello(): string {
    return 'Hello World!';
  }
}
