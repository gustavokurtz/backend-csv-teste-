import { ApiProperty } from '@nestjs/swagger';

export class CsvFileDto {
  @ApiProperty({ description: 'ID único do arquivo' })
  id: string;

  @ApiProperty({ description: 'Nome original do arquivo' })
  filename: string;

  @ApiProperty({ description: 'Data e hora do processamento' })
  processedAt: Date;

  @ApiProperty({ description: 'URL do arquivo no S3', required: false })
  s3Url?: string;

  @ApiProperty({ description: 'Status do processamento', enum: ['PROCESSING', 'COMPLETED', 'ERROR'] })
  status: string;

  @ApiProperty({ description: 'Mensagem de erro (se houver)', required: false })
  error?: string;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: Date;
}