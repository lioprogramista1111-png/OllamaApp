import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { 
  OllamaRegistryModel, 
  ModelRegistrySearchRequest, 
  ModelRegistrySearchResponse,
  ModelDownloadRequest,
  ModelDownloadResponse,
  ModelDownloadProgress
} from '../models/ollama.models';

@Injectable({
  providedIn: 'root'
})
export class ModelRegistryService {
  private readonly apiUrl = 'http://localhost:5000/api/modelregistry';
  
  // State management
  private searchResultsSubject = new BehaviorSubject<ModelRegistrySearchResponse>({
    models: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  private featuredModelsSubject = new BehaviorSubject<OllamaRegistryModel[]>([]);
  private categoriesSubject = new BehaviorSubject<string[]>([]);
  private activeDownloadsSubject = new BehaviorSubject<ModelDownloadProgress[]>([]);
  private downloadHistorySubject = new BehaviorSubject<ModelDownloadProgress[]>([]);
  
  // Observables
  public searchResults$ = this.searchResultsSubject.asObservable();
  public featuredModels$ = this.featuredModelsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public activeDownloads$ = this.activeDownloadsSubject.asObservable();
  public downloadHistory$ = this.downloadHistorySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    console.log('ModelRegistryService: Loading initial data...');
    this.getFeaturedModels().subscribe(
      models => console.log('ModelRegistryService: Featured models loaded:', models),
      error => console.error('ModelRegistryService: Error loading featured models:', error)
    );
    this.getCategories().subscribe(
      categories => console.log('ModelRegistryService: Categories loaded:', categories),
      error => console.error('ModelRegistryService: Error loading categories:', error)
    );
    this.getActiveDownloads().subscribe(
      downloads => console.log('ModelRegistryService: Active downloads loaded:', downloads),
      error => console.error('ModelRegistryService: Error loading active downloads:', error)
    );
  }

  // Search and Browse Methods
  searchModels(request: ModelRegistrySearchRequest): Observable<ModelRegistrySearchResponse> {
    return this.http.post<ModelRegistrySearchResponse>(`${this.apiUrl}/search`, request).pipe(
      tap(response => this.searchResultsSubject.next(response)),
      catchError(error => {
        console.error('Failed to search models:', error);
        return of({
          models: [],
          totalCount: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      })
    );
  }

  getModelDetails(modelName: string): Observable<OllamaRegistryModel | null> {
    return this.http.get<OllamaRegistryModel>(`${this.apiUrl}/${encodeURIComponent(modelName)}`).pipe(
      catchError(error => {
        console.error('Failed to get model details:', error);
        return of(null);
      })
    );
  }

  getFeaturedModels(count: number = 10): Observable<OllamaRegistryModel[]> {
    const params = new HttpParams().set('count', count.toString());
    
    return this.http.get<OllamaRegistryModel[]>(`${this.apiUrl}/featured`, { params }).pipe(
      tap(models => this.featuredModelsSubject.next(models)),
      catchError(error => {
        console.error('Failed to get featured models:', error);
        return of([]);
      })
    );
  }

  getModelsByCategory(category: string): Observable<OllamaRegistryModel[]> {
    return this.http.get<OllamaRegistryModel[]>(`${this.apiUrl}/category/${encodeURIComponent(category)}`).pipe(
      catchError(error => {
        console.error('Failed to get models by category:', error);
        return of([]);
      })
    );
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`).pipe(
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(error => {
        console.error('Failed to get categories:', error);
        return of([]);
      })
    );
  }

  // Download Methods
  downloadModel(request: ModelDownloadRequest): Observable<ModelDownloadResponse> {
    return this.http.post<ModelDownloadResponse>(`${this.apiUrl}/download`, request).pipe(
      tap(response => {
        if (response.success) {
          // Refresh active downloads
          this.getActiveDownloads().subscribe();
        }
      }),
      catchError(error => {
        console.error('Failed to start download:', error);
        return of({
          success: false,
          message: `Failed to start download: ${error.message || 'Unknown error'}`,
          downloadId: undefined,
          progress: undefined
        });
      })
    );
  }

  getDownloadProgress(downloadId: string): Observable<ModelDownloadProgress | null> {
    return this.http.get<ModelDownloadProgress>(`${this.apiUrl}/download/${downloadId}/progress`).pipe(
      catchError(error => {
        console.error('Failed to get download progress:', error);
        return of(null);
      })
    );
  }

  getActiveDownloads(): Observable<ModelDownloadProgress[]> {
    return this.http.get<ModelDownloadProgress[]>(`${this.apiUrl}/downloads/active`).pipe(
      tap(downloads => this.activeDownloadsSubject.next(downloads)),
      catchError(error => {
        console.error('Failed to get active downloads:', error);
        return of([]);
      })
    );
  }

  cancelDownload(downloadId: string): Observable<boolean> {
    return this.http.post(`${this.apiUrl}/download/${downloadId}/cancel`, {}).pipe(
      map(() => true),
      tap(() => {
        // Refresh active downloads
        this.getActiveDownloads().subscribe();
      }),
      catchError(error => {
        console.error('Failed to cancel download:', error);
        return of(false);
      })
    );
  }

  getDownloadHistory(count: number = 50): Observable<ModelDownloadProgress[]> {
    const params = new HttpParams().set('count', count.toString());
    
    return this.http.get<ModelDownloadProgress[]>(`${this.apiUrl}/downloads/history`, { params }).pipe(
      tap(history => this.downloadHistorySubject.next(history)),
      catchError(error => {
        console.error('Failed to get download history:', error);
        return of([]);
      })
    );
  }

  verifyModel(modelName: string): Observable<{ modelName: string; isValid: boolean; message: string }> {
    return this.http.post<{ modelName: string; isValid: boolean; message: string }>(
      `${this.apiUrl}/verify/${encodeURIComponent(modelName)}`, {}
    ).pipe(
      catchError(error => {
        console.error('Failed to verify model:', error);
        return of({
          modelName,
          isValid: false,
          message: `Verification failed: ${error.message || 'Unknown error'}`
        });
      })
    );
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDownloadSpeed(bytesPerSecond: number): string {
    return this.formatFileSize(bytesPerSecond) + '/s';
  }

  formatDuration(duration: string): string {
    try {
      // Parse TimeSpan format (HH:mm:ss.fff)
      const parts = duration.split(':');
      if (parts.length >= 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = Math.floor(parseFloat(parts[2]));
        
        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }
      return duration;
    } catch {
      return duration;
    }
  }

  // Filter and Sort Utilities
  createSearchRequest(
    query?: string,
    category?: string,
    languages?: string[],
    capabilities?: string[],
    sortBy: string = 'downloads',
    sortOrder: string = 'desc',
    page: number = 1,
    pageSize: number = 20,
    maxSize?: number,
    officialOnly?: boolean
  ): ModelRegistrySearchRequest {
    return {
      query,
      category,
      languages,
      capabilities,
      sortBy,
      sortOrder,
      page,
      pageSize,
      maxSize,
      officialOnly
    };
  }

  // Current state getters
  getCurrentSearchResults(): ModelRegistrySearchResponse {
    return this.searchResultsSubject.value;
  }

  getCurrentFeaturedModels(): OllamaRegistryModel[] {
    return this.featuredModelsSubject.value;
  }

  getCurrentCategories(): string[] {
    return this.categoriesSubject.value;
  }

  getCurrentActiveDownloads(): ModelDownloadProgress[] {
    return this.activeDownloadsSubject.value;
  }

  getCurrentDownloadHistory(): ModelDownloadProgress[] {
    return this.downloadHistorySubject.value;
  }

  // Models Path Methods
  getModelsPath(): Observable<{ modelsPath: string }> {
    return this.http.get<{ modelsPath: string }>(`${this.apiUrl}/models-path`).pipe(
      catchError(error => {
        console.error('Failed to get models path:', error);
        return of({ modelsPath: '' });
      })
    );
  }

  getLocalModelInfo(modelName: string): Observable<{
    modelName: string;
    isDownloaded: boolean;
    filePath: string;
    size: number;
    sizeFormatted: string;
  } | null> {
    return this.http.get<{
      modelName: string;
      isDownloaded: boolean;
      filePath: string;
      size: number;
      sizeFormatted: string;
    }>(`${this.apiUrl}/local/${encodeURIComponent(modelName)}`).pipe(
      catchError(error => {
        console.error('Failed to get local model info:', error);
        return of(null);
      })
    );
  }

  getLocalModels(): Observable<{
    models: Array<{
      modelName: string;
      fileName: string;
      filePath: string;
      size: number;
      sizeFormatted: string;
      lastModified: string;
    }>;
    modelsPath: string;
  }> {
    return this.http.get<{
      models: Array<{
        modelName: string;
        fileName: string;
        filePath: string;
        size: number;
        sizeFormatted: string;
        lastModified: string;
      }>;
      modelsPath: string;
    }>(`${this.apiUrl}/local`).pipe(
      catchError(error => {
        console.error('Failed to get local models:', error);
        return of({ models: [], modelsPath: '' });
      })
    );
  }
}
