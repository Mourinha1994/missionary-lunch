import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LunchesModule } from './lunch/lunches.module';
import { FamiliesModule } from './families/families.module';
import { MissionariesModule } from './missionaries/missionaries.module';
import { PdayModule } from './pday/pday.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    LunchesModule,
    FamiliesModule,
    MissionariesModule,
    PdayModule,
    KeepAliveModule,
    UsersModule,
  ],
})
export class AppModule {}
