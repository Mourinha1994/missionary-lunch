import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private prisma: PrismaService) {}

  // MongoDB Atlas M0 pausa clusters após 60 dias sem atividade.
  // Um ping por dia já é suficiente; a cada 12h mantém margem de segurança.
  @Cron(CronExpression.EVERY_12_HOURS)
  async pingDatabase() {
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      this.logger.log('Keep-alive: MongoDB respondeu ao ping');
    } catch (error) {
      this.logger.error('Keep-alive: falha ao pingar o MongoDB', error);
    }
  }
}
