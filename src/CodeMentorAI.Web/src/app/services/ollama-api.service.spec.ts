import { TestBed } from '@angular/core/testing';

import { OllamaApiService } from './ollama-api.service';

describe('OllamaApiService', () => {
  let service: OllamaApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OllamaApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
