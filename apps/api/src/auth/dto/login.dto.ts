import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'coordenador@teste.com ' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'teste123' })
  @IsString()
  @MinLength(6)
  password: string;
}
