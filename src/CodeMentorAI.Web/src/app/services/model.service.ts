import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import {
  OllamaModel,
  ModelSwitchRequest,
  ModelSwitchResponse,
  ModelPerformanceMetrics,
  ModelComparison,
  ModelFilter,
  ModelSortOption,
  ModelConfiguration
} from '../models/ollama.models';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class ModelService {
  private readonly apiUrl = 'http://localhost:5000/api/models';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private modelsSubject = new BehaviorSubject<OllamaModel[]>([]);
  private currentModelSubject = new BehaviorSubject<OllamaModel | null>(null);
  private modelSwitchingSubject = new BehaviorSubject<boolean>(false);
  private modelEventsSubject = new Subject<any>();

  public models$ = this.modelsSubject.asObservable();
  public currentModel$ = this.currentModelSubject.asObservable();
  public isModelSwitching$ = this.modelSwitchingSubject.asObservable();
  public modelEvents$ = this.modelEventsSubject.asObservable();

  // Caching infrastructure
  private lastModelsFetch = 0;
  private modelDetailsCache = new Map<string, { data: Observable<OllamaModel>, timestamp: number }>();
  private performanceCache = new Map<string, { data: Observable<ModelPerformanceMetrics>, timestamp: number }>();

  constructor(
    private http: HttpClient,
    private signalRService: SignalRService
  ) {
    this.initializeSignalRListeners();
    this.loadInitialData();
  }

  private initializeSignalRListeners(): void {
    // Listen for model switch events
    this.signalRService.on('ModelSwitched', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelSwitched', data });
      if (data.success) {
        this.getCurrentModel().subscribe();
      }
      this.modelSwitchingSubject.next(false);
    });

    this.signalRService.on('modelhubconnected', (data: any) => {
      // Connection confirmed
    });

    // Listen for model performance updates
    this.signalRService.on('ModelPerformanceUpdate', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelPerformanceUpdate', data });
      this.updateModelPerformance(data.modelName, data.metrics);
    });

    // Listen for model status changes
    this.signalRService.on('ModelStatusChanged', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelStatusChanged', data });
      this.updateModelStatus(data.modelName, data.status);
    });

    // Listen for model pull progress
    this.signalRService.on('ModelPullProgress', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelPullProgress', data });
    });

    this.signalRService.on('ModelPullCompleted', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelPullCompleted', data });

      if (data.success) {
        const updatedModels = data.updatedModels || data.UpdatedModels;
        if (updatedModels && Array.isArray(updatedModels)) {
          this.modelsSubject.next(updatedModels);
        } else {
          this.getModels().subscribe();
        }
      }
    });

    this.signalRService.on('ModelRemoved', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelRemoved', data });

      const updatedModels = data.updatedModels || data.UpdatedModels;
      if (updatedModels && Array.isArray(updatedModels)) {
        this.modelsSubject.next(updatedModels);
      } else {
        const modelName = data.modelName || data.ModelName;
        this.removeModelFromList(modelName);
      }
    });

    this.signalRService.on('ModelAdded', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelAdded', data });
      this.getModels().subscribe();
    });

    this.signalRService.on('ModelDeleted', (data: any) => {
      this.modelEventsSubject.next({ type: 'ModelDeleted', data });
      this.getModels().subscribe();
    });
  }

  private loadInitialData(): void {
    this.getModels().subscribe();
    this.getCurrentModel().subscribe();
  }

  getModels(forceRefresh = false): Observable<OllamaModel[]> {
    const now = Date.now();

    // Return cached data if available and not expired
    if (!forceRefresh && (now - this.lastModelsFetch) < this.CACHE_DURATION) {
      console.log('🚀 Using cached models list');
      return of(this.modelsSubject.value);
    }

    console.log('🔄 Fetching fresh models list from API');
    return this.http.get<OllamaModel[]>(this.apiUrl).pipe(
      tap(() => this.lastModelsFetch = now),
      map(models => {
        this.modelsSubject.next(models);
        return models;
      }),
      catchError(error => {
        console.error('Failed to get models:', error);
        return of([]);
      })
    );
  }

  /**
   * Invalidate the models cache and force a refresh
   */
  refreshModels(): Observable<OllamaModel[]> {
    this.lastModelsFetch = 0;
    return this.getModels(true);
  }

  getModelsFromDisk(): Observable<string[]> {
    console.log('📂 Getting models directly from disk...');
    return this.http.get<string[]>(`${this.apiUrl}/from-disk`).pipe(
      map(modelNames => {
        console.log(`📂 Found ${modelNames.length} models on disk:`, modelNames);
        return modelNames;
      })
    );
  }

  getCurrentModel(): Observable<OllamaModel | null> {
    return this.http.get<OllamaModel>(`${this.apiUrl}/current`).pipe(
      map(model => {
        this.currentModelSubject.next(model);
        return model;
      }),
      catchError((error): Observable<OllamaModel | null> => {
        // 404 is expected when no model is currently active
        if (error.status === 404) {
          console.log('ℹ️ No model is currently active');
        } else {
          console.error('Failed to get current model:', error);
        }
        this.currentModelSubject.next(null);
        return of(null);
      })
    );
  }

  switchModel(request: ModelSwitchRequest): Observable<ModelSwitchResponse> {
    this.modelSwitchingSubject.next(true);
    
    return this.http.post<ModelSwitchResponse>(`${this.apiUrl}/switch`, request).pipe(
      map(response => {
        if (response.success && response.model) {
          this.currentModelSubject.next(response.model);
        }
        this.modelSwitchingSubject.next(false);
        return response;
      }),
      catchError(error => {
        console.error('Failed to switch model:', error);
        this.modelSwitchingSubject.next(false);
        throw error;
      })
    );
  }

  getModelInfo(modelName: string, forceRefresh = false): Observable<OllamaModel> {
    const now = Date.now();
    const cached = this.modelDetailsCache.get(modelName);

    // Return cached data if available and not expired
    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🚀 Using cached model info for ${modelName}`);
      return cached.data;
    }

    // URL-encode the model name to handle special characters like ':'
    const encodedModelName = encodeURIComponent(modelName);
    const request$ = this.http.get<OllamaModel>(`${this.apiUrl}/${encodedModelName}`).pipe(
      shareReplay(1) // Share result with multiple subscribers
    );

    this.modelDetailsCache.set(modelName, { data: request$, timestamp: now });
    return request$;
  }

  getModelPerformance(modelName: string, forceRefresh = false): Observable<ModelPerformanceMetrics> {
    const now = Date.now();
    const cached = this.performanceCache.get(modelName);

    // Return cached data if available and not expired
    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`🚀 Using cached performance data for ${modelName}`);
      return cached.data;
    }

    // URL-encode the model name to handle special characters like ':'
    const encodedModelName = encodeURIComponent(modelName);
    const request$ = this.http.get<ModelPerformanceMetrics>(`${this.apiUrl}/${encodedModelName}/performance`).pipe(
      shareReplay(1) // Share result with multiple subscribers
    );

    this.performanceCache.set(modelName, { data: request$, timestamp: now });
    return request$;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.lastModelsFetch = 0;
    this.modelDetailsCache.clear();
    this.performanceCache.clear();
    console.log('🧹 All caches cleared');
  }

  getPerformanceComparison(): Observable<ModelComparison> {
    return this.http.get<{ [key: string]: ModelPerformanceMetrics }>(`${this.apiUrl}/performance/comparison`).pipe(
      map(data => {
        const models = data;
        const bestPerforming = this.calculateBestPerforming(models);
        return { models, bestPerforming };
      })
    );
  }

  getModelRecommendations(): Observable<{ [key: string]: string[] }> {
    return this.http.get<{ [key: string]: string[] }>(`${this.apiUrl}/recommendations`);
  }

  getBestModelForTask(taskType: string): Observable<{ modelName: string; taskType: string }> {
    // URL-encode the task type to handle special characters
    const encodedTaskType = encodeURIComponent(taskType);
    return this.http.get<{ modelName: string; taskType: string }>(`${this.apiUrl}/best-for-task/${encodedTaskType}`);
  }

  pullModel(modelName: string): Observable<string> {
    // URL-encode the model name to handle special characters like ':'
    const encodedModelName = encodeURIComponent(modelName);
    return this.http.post<string>(`${this.apiUrl}/${encodedModelName}/pull`, {});
  }

  removeModel(modelName: string): Observable<string> {
    // URL-encode the model name to handle special characters like ':'
    const encodedModelName = encodeURIComponent(modelName);
    console.log(`🔄 ModelService.removeModel: ${modelName} → ${encodedModelName}`);
    return this.http.delete(`${this.apiUrl}/${encodedModelName}`, {
      responseType: 'text'
    }) as Observable<string>;
  }

  preloadModel(modelName: string): Observable<string> {
    // URL-encode the model name to handle special characters like ':'
    const encodedModelName = encodeURIComponent(modelName);
    return this.http.post<string>(`${this.apiUrl}/${encodedModelName}/preload`, {});
  }

  filterModels(models: OllamaModel[], filter: ModelFilter): OllamaModel[] {
    return models.filter(model => {
      // Filter by capabilities
      if (filter.capabilities && filter.capabilities.length > 0) {
        const hasRequiredCapabilities = filter.capabilities.every(capability => {
          switch (capability) {
            case 'codeAnalysis': return model.capabilities.codeAnalysis;
            case 'codeGeneration': return model.capabilities.codeGeneration;
            case 'documentation': return model.capabilities.documentation;
            case 'chat': return model.capabilities.chat;
            case 'debugging': return model.capabilities.debugging;
            case 'codeReview': return model.capabilities.codeReview;
            default: return false;
          }
        });
        if (!hasRequiredCapabilities) return false;
      }

      // Filter by status
      if (filter.status && filter.status.length > 0) {
        if (!filter.status.includes(model.status)) return false;
      }

      // Filter by supported languages
      if (filter.supportedLanguages && filter.supportedLanguages.length > 0) {
        const hasLanguageSupport = filter.supportedLanguages.some(lang =>
          model.capabilities.supportedLanguages.includes(lang)
        );
        if (!hasLanguageSupport) return false;
      }

      // Filter by search term
      if (filter.searchTerm) {
        const searchTerm = filter.searchTerm.toLowerCase();
        const matchesSearch = 
          model.name.toLowerCase().includes(searchTerm) ||
          model.displayName.toLowerCase().includes(searchTerm) ||
          model.description.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Filter by minimum performance
      if (filter.minPerformance && model.performance) {
        if (model.performance.tokensPerSecond < filter.minPerformance) return false;
      }

      return true;
    });
  }

  sortModels(models: OllamaModel[], sortOption: ModelSortOption): OllamaModel[] {
    return [...models].sort((a, b) => {
      let comparison = 0;

      switch (sortOption.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'performance':
          const aPerf = a.performance?.tokensPerSecond || 0;
          const bPerf = b.performance?.tokensPerSecond || 0;
          comparison = aPerf - bPerf;
          break;
        case 'lastUsed':
          const aLastUsed = a.performance?.lastUsed ? new Date(a.performance.lastUsed).getTime() : 0;
          const bLastUsed = b.performance?.lastUsed ? new Date(b.performance.lastUsed).getTime() : 0;
          comparison = aLastUsed - bLastUsed;
          break;
      }

      return sortOption.direction === 'desc' ? -comparison : comparison;
    });
  }

  saveModelConfiguration(config: ModelConfiguration): void {
    localStorage.setItem(`model_config_${config.modelName}`, JSON.stringify(config));
  }

  getModelConfiguration(modelName: string): ModelConfiguration | null {
    const stored = localStorage.getItem(`model_config_${modelName}`);
    return stored ? JSON.parse(stored) : null;
  }

  private updateModelPerformance(modelName: string, metrics: ModelPerformanceMetrics): void {
    const models = this.modelsSubject.value;
    const updatedModels = models.map(model => 
      model.name === modelName ? { ...model, performance: metrics } : model
    );
    this.modelsSubject.next(updatedModels);
  }

  private updateModelStatus(modelName: string, status: string): void {
    const models = this.modelsSubject.value;
    const updatedModels = models.map(model => 
      model.name === modelName ? { ...model, status: status as any } : model
    );
    this.modelsSubject.next(updatedModels);
  }

  private removeModelFromList(modelName: string): void {
    console.log(`🗑️ ModelService.removeModelFromList called for: "${modelName}"`);
    const models = this.modelsSubject.value;
    console.log(`📋 Current models before removal:`, models.map(m => m.name));

    const updatedModels = models.filter(model => {
      const shouldKeep = model.name !== modelName;
      if (!shouldKeep) {
        console.log(`✅ Found and removing model: "${model.name}"`);
      }
      return shouldKeep;
    });

    console.log(`📋 Models after removal:`, updatedModels.map(m => m.name));
    console.log(`📊 Model count: ${models.length} → ${updatedModels.length}`);

    this.modelsSubject.next(updatedModels);
    console.log(`✅ modelsSubject updated with ${updatedModels.length} models`);
  }

  private calculateBestPerforming(models: { [key: string]: ModelPerformanceMetrics }) {
    const entries = Object.entries(models);
    
    const fastest = entries.reduce((best, [name, metrics]) => 
      !best || metrics.tokensPerSecond > best[1].tokensPerSecond ? [name, metrics] : best
    )?.[0] || '';

    const mostEfficient = entries.reduce((best, [name, metrics]) => 
      !best || metrics.averageResponseTime < best[1].averageResponseTime ? [name, metrics] : best
    )?.[0] || '';

    const mostUsed = entries.reduce((best, [name, metrics]) => 
      !best || metrics.totalRequests > best[1].totalRequests ? [name, metrics] : best
    )?.[0] || '';

    return { fastest, mostEfficient, mostUsed };
  }
}
