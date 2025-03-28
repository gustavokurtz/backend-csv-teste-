import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateCsvFileDto {
  @ApiProperty({ description: 'Nome do arquivo', required: false })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({ 
    description: 'Status do processamento', 
    enum: ['PROCESSING', 'COMPLETED', 'ERROR'],
    required: false
  })
  @IsOptional()
  @IsEnum(['PROCESSING', 'COMPLETED', 'ERROR'])
  status?: string;
}