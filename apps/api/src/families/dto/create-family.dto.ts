import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateFamilyDto {
  @ApiProperty({ example: 'Família Santos ' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Irmão João Santos ' })
  @IsString()
  contact: string;

  @ApiProperty({ example: '(51) 99999-9999' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'familia@email.com ' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123 - Asa Norte' })
  @IsOptional()
  @IsString()
  address?: string;
}
