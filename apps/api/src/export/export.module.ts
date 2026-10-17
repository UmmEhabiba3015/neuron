import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AudioModule } from '../entries/audio.module';
import { EntryEntity } from '../entries/entities/entry.entity';
import { ExportController } from './export.controller';
import { ExportRepository } from './export.repository';
import { ExportService } from './export.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AudioModule,
    TypeOrmModule.forFeature([EntryEntity]),
  ],
  controllers: [ExportController],
  providers: [ExportService, ExportRepository],
})
export class ExportModule {}
