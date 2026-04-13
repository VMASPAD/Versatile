import { Module } from '@nestjs/common';
import { BioService } from './bio.service';
import { BioController, ApiBioController } from './bio.controller';

@Module({
  controllers: [BioController, ApiBioController],
  providers: [BioService],
})
export class BioModule {}
