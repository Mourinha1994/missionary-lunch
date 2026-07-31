import { Gender, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type SeedMissionary = {
  name: string;
  gender: Gender;
  startDate: string;
  endDate: string;
  area: string;
  active?: boolean;
};

const ADMIN = {
  name: 'Administrador',
  email: 'admin@missionarylunch.com',
  password: '6UETYr1xpb7P',
  role: Role.ADMIN,
};

const COORDINATOR = {
  name: 'Maria Coordenadora',
  email: 'coord.demo@igreja.com',
  password: 'Demo@2026',
  role: Role.COORDINATOR,
};

const FAMILIES = [
  { name: 'Família Santos', contact: 'Irmã Marta Santos', phone: '(61) 99811-0001' },
  { name: 'Família Oliveira', contact: 'Irmão Paulo Oliveira', phone: '(61) 99811-0002' },
  { name: 'Família Ribeiro', contact: 'Irmã Carla Ribeiro', phone: '(61) 99811-0003' },
  { name: 'Família Almeida', contact: 'Irmão José Almeida', phone: '(61) 99811-0004' },
  { name: 'Família Costa', contact: 'Irmã Fernanda Costa', phone: '(61) 99811-0005' },
  { name: 'Família Dias', contact: 'Irmão Lucas Dias', phone: '(61) 99811-0006', active: false },
];

const MISSIONARIES: SeedMissionary[] = [
  { name: 'Elder Thiago Nunes', gender: Gender.MALE, startDate: '2024-02-01', endDate: '2027-02-01', area: 'Asa Norte' },
  { name: 'Elder Rafael Souza', gender: Gender.MALE, startDate: '2024-09-01', endDate: '2027-03-01', area: 'Asa Sul' },
  { name: 'Sister Ana Beatriz', gender: Gender.FEMALE, startDate: '2025-01-15', endDate: '2027-07-15', area: 'Asa Norte' },
  { name: 'Elder Lucas Pereira', gender: Gender.MALE, startDate: '2025-03-01', endDate: '2027-09-01', area: 'Lago Sul' },
  { name: 'Sister Júlia Martins', gender: Gender.FEMALE, startDate: '2025-06-01', endDate: '2027-12-01', area: 'Guará' },
  { name: 'Elder Gabriel Ramos', gender: Gender.MALE, startDate: '2023-08-01', endDate: '2025-08-01', area: 'Taguatinga', active: false },
];

const LUNCH_COUNT = 6;

function nextWeekdays(count: number): Date[] {
  const dates: Date[] = [];
  const current = new Date();
  current.setUTCHours(0, 0, 0, 0);
  current.setUTCDate(current.getUTCDate() + 1);

  while (dates.length < count) {
    if (current.getUTCDay() !== 1) {
      dates.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

async function seedUsers() {
  for (const data of [ADMIN, COORDINATOR]) {
    const password = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name, role: data.role, active: true },
      create: { ...data, password },
    });

    console.log(`Usuário garantido: ${user.email} (${user.role})`);
  }
}

async function seedFamilies(): Promise<string[]> {
  const ids: string[] = [];

  for (const data of FAMILIES) {
    const existing = await prisma.family.findFirst({
      where: { name: data.name },
    });

    const family = existing
      ? await prisma.family.update({
          where: { id: existing.id },
          data: { ...data, active: data.active ?? true },
        })
      : await prisma.family.create({
          data: { ...data, active: data.active ?? true },
        });

    ids.push(family.id);
    console.log(`Família garantida: ${family.name} (${family.active ? 'ativa' : 'inativa'})`);
  }

  return ids;
}

async function seedMissionaries(): Promise<{ active: string[]; all: string[] }> {
  const all: string[] = [];
  const active: string[] = [];

  for (const data of MISSIONARIES) {
    const existing = await prisma.missionary.findFirst({
      where: { name: data.name },
    });

    const missionary = existing
      ? await prisma.missionary.update({
          where: { id: existing.id },
          data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            active: data.active ?? true,
          },
        })
      : await prisma.missionary.create({
          data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            active: data.active ?? true,
          },
        });

    all.push(missionary.id);
    if (missionary.active) active.push(missionary.id);
    console.log(`Missionário garantido: ${missionary.name} (${missionary.active ? 'ativo' : 'inativo'})`);
  }

  return { active, all };
}

async function seedLunches(familyIds: string[], missionaryIds: string[]) {
  const count = await prisma.lunch.count();

  if (count > 0) {
    console.log(`Almoços: ${count} registro(s) existente(s) — nenhum almoço demo criado.`);
    return;
  }

  const dates = nextWeekdays(LUNCH_COUNT);

  for (let i = 0; i < dates.length; i++) {
    const familyId = familyIds[i % familyIds.length];
    const missionaries = [
      missionaryIds[i % missionaryIds.length],
      missionaryIds[(i + 2) % missionaryIds.length],
    ];

    await prisma.lunch.create({
      data: {
        date: dates[i],
        familyId,
        missionaryIds: missionaries,
        notes: i % 2 === 0 ? 'Almoço demo — sem restrição alimentar' : undefined,
      },
    });

    console.log(`Almoço demo: ${dates[i].toISOString().split('T')[0]} (família index ${i % familyIds.length})`);
  }
}

async function main() {
  await seedUsers();

  const familyIds = await seedFamilies();
  const { active: missionaryIds } = await seedMissionaries();

  await seedLunches(familyIds, missionaryIds);

  console.log('\nSeed concluído.');
  console.log('Acesso demo:');
  console.log(`  ADMIN      → ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  COORDENADOR → ${COORDINATOR.email} / ${COORDINATOR.password}`);
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
