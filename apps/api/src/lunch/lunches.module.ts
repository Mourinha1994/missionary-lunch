import { Module } from '@nestjs/common';
import { LunchesService } from './lunches.service';
import { LunchesController } from './lunches.controller';
import { PdayModule } from 'src/pday/pday.module';

@Module({
  imports: [PdayModule],
  controllers: [LunchesController],
  providers: [LunchesService],
})
export class LunchesModule {}
