import { Module } from '@nestjs/common';
import { PdayService } from './pday.service';
import { PdayController } from './pday.controller';

@Module({
  controllers: [PdayController],
  providers: [PdayService],
  exports: [PdayService],
})
export class PdayModule {}
