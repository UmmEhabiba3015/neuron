import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DayEntity } from './entities/day.entity';
import { DaysController } from './days.controller';
import { DaysRepository } from './days.repository';
import { DaysService } from './days.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([DayEntity])],
  controllers: [DaysController],
  providers: [DaysRepository, DaysService],
  exports: [DaysService],
})
export class DaysModule {}
