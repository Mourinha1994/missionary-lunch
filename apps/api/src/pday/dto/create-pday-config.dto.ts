import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreatePdayConfigDto {
  @ApiProperty({
    example: 1,
    description:
      '0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado',
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: '2025-06-09',
    description: 'Data a partir da qual esta configração passa a valer',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: 'Transferência Jun/2025 - P-Day passa para quarta-feira',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Irmã Coordenadora Silva' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
