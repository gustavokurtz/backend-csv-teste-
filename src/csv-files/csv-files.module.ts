import { Module } from '@nestjs/common';
import { CsvFilesController } from './csv-files.controller';
import { CsvFilesService } from './csv-files.service';
import { S3Module } from '../s3/s3.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [CsvFilesController],
  providers: [CsvFilesService],
})
export class CsvFilesModule {}