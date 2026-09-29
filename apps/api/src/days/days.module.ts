import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Day } from './day.entity';
import { DaysRepository } from './days.repository';
import { DaysService } from './days.service';

@Module({
  imports: [TypeOrmModule.forFeature([Day])],
  providers: [DaysRepository, DaysService],
  exports: [DaysService],
})
export class DaysModule {}
