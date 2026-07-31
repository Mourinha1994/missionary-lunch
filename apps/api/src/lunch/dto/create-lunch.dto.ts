import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';

export class CreateLunchDto {
  @ApiProperty({ example: '2025-04-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'family-id' })
  @IsString()
  familyId: string;

  @ApiProperty({ example: ['missionary-id-1', 'missionary-id-2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  missionaryIds: string[];

  @ApiPropertyOptional({ example: 'PreferÊncia: sem gluten' })
  @IsOptional()
  @IsString()
  notes?: string;
}
