import { Module } from '@nestjs/common';
import { MissionariesService } from './missionaries.service';
import { MissionariesController } from './missionaries.controller';

@Module({
  controllers: [MissionariesController],
  providers: [MissionariesService],
  exports: [MissionariesService],
})
export class MissionariesModule {}
