import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';

// Mock das dependências da AWS para evitar a inicialização real
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({}))
  };
});

jest.mock('@aws-sdk/lib-storage', () => {
  return {
    Upload: jest.fn().mockImplementation(() => ({
      done: jest.fn().mockResolvedValue({})
    }))
  };
});

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'AWS_REGION') return 'us-east-1';
        if (key === 'AWS_ACCESS_KEY_ID') return 'test-key';
        if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
        if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
        return undefined;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    
    // Mock do método uploadFile para evitar chamadas reais
    service.uploadFile = jest.fn().mockResolvedValue('https://mock-url.com/file.csv');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});