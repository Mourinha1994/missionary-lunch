import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LunchesService } from './lunches.service';
import { UpdateLunchDto } from './dto/update-lunch.dto';
import { LunchQueryDto } from './dto/lunch-query.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateLunchDto } from './dto/create-lunch.dto';

@ApiTags('lunches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lunches')
export class LunchesController {
  constructor(private readonly service: LunchesService) {}

  @Get()
  findAll(@Query() query: LunchQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLunchDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLunchDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
