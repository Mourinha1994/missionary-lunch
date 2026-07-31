import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePdayConfigDto } from './dto/create-pday-config.dto';
import { CreatePdayExceptionDto } from './dto/create-pday-exception.dto';

export const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

@Injectable()
export class PdayService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.pdayConfig.findMany({
      orderBy: { startDate: 'desc' },
    });
  }

  findAllExceptions() {
    return this.prisma.pdayException.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async getActiveConfig(date: Date) {
    const config = await this.prisma.pdayConfig.findFirst({
      where: { startDate: { lte: date } },
      orderBy: { startDate: 'desc' },
    });

    return config ?? { dayOfWeek: 1, reason: 'Padrão do sistema' };
  }

  async getCurrentConfig() {
    const config = await this.getActiveConfig(new Date());
    return { ...config, dayName: DAY_NAMES[config.dayOfWeek] };
  }

  async create(dto: CreatePdayConfigDto) {
    const startDate = new Date(dto.startDate);

    const exstingConfigs = await this.prisma.pdayConfig.count();

    if (exstingConfigs > 0 && startDate < new Date()) {
      throw new BadRequestException(
        'Não é possível criar uma configuração com data no passado',
      );
    }

    const config = await this.prisma.pdayConfig.create({
      data: { ...dto, startDate },
    });

    return { ...config, dayName: DAY_NAMES[config.dayOfWeek] };
  }

  async createException(dto: CreatePdayExceptionDto) {
    const date = new Date(dto.date);

    date.setUTCHours(0, 0, 0, 0);

    const today = new Date();

    today.setUTCHours(0, 0, 0, 0);

    if (date < today) {
      throw new BadRequestException(
        'Não é possível criar uma exceção para uma data no passado',
      );
    }

    const exsiting = await this.prisma.pdayException.findFirst({
      where: { date },
    });

    if (exsiting) {
      return this.prisma.pdayException.update({
        where: { id: exsiting.id },
        data: { ...dto, date },
      });
    }

    return this.prisma.pdayException.create({
      data: { ...dto, date },
    });
  }

  async deleteException(id: string) {
    return this.prisma.pdayException.delete({ where: { id } });
  }

  async isPday(date: Date): Promise<{ blocked: boolean; reason: string }> {
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);

    const exception = await this.prisma.pdayException.findFirst({
      where: { date: normalized },
    });

    if (exception) {
      return {
        blocked: exception.blocked,
        reason:
          exception.reason ??
          (exception.blocked ? 'Bloqueio manual' : 'Liberação manual'),
      };
    }

    const config = await this.getActiveConfig(normalized);
    const blocked = normalized.getUTCDay() === config.dayOfWeek;

    return {
      blocked,
      reason: blocked ? `P-Day (${DAY_NAMES[config.dayOfWeek]})` : '',
    };
  }

  async getBlockedDates(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ date: string; reason: string; isException: boolean }>> {
    const [configs, exceptions] = await Promise.all([
      this.prisma.pdayConfig.findMany({ orderBy: { startDate: 'asc' } }),
      this.prisma.pdayException.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const exceptionMap = new Map(
      exceptions.map((e) => [e.date.toISOString().split('T')[0], e]),
    );

    const blocked: Array<{
      date: string;
      reason: string;
      isException: boolean;
    }> = [];
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const exception = exceptionMap.get(dateKey);

      if (exception) {
        if (exception.blocked) {
          blocked.push({
            date: dateKey,
            reason: exception.reason ?? 'Bloqueio manual',
            isException: true,
          });
        }
      } else {
        const activeConfig = configs
          .filter((c) => c.startDate <= current)
          .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0] ?? {
          dayOfWeek: 1,
        };

        if (current.getUTCDay() === activeConfig.dayOfWeek) {
          blocked.push({
            date: dateKey,
            reason: `P-Day (${DAY_NAMES[activeConfig.dayOfWeek]})`,
            isException: false,
          });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return blocked;
  }
}
