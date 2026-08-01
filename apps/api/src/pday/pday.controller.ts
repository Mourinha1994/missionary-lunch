// src/pday/pday.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';
import { PdayService } from './pday.service';
import { CreatePdayConfigDto } from './dto/create-pday-config.dto';
import { CreatePdayExceptionDto } from './dto/create-pday-exception.dto';
import { CreateTransferWeekDto } from './dto/create-transfer-week.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pday')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pday')
export class PdayController {
  constructor(private readonly pdayService: PdayService) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de configurações de P-Day' })
  findAll() {
    return this.pdayService.findAll();
  }

  @Get('current')
  @ApiOperation({ summary: 'Configuração vigente hoje' })
  getCurrent() {
    return this.pdayService.getCurrentConfig();
  }

  @Get('blocked-dates')
  @ApiOperation({
    summary: 'Datas bloqueadas num intervalo (para o calendário)',
  })
  @ApiQuery({ name: 'startDate', example: '2025-06-01' })
  @ApiQuery({ name: 'endDate', example: '2025-06-30' })
  getBlockedDates(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.pdayService.getBlockedDates(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('config')
  @ApiOperation({
    summary: 'Cria nova configuração recorrente (ex: transferência)',
  })
  createConfig(@Body() dto: CreatePdayConfigDto) {
    return this.pdayService.create(dto);
  }

  @Post('transfer-week')
  @ApiOperation({
    summary:
      'Prepara a semana de transferência: libera o P-Day vigente e bloqueia o novo dia naquela semana (transação)',
  })
  createTransferWeek(@Body() dto: CreateTransferWeekDto) {
    return this.pdayService.createTransferWeek(dto);
  }

  @Get('exceptions')
  @ApiOperation({ summary: 'Lista todas as exceções pontuais' })
  findAllExceptions() {
    return this.pdayService.findAllExceptions();
  }

  @Post('exceptions')
  @ApiOperation({
    summary: 'Cria exceção pontual (liberar ou bloquear data específica)',
  })
  createException(@Body() dto: CreatePdayExceptionDto) {
    return this.pdayService.createException(dto);
  }

  @Delete('exceptions/:id')
  @ApiOperation({ summary: 'Remove uma exceção pontual' })
  deleteException(@Param('id') id: string) {
    return this.pdayService.deleteException(id);
  }
}
