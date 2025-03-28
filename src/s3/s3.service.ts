import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    
    if (!accessKeyId || !secretAccessKey) {
      console.warn('AWS credentials not found. S3 functionality will be limited.');
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: 'dummy-key',
          secretAccessKey: 'dummy-secret',
        },
      });
    } else {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async uploadFile(filePath: string, fileName: string): Promise<string> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const key = `csv-files/${fileName}`;

    // Fazer upload do arquivo
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: createReadStream(filePath),
        ContentType: 'text/csv',
      },
    });

    await upload.done();
    
    // Gerar URL pré-assinada válida por 1 semana (7 dias * 24 horas * 60 minutos * 60 segundos)
    const oneWeekInSeconds = 7 * 24 * 60 * 60;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    
    const signedUrl = await getSignedUrl(this.s3Client, command, { 
      expiresIn: oneWeekInSeconds 
    });
    
    return signedUrl;
  }

  // Método adicional para regenerar URLs expiradas
  async regenerateSignedUrl(key: string): Promise<string> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const oneWeekInSeconds = 7 * 24 * 60 * 60;
    
    // Se a chave não tiver o prefixo 'csv-files/', adicione-o
    const fullKey = key.startsWith('csv-files/') ? key : `csv-files/${key}`;
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fullKey,
    });
    
    return getSignedUrl(this.s3Client, command, { 
      expiresIn: oneWeekInSeconds 
    });
  }

  // NOVO: método para deletar um arquivo do S3
  async deleteFile(key: string): Promise<void> {
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }
}
