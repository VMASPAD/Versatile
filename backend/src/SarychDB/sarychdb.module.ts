import { Module, Global } from '@nestjs/common';
import { SarychDBService } from './index';

@Global()
@Module({
  providers: [SarychDBService],
  exports: [SarychDBService],
})
export class SarychDBModule {}
