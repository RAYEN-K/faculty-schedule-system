import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RequestsModule } from './requests/requests.module';
import { SchedulesModule } from './schedules/schedules.module';
import { DepartmentsModule } from './departments/departments.module';
import { EventsModule } from './events/events.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RequestsModule,
    SchedulesModule,
    DepartmentsModule,
    EventsModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
