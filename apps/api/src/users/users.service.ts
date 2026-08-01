import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) throw new ConflictException('E-mail já cadastrado!');

    const hashed = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: dto.role ?? 'COORDINATOR',
      },
      select: USER_SAFE_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string) {
    await this.findOne(id);

    if (dto.active === false && id === currentUserId) {
      throw new BadRequestException('Você não pode desativar a própria conta');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;

    if (dto.email !== undefined) {
      const exists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (exists && exists.id !== id) {
        throw new ConflictException('E-mail já cadastrado!');
      }

      data.email = dto.email;
    }

    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role !== undefined) data.role = dto.role;

    if (dto.active !== undefined) data.active = dto.active;

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SAFE_SELECT,
    });
  }

  async remove(id: string, currentUserId?: string) {
    await this.findOne(id);

    if (id === currentUserId) {
      throw new BadRequestException('Você não pode desativar a própria conta');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: USER_SAFE_SELECT,
    });
  }
}
