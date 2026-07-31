import { PartialType } from '@nestjs/swagger';
import { CreateMissionaryDto } from './create-missionary.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMissionaryDto extends PartialType(CreateMissionaryDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
