import { TestBed } from '@angular/core/testing';
import { ModelFormatterService } from './model-formatter.service';

describe('ModelFormatterService', () => {
  let service: ModelFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModelFormatterService]
    });
    service = TestBed.inject(ModelFormatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatSize', () => {
    it('should format bytes to GB', () => {
      expect(service.formatSize(1073741824)).toBe('1.0 GB');
      expect(service.formatSize(3825819519)).toContain('GB');
    });

    it('should handle zero bytes', () => {
      expect(service.formatSize(0)).toBe('0.0 GB');
    });

    it('should format with correct decimal places', () => {
      const result = service.formatSize(2147483648); // 2 GB
      expect(result).toBe('2.0 GB');
    });
  });

  describe('formatModelName', () => {
    it('should format model name with proper capitalization', () => {
      expect(service.formatModelName('llama3.2')).toBe('Llama 3.2');
      expect(service.formatModelName('codellama')).toBe('CodeLlama');
    });

    it('should handle predefined mappings', () => {
      expect(service.formatModelName('mistral:latest')).toBe('Mistral');
      expect(service.formatModelName('phi3')).toBe('Phi-3');
    });

    it('should handle empty string', () => {
      expect(service.formatModelName('')).toBe('AI Assistant');
    });

    it('should handle deepseek models', () => {
      expect(service.formatModelName('deepseek-r1')).toBe('Deepseek-R1');
      expect(service.formatModelName('deepseek-coder')).toBe('Deepseek Coder');
    });

    it('should capitalize unknown models', () => {
      const result = service.formatModelName('unknown-model');
      expect(result).toBe('Unknown-model');
    });
  });

  describe('getModelMappings', () => {
    it('should return all model mappings', () => {
      const mappings = service.getModelMappings();
      expect(mappings).toBeDefined();
      expect(typeof mappings).toBe('object');
      expect(mappings['llama3.2']).toBe('Llama 3.2');
    });

    it('should return a copy of mappings', () => {
      const mappings1 = service.getModelMappings();
      const mappings2 = service.getModelMappings();
      expect(mappings1).not.toBe(mappings2); // Different objects
      expect(mappings1).toEqual(mappings2); // Same content
    });
  });

  describe('Edge cases', () => {
    it('should handle null values gracefully', () => {
      expect(() => service.formatSize(null as any)).not.toThrow();
      expect(() => service.formatModelName(null as any)).not.toThrow();
    });

    it('should handle undefined values gracefully', () => {
      expect(() => service.formatSize(undefined as any)).not.toThrow();
      expect(() => service.formatModelName(undefined as any)).not.toThrow();
    });

    it('should handle negative sizes', () => {
      const result = service.formatSize(-1024);
      expect(result).toBeDefined();
    });
  });
});

