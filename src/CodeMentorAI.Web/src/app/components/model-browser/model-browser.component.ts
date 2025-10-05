import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

import {
  OllamaRegistryModel,
  ModelRegistrySearchRequest,
  ModelRegistrySearchResponse,
  ModelDownloadProgress
} from '../../models/ollama.models';

import { ModelRegistryService } from '../../services/model-registry.service';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-model-browser',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './model-browser.component.html',
  styleUrls: ['./model-browser.component.scss']
})
export class ModelBrowserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form and search
  searchForm: FormGroup;
  isLoading = false;

  // Data
  searchResults: ModelRegistrySearchResponse = {
    models: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  featuredModels: OllamaRegistryModel[] = [];
  categories: string[] = [];
  activeDownloads: ModelDownloadProgress[] = [];
  modelsPath: string = '';
  localModels: any[] = [];

  // Additional properties for template
  error: string | null = null;
  availableModels: OllamaRegistryModel[] = [];
  filteredModels: OllamaRegistryModel[] = [];

  // UI state
  selectedTab = 0;
  currentPage = 1;
  pageSize = 20;

  constructor(
    private fb: FormBuilder,
    private registryService: ModelRegistryService,
    private signalRService: SignalRService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupDataSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createSearchForm(): FormGroup {
    return this.fb.group({
      query: [''],
      category: [''],
      sortBy: ['downloads'],
      sortOrder: ['desc'],
      maxSize: [null],
      officialOnly: [false]
    });
  }

  private initializeData(): void {
    console.log('ModelBrowserComponent: Initializing data...');

    // Test API connectivity first
    this.registryService.getFeaturedModels().subscribe({
      next: (models) => {
        console.log('✅ API call successful! Featured models:', models);
        this.featuredModels = models;
      },
      error: (error) => {
        console.error('❌ API call failed:', error);
        // Fallback to test models if API fails
        this.setTestModels();
      }
    });

    this.loadModelsPath();
    this.loadLocalModels();
  }

  private setTestModels(): void {
    console.log('Setting test models...');
    this.featuredModels = [
      {
        name: 'llama2:7b',
        displayName: 'Llama 2 7B (TEST)',
        description: 'Test model for debugging',
        shortDescription: 'Test model',
        category: 'General',
        size: 3800000000,
        downloads: 1000000,
        tags: ['test'],
        isOfficial: true,
        updatedAt: new Date().toISOString(),
        license: 'MIT',
        languages: ['en'],
        capabilities: {
          codeAnalysis: true,
          codeGeneration: true,
          documentation: true,
          chat: true,
          debugging: true,
          codeReview: true,
          supportedLanguages: ['javascript', 'typescript', 'python'],
          maxTokens: 4096,
          optimalUseCase: 'General purpose coding assistant'
        },
        publisher: 'Meta',
        variants: ['7b'],
        metadata: {}
      }
    ];
  }

  private setupDataSubscriptions(): void {
    // Load models path
    this.registryService.getModelsPath()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.modelsPath = response.modelsPath;
        },
        error: (error) => console.error('Error loading models path:', error)
      });

    // Load local models
    this.registryService.getLocalModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.localModels = response.models;
        },
        error: (error) => console.error('Error loading local models:', error)
      });
  }

  // Simple test method for download buttons
  testDownload(modelName: string): void {
    console.log('TEST: Download clicked for', modelName);
    this.snackBar.open(`TEST: Download clicked for ${modelName}! The button is working!`, 'Close', {
      duration: 3000
    });
  }

  // Placeholder methods for template compatibility
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Path copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

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

  formatDuration(seconds: number | string): string {
    const numSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const secs = Math.floor(numSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getModelIcon(model: OllamaRegistryModel): string {
    if (model.category === 'Code') return 'code';
    if (model.category === 'General') return 'chat';
    if (model.category === 'Lightweight') return 'speed';
    return 'psychology';
  }

  getDownloadProgress(modelName: string): ModelDownloadProgress | null {
    return this.activeDownloads.find(d => d.modelName === modelName) || null;
  }

  isModelDownloading(modelName: string): boolean {
    return this.activeDownloads.some(d => d.modelName === modelName && !d.isCompleted);
  }

  downloadModel(model: OllamaRegistryModel): void {
    console.log('Download model:', model.name);
    this.testDownload(model.name);
  }

  cancelDownload(modelName: string): void {
    console.log('Cancel download:', modelName);
  }

  performSearch(): void {
    console.log('Perform search');
  }

  clearSearch(): void {
    this.searchForm.reset({
      query: '',
      category: '',
      sortBy: 'downloads',
      sortOrder: 'desc',
      maxSize: null,
      officialOnly: false
    });
  }

  onPageChange(event: any): void {
    console.log('Page change:', event);
  }

  private loadModelsPath(): void {
    // Already handled in setupDataSubscriptions
  }

  private loadLocalModels(): void {
    // Already handled in setupDataSubscriptions
  }

  // Getters for template
  get selectedCategories(): string[] {
    return [];
  }

  onSearchChange(): void {
    // Implement search change logic
  }

  toggleCategory(category: string): void {
    // Implement category toggle logic
  }
}