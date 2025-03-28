import { Test, TestingModule } from '@nestjs/testing';
import { CsvFilesService } from './csv-files.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

// Mock das dependências problemáticas
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({})
  }))
}));

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    data: Buffer.from('processedData')
  })
}));

jest.mock('fs', () => ({
  createReadStream: jest.fn(() => 'mockedStream'),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true)
}));

describe('CsvFilesService', () => {
  let service: CsvFilesService;

  const mockPrismaService = {
    csvFile: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  };

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://mock-url.com/file.csv')
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'PYTHON_API_URL') return 'http://localhost:8000';
      return 'test-value';
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsvFilesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<CsvFilesService>(CsvFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all files', async () => {
    const mockFiles = [{ id: '1', filename: 'test.csv' }];
    mockPrismaService.csvFile.findMany.mockResolvedValue(mockFiles);

    const result = await service.findAll();
    
    expect(result).toEqual(mockFiles);
    expect(mockPrismaService.csvFile.findMany).toHaveBeenCalled();
  });

  it('should find one file by id', async () => {
    const mockFile = { id: '1', filename: 'test.csv' };
    mockPrismaService.csvFile.findUnique.mockResolvedValue(mockFile);

    const result = await service.findOne('1');
    
    expect(result).toEqual(mockFile);
    expect(mockPrismaService.csvFile.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should update a file by ID', async () => {
    const mockFile = { id: '1', filename: 'test.csv', status: 'PROCESSING' };
    const mockUpdatedFile = { id: '1', filename: 'renamed.csv', status: 'COMPLETED' };
    const updateData = { filename: 'renamed.csv', status: 'COMPLETED' };
    
    mockPrismaService.csvFile.findUnique.mockResolvedValue(mockFile);
    mockPrismaService.csvFile.update.mockResolvedValue(mockUpdatedFile);
  
    const result = await service.update('1', updateData);
    
    expect(result).toEqual(mockUpdatedFile);
    expect(mockPrismaService.csvFile.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(mockPrismaService.csvFile.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateData,
    });
  });
  
  it('should throw an error when updating a non-existent file', async () => {
    mockPrismaService.csvFile.findUnique.mockResolvedValue(null);
  
    await expect(service.update('1', { filename: 'renamed.csv' })).rejects.toThrow(HttpException);
  });

  it('should throw an error if file not found', async () => {
    mockPrismaService.csvFile.findUnique.mockResolvedValue(null);

    await expect(service.findOne('1')).rejects.toThrow(HttpException);
  });
});

