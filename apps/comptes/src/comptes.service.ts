import { Injectable } from '@nestjs/common';

@Injectable()
export class ComptesService {
  getHello(): string {
    return 'Hello World!';
  }
}
