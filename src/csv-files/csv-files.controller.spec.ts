import { Test, TestingModule } from '@nestjs/testing';
import { CsvFilesController } from './csv-files.controller';
import { CsvFilesService } from './csv-files.service';

describe('CsvFilesController', () => {
  let controller: CsvFilesController;

  const mockCsvFilesService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn() 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsvFilesController],
      providers: [
        {
          provide: CsvFilesService,
          useValue: mockCsvFilesService
        }
      ],
    }).compile();

    controller = module.get<CsvFilesController>(CsvFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should find all files', async () => {
    const mockFiles = [{ id: '1', filename: 'test.csv' }];
    mockCsvFilesService.findAll.mockResolvedValue(mockFiles);

    const result = await controller.findAll();
    
    expect(result).toEqual(mockFiles);
    expect(mockCsvFilesService.findAll).toHaveBeenCalled();
  });

  it('should find one file by id', async () => {
    const mockFile = { id: '1', filename: 'test.csv' };
    mockCsvFilesService.findOne.mockResolvedValue(mockFile);

    const result = await controller.findOne('1');
    
    expect(result).toEqual(mockFile);
    expect(mockCsvFilesService.findOne).toHaveBeenCalledWith('1');
  });


  describe('update', () => {
    it('should update a file by ID', async () => {
      const mockFile = { id: '1', filename: 'renamed.csv', status: 'COMPLETED' };
      const updateDto = { filename: 'renamed.csv', status: 'COMPLETED' };
      
      mockCsvFilesService.update.mockResolvedValue(mockFile);
  
      const result = await controller.update('1', updateDto);
      
      expect(result).toEqual(mockFile);
      expect(mockCsvFilesService.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

});