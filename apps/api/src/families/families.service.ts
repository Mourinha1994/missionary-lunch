import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Injectable()
export class FamiliesService {
  constructor(private prisma: PrismaService) {}

  findAll(onlyActive = true) {
    return this.prisma.family.findMany({
      where: onlyActive ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const family = await this.prisma.family.findUnique({ where: { id } });

    if (!family) throw new NotFoundException('Família não encontrada');

    return family;
  }

  create(dto: CreateFamilyDto) {
    return this.prisma.family.create({ data: dto });
  }

  async update(id: string, dto: UpdateFamilyDto) {
    await this.findOne(id);
    return this.prisma.family.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.family.update({
      where: { id },
      data: { active: false },
    });
  }
}
