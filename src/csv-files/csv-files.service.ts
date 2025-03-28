import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Papa from 'papaparse';
import * as os from 'os';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class CsvFilesService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {}

  async findAll() {
    return this.prisma.csvFile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const file = await this.prisma.csvFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    return file;
  }

  async create(file: Express.Multer.File) {
    // Criar registro no banco de dados
    const csvFile = await this.prisma.csvFile.create({
      data: {
        filename: file.originalname,
      },
    });

    try {
      // Processar o arquivo na API Python
      const pythonApiUrl = this.configService.get<string>('PYTHON_API_URL') || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: 'text/csv',
      });

      const response = await axios.post(`${pythonApiUrl}/processar-csv/`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer',
      });

      // Salvar o arquivo processado temporariamente
      const tempDir = os.tmpdir();
      const processedFilePath = path.join(tempDir, `processed_${csvFile.id}.csv`);
      fs.writeFileSync(processedFilePath, Buffer.from(response.data));

      // Fazer upload do arquivo processado para o S3
      const s3Url = await this.s3Service.uploadFile(
        processedFilePath,
        `processed_${csvFile.filename}`
      );

      // Atualizar o registro no banco de dados
      const updatedFile = await this.prisma.csvFile.update({
        where: { id: csvFile.id },
        data: {
          s3Url,
          status: 'COMPLETED',
        },
      });

      // Limpar arquivos temporários
      fs.unlinkSync(file.path);
      fs.unlinkSync(processedFilePath);

      return updatedFile;
    } catch (error) {
      // Atualizar o registro em caso de erro
      await this.prisma.csvFile.update({
        where: { id: csvFile.id },
        data: {
          status: 'ERROR',
          error: error.message || 'Erro desconhecido ao processar arquivo',
        },
      });

      // Limpar o arquivo temporário
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      throw new HttpException(
        'Erro ao processar arquivo CSV',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateData: Partial<{ filename: string, status: string }>) {
    // Verificar se o arquivo existe
    const file = await this.prisma.csvFile.findUnique({
      where: { id },
    });
  
    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  
    // Atualizar o arquivo
    return this.prisma.csvFile.update({
      where: { id },
      data: updateData,
    });
  }

  async getPreview(id: string): Promise<any> {
    // Verificar se o arquivo existe
    const file = await this.prisma.csvFile.findUnique({
      where: { id },
    });
  
    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  
    if (file.status !== 'COMPLETED') {
      throw new HttpException('File not processed yet', HttpStatus.BAD_REQUEST);
    }
  
    if (!file.s3Url) {
      throw new HttpException('File has no URL available', HttpStatus.BAD_REQUEST);
    }
  
    try {
      // Download do arquivo do S3
      const response = await axios.get(file.s3Url, { responseType: 'arraybuffer' });
      const csvData = Buffer.from(response.data).toString('utf-8');
  
      // Utilizar o papaparse para processar o CSV
      const results = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
  
      // Extrair cabeçalhos e linhas
      const headers = results.meta.fields || [];
      const rows = results.data.slice(0, 5).map((row: any) => {
        return headers.map(header => String(row[header] || ''));
      });
  
      // Calcular estatísticas básicas
      let nota1Sum = 0;
      let nota2Sum = 0;
      let notaFinalSum = 0;
      let validRows = 0;
  
      results.data.forEach((row: any) => {
        if (row.nota1 && row.nota2) {
          nota1Sum += Number(row.nota1);
          nota2Sum += Number(row.nota2);
          
          // A nota final é a média das duas notas
          const notaFinal = (Number(row.nota1) + Number(row.nota2)) / 2;
          notaFinalSum += notaFinal;
          validRows++;
        }
      });
  
      return {
        headers,
        rows,
        totalRows: results.data.length,
        nota1Media: validRows > 0 ? nota1Sum / validRows : 0,
        nota2Media: validRows > 0 ? nota2Sum / validRows : 0,
        notaFinalMedia: validRows > 0 ? notaFinalSum / validRows : 0,
      };
    } catch (error) {
      console.error('Error fetching preview:', error);
      throw new HttpException('Error fetching preview', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string) {
    // Verificar se o arquivo existe
    const file = await this.prisma.csvFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }

    // Se houver URL, deletar do S3 antes de remover do banco
    if (file.s3Url) {
      // Supondo que o arquivo no S3 tenha o prefixo "csv-files/processed_..."
      const key = `processed_${file.filename}`; 
      await this.s3Service.deleteFile(`csv-files/${key}`);
    }

    // Deletar o registro no banco
    return this.prisma.csvFile.delete({
      where: { id },
    });
  }

  async regenerateSignedUrl(id: string): Promise<{ s3Url: string }> {
    const file = await this.prisma.csvFile.findUnique({
      where: { id },
    });
  
    if (!file) {
      throw new HttpException('File not found', HttpStatus.NOT_FOUND);
    }
  
    if (!file.s3Url) {
      throw new HttpException(
        'Este arquivo não possui um URL do S3',
        HttpStatus.BAD_REQUEST,
      );
    }
  
    // Extrair a chave do S3 da URL existente (aqui estamos assumindo o padrão "processed_<filename>")
    const key = `processed_${file.filename}`;
  
    // Regenerar a URL pré-assinada
    const newSignedUrl = await this.s3Service.regenerateSignedUrl(key);
  
    // Atualizar o arquivo no banco de dados com a nova URL
    await this.prisma.csvFile.update({
      where: { id },
      data: {
        s3Url: newSignedUrl,
      },
    });
  
    return { s3Url: newSignedUrl };
  }
}
