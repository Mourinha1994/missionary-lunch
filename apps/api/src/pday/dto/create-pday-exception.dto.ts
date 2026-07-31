// src/pday/dto/create-pday-exception.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePdayExceptionDto {
  @ApiProperty({
    example: '2025-06-09',
    description: 'Data exata da exceção',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: false,
    description: 'false = liberar o dia | true = bloquear um dia extra',
  })
  @IsBoolean()
  blocked: boolean;

  @ApiPropertyOptional({
    example: 'Semana de transferência — segunda-feira liberada para almoço',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Irmã Coordenadora Silva' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
