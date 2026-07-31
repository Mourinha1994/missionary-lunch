import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMissionaryDto } from './dto/create-missionary.dto';
import { UpdateMissionaryDto } from './dto/update-missionary.dto';

@Injectable()
export class MissionariesService {
  constructor(private prisma: PrismaService) {}

  findAll(onlyActive = true) {
    return this.prisma.missionary.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const missionary = await this.prisma.missionary.findUnique({
      where: { id },
    });

    if (!missionary) throw new NotFoundException('Missionário não encontrado');

    return missionary;
  }

  create(dto: CreateMissionaryDto) {
    return this.prisma.missionary.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: string, dto: UpdateMissionaryDto) {
    await this.findOne(id);

    return this.prisma.missionary.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.missionary.update({
      where: { id },
      data: { active: false },
    });
  }
}
