import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';

export class CreateMissionaryDto {
  @ApiProperty({ example: 'Elder Silva' })
  @IsString()
  name: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Asa Norte' })
  @IsString()
  area: string;

  @ApiPropertyOptional({ example: '(51) 99999-99999' })
  @IsOptional()
  @IsString()
  phone?: string;
}
