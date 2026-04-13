import { Module } from '@nestjs/common';
import { FlyService } from './fly.service';
import { FlyController, ApiFlyController } from './fly.controller';

@Module({
  controllers: [FlyController, ApiFlyController],
  providers: [FlyService],
})
export class FlyModule {}
