import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Body
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { CsvFilesService } from './csv-files.service';
  import { diskStorage } from 'multer';
  import * as path from 'path';
  import * as fs from 'fs';
  import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam, ApiBody } from '@nestjs/swagger';
  import { CsvFileDto } from './dto/csv-file.dto';
  import { UpdateCsvFileDto } from './dto/update-csv-file.dto';
  
  // Criar diretório de uploads se não existir
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  @ApiTags('csv-files')
  @Controller('csv-files')
  export class CsvFilesController {
    constructor(private readonly csvFilesService: CsvFilesService) {}
  
    @Get()
    @ApiOperation({ summary: 'Obter todos os arquivos CSV' })
    @ApiResponse({ 
      status: 200, 
      description: 'Lista de arquivos CSV obtida com sucesso',
      type: [CsvFileDto]
    })
    async findAll() {
      return this.csvFilesService.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obter arquivo CSV por ID' })
    @ApiParam({ name: 'id', description: 'ID do arquivo CSV' })
    @ApiResponse({ 
      status: 200, 
      description: 'Arquivo CSV obtido com sucesso',
      type: CsvFileDto
    })
    @ApiResponse({ status: 404, description: 'Arquivo CSV não encontrado' })
    async findOne(@Param('id') id: string) {
      return this.csvFilesService.findOne(id);
    }
  
    @Post('upload')
    @ApiOperation({ summary: 'Fazer upload e processar arquivo CSV' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Arquivo CSV a ser processado',
          },
        },
        required: ['file']
      },
    })
    @ApiResponse({ 
      status: 201, 
      description: 'Arquivo CSV processado com sucesso',
      type: CsvFileDto
    })
    @ApiResponse({ status: 400, description: 'Erro ao processar arquivo CSV' })
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: 'uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(csv)$/)) {
            return cb(new Error('Apenas arquivos CSV são permitidos'), false);
          }
          cb(null, true);
        },
      }),
    )
    async create(@UploadedFile() file: Express.Multer.File) {
      return this.csvFilesService.create(file);
    }
  
    @Get(':id/preview')
    @ApiOperation({ summary: 'Obter prévia dos dados do arquivo CSV' })
    @ApiParam({ name: 'id', description: 'ID do arquivo CSV' })
    @ApiResponse({ status: 200, description: 'Prévia do arquivo obtida com sucesso' })
    @ApiResponse({ status: 404, description: 'Arquivo CSV não encontrado' })
    async getPreview(@Param('id') id: string) {
      return this.csvFilesService.getPreview(id);
    }
  
    @Post(':id/regenerate-url')
    @ApiOperation({ summary: 'Regenerar URL pré-assinada para um arquivo' })
    @ApiParam({ name: 'id', description: 'ID do arquivo CSV' })
    @ApiResponse({ 
      status: 200, 
      description: 'URL regenerada com sucesso',
      schema: {
        type: 'object',
        properties: {
          s3Url: {
            type: 'string',
            description: 'Nova URL pré-assinada para o arquivo'
          }
        }
      }
    })
    @ApiResponse({ status: 404, description: 'Arquivo CSV não encontrado' })
    async regenerateSignedUrl(@Param('id') id: string) {
      return this.csvFilesService.regenerateSignedUrl(id);
    }
  
    @Put(':id')
    @ApiOperation({ summary: 'Atualizar informações de um arquivo CSV' })
    @ApiParam({ name: 'id', description: 'ID do arquivo CSV' })
    @ApiBody({ type: UpdateCsvFileDto })
    @ApiResponse({ 
      status: 200, 
      description: 'Arquivo CSV atualizado com sucesso',
      type: CsvFileDto
    })
    @ApiResponse({ status: 404, description: 'Arquivo CSV não encontrado' })
    async update(@Param('id') id: string, @Body() updateCsvFileDto: UpdateCsvFileDto) {
      return this.csvFilesService.update(id, updateCsvFileDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Excluir arquivo CSV por ID' })
    @ApiParam({ name: 'id', description: 'ID do arquivo CSV' })
    @ApiResponse({ 
      status: 200, 
      description: 'Arquivo CSV excluído com sucesso',
      type: CsvFileDto
    })
    @ApiResponse({ status: 404, description: 'Arquivo CSV não encontrado' })
    async remove(@Param('id') id: string) {
      return this.csvFilesService.remove(id);
    }
  }
  