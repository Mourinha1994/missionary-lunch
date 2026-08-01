// src/pday/dto/create-transfer-week.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTransferWeekDto {
  @ApiProperty({
    example: '2026-08-10',
    description:
      'Primeiro dia da semana de transferência (a config passa a valer a partir daqui)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: 3,
    description:
      'Dia extra sem almoços durante a semana (0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb). O P-Day atual dessa semana é liberado e este dia é bloqueado.',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  newDayOfWeek: number;

  @ApiPropertyOptional({
    example: 'Semana de transferência — agosto 2026',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Irmã Coordenadora Silva' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
