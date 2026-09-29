import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Day } from './day.entity';
import { DaysController } from './days.controller';
import { DaysRepository } from './days.repository';
import { DaysService } from './days.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Day])],
  controllers: [DaysController],
  providers: [DaysRepository, DaysService],
  exports: [DaysService],
})
export class DaysModule {}
