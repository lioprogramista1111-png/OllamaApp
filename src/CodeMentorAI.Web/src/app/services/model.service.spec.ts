import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ModelService } from './model.service';
import { SignalRService } from './signalr.service';
import { LoggerService } from '../core/services/logger.service';
import { OllamaModel, ModelSwitchRequest, ModelSwitchResponse, ModelStatus, ModelCapabilities } from '../models/ollama.models';
import { API_CONFIG } from '../core/constants/app.constants';

describe('ModelService', () => {
  let service: ModelService;
  let httpMock: HttpTestingController;
  let signalRServiceSpy: jasmine.SpyObj<SignalRService>;
  let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

  const mockCapabilities: ModelCapabilities = {
    codeAnalysis: true,
    codeGeneration: true,
    documentation: true,
    chat: true,
    debugging: true,
    codeReview: true,
    supportedLanguages: ['javascript', 'typescript', 'python'],
    maxTokens: 4096,
    optimalUseCase: 'General purpose'
  };

  const mockModels: OllamaModel[] = [
    {
      name: 'llama2',
      displayName: 'Llama 2',
      description: 'Test model',
      size: 3825819519,
      digest: 'abc123',
      modifiedAt: new Date('2024-01-01T00:00:00Z'),
      capabilities: mockCapabilities,
      status: ModelStatus.Available
    },
    {
      name: 'codellama',
      displayName: 'CodeLlama',
      description: 'Code model',
      size: 3825819519,
      digest: 'def456',
      modifiedAt: new Date('2024-01-02T00:00:00Z'),
      capabilities: mockCapabilities,
      status: ModelStatus.Available
    }
  ];

  beforeEach(() => {
    const signalRSpy = jasmine.createSpyObj('SignalRService', ['on', 'off', 'invoke']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['info', 'debug', 'error', 'warn']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ModelService,
        { provide: SignalRService, useValue: signalRSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(ModelService);
    httpMock = TestBed.inject(HttpTestingController);
    signalRServiceSpy = TestBed.inject(SignalRService) as jasmine.SpyObj<SignalRService>;
    loggerServiceSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getModels', () => {
    it('should fetch models from API', (done) => {
      service.getModels().subscribe(models => {
        expect(models).toEqual(mockModels);
        expect(models.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockModels);
    });

    it('should handle empty models list', (done) => {
      service.getModels().subscribe(models => {
        expect(models).toEqual([]);
        expect(models.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}`);
      req.flush([]);
    });

    it('should handle HTTP errors gracefully', (done) => {
      service.getModels().subscribe(models => {
        expect(models).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getCurrentModel', () => {
    it('should fetch current model from API', (done) => {
      const currentModel = mockModels[0];

      service.getCurrentModel().subscribe(model => {
        expect(model).toEqual(currentModel);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/current`);
      expect(req.request.method).toBe('GET');
      req.flush(currentModel);
    });

    it('should handle no current model', (done) => {
      service.getCurrentModel().subscribe(model => {
        expect(model).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/current`);
      req.flush(null);
    });
  });

  describe('switchModel', () => {
    it('should switch model successfully', (done) => {
      const request: ModelSwitchRequest = {
        modelName: 'llama2',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      const response: ModelSwitchResponse = {
        success: true,
        message: 'Model switched successfully',
        switchDuration: 100
      };

      service.switchModel(request).subscribe(result => {
        expect(result).toEqual(response);
        expect(result.success).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/switch`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(response);
    });

    it('should handle switch failure', (done) => {
      const request: ModelSwitchRequest = {
        modelName: 'invalid-model',
        userId: 'test-user',
        sessionId: 'test-session'
      };
      const response: ModelSwitchResponse = {
        success: false,
        message: 'Model not found',
        switchDuration: 0
      };

      service.switchModel(request).subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.message).toContain('not found');
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/switch`);
      req.flush(response);
    });
  });

  describe('getModelInfo', () => {
    it('should fetch model info by name', (done) => {
      const modelName = 'llama2';
      const modelInfo = mockModels[0];

      service.getModelInfo(modelName).subscribe(info => {
        expect(info).toEqual(modelInfo);
        expect(info.name).toBe(modelName);
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/${modelName}`);
      expect(req.request.method).toBe('GET');
      req.flush(modelInfo);
    });

    it('should handle model not found', (done) => {
      const modelName = 'nonexistent';

      service.getModelInfo(modelName).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/${modelName}`);
      req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Observable streams', () => {
    it('should expose models$ observable', (done) => {
      service.models$.subscribe(models => {
        expect(models).toBeDefined();
        expect(Array.isArray(models)).toBe(true);
        done();
      });
    });

    it('should expose currentModel$ observable', (done) => {
      service.currentModel$.subscribe(model => {
        expect(model).toBeDefined();
        done();
      });
    });

    it('should expose isModelSwitching$ observable', (done) => {
      service.isModelSwitching$.subscribe(isSwitching => {
        expect(typeof isSwitching).toBe('boolean');
        done();
      });
    });
  });

  describe('SignalR integration', () => {
    it('should initialize SignalR listeners', () => {
      expect(signalRServiceSpy.on).toHaveBeenCalled();
    });

    it('should log initialization', () => {
      expect(loggerServiceSpy.info).toHaveBeenCalledWith(
        'ModelService initialized',
        null,
        'ModelService'
      );
    });
  });

  describe('Caching', () => {
    it('should cache model details', (done) => {
      const modelName = 'llama2';
      const modelInfo = mockModels[0];

      // First call
      service.getModelInfo(modelName).subscribe(() => {
        // Second call should use cache
        service.getModelInfo(modelName).subscribe(info => {
          expect(info).toEqual(modelInfo);
          done();
        });
      });

      // Only one HTTP request should be made
      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}/${modelName}`);
      req.flush(modelInfo);
    });
  });

  describe('Error handling', () => {
    it('should log errors when fetching models fails', (done) => {
      service.getModels().subscribe(() => {
        expect(loggerServiceSpy.error).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MODELS}`);
      req.error(new ProgressEvent('error'), { status: 500, statusText: 'Server Error' });
    });
  });
});

