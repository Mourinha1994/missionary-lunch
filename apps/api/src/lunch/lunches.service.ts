import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLunchDto } from './dto/create-lunch.dto';
import { LunchQueryDto } from './dto/lunch-query.dto';
import { UpdateLunchDto } from './dto/update-lunch.dto';
import { PdayService } from 'src/pday/pday.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LunchesService {
  constructor(
    private prisma: PrismaService,
    private pdayService: PdayService,
  ) {}

  private async assertNotPday(date: Date) {
    const { blocked, reason } = await this.pdayService.isPday(date);
    if (blocked) {
      throw new BadRequestException(
        `Não é possível agendar almoço nesta data: ${reason}`,
      );
    }
  }

  private async assertNoDuplicateDate(date: Date, excludeId?: string) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const existing = await this.prisma.lunch.findFirst({
      where: {
        date: { gte: start, lt: end },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new BadRequestException('Já existe um almoço agendado nesta data');
    }
  }

  private async assertFamilyAvailable(familyId: string) {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) throw new BadRequestException('Família não encontrada');
    if (!family.active) {
      throw new BadRequestException('A família selecionada está inativa');
    }
  }

  private async assertMissionariesAvailable(missionaryIds?: string[]) {
    if (!missionaryIds || missionaryIds.length === 0) return;

    const missionaries = await this.prisma.missionary.findMany({
      where: { id: { in: missionaryIds } },
    });

    const foundIds = new Set(missionaries.map((m) => m.id));
    const missing = missionaryIds.filter((id) => !foundIds.has(id));

    if (missing.length) {
      throw new BadRequestException(
        'Um ou mais missionários não foram encontrados',
      );
    }

    const inactive = missionaries.filter((m) => !m.active);
    if (inactive.length) {
      throw new BadRequestException(
        `O missionário "${inactive[0].name}" está inativo`,
      );
    }
  }

  async findAll(query: LunchQueryDto) {
    const where: Prisma.LunchWhereInput = {};

    if (query.startDate || query.endDate) {
      where.date = {};

      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const lunches = await this.prisma.lunch.findMany({
      where,
      include: { family: true },
      orderBy: { date: 'asc' },
    });

    const allMissionaryIds = [
      ...new Set(lunches.flatMap((l) => l.missionaryIds)),
    ];
    const missionaries = allMissionaryIds.length
      ? await this.prisma.missionary.findMany({
          where: { id: { in: allMissionaryIds } },
        })
      : [];

    const missionaryMap = Object.fromEntries(
      missionaries.map((m) => [m.id, m]),
    );

    return lunches.map((lunch) => ({
      ...lunch,
      missionaries: lunch.missionaryIds
        .map((id) => missionaryMap[id])
        .filter(Boolean),
    }));
  }

  async findOne(id: string) {
    const lunch = await this.prisma.lunch.findUnique({
      where: { id },
      include: { family: true },
    });

    if (!lunch) throw new NotFoundException('Almoço não encontrado');

    const missionaries = lunch.missionaryIds.length
      ? await this.prisma.missionary.findMany({
          where: { id: { in: lunch.missionaryIds } },
        })
      : [];

    return { ...lunch, missionaries };
  }

  async create(dto: CreateLunchDto) {
    const date = new Date(dto.date);
    await this.assertNotPday(date);
    await this.assertNoDuplicateDate(date);
    await this.assertFamilyAvailable(dto.familyId);
    await this.assertMissionariesAvailable(dto.missionaryIds);

    return this.prisma.lunch.create({
      data: {
        date,
        notes: dto.notes,
        familyId: dto.familyId,
        missionaryIds: dto.missionaryIds,
      },
      include: { family: true },
    });
  }

  async update(id: string, dto: UpdateLunchDto) {
    await this.findOne(id);

    if (dto.date) {
      const newDate = new Date(dto.date);
      await this.assertNotPday(newDate);
      await this.assertNoDuplicateDate(newDate, id);
    }

    if (dto.familyId) {
      await this.assertFamilyAvailable(dto.familyId);
    }

    if (dto.missionaryIds !== undefined) {
      await this.assertMissionariesAvailable(dto.missionaryIds);
    }

    return this.prisma.lunch.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { family: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lunch.delete({ where: { id } });
  }
}
