import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { ModelService } from '../../services/model.service';
import { SignalRService } from '../../services/signalr.service';
import { 
  OllamaModel, 
  ModelSwitchRequest, 
  ModelStatus,
  ModelCapabilities 
} from '../../models/ollama.models';

@Component({
  selector: 'app-model-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  template: `
    <div class="model-selector-container">
      <!-- Current Model Display -->
      <div class="current-model-section">
        <div class="current-model-header">
          <mat-icon>psychology</mat-icon>
          <span class="current-model-label">Active Model</span>
        </div>
        
        <div class="current-model-info" *ngIf="currentModel; else noModelSelected">
          <div class="model-name">
            {{ currentModel.displayName }}
            <mat-icon 
              class="status-icon" 
              [class]="'status-' + currentModel.status.toLowerCase()"
              [matTooltip]="getStatusTooltip(currentModel.status)">
              {{ getStatusIcon(currentModel.status) }}
            </mat-icon>
          </div>
          <div class="model-description">{{ currentModel.description }}</div>
          <div class="model-capabilities">
            <mat-chip-set>
              <mat-chip *ngFor="let capability of getActiveCapabilities(currentModel.capabilities)">
                {{ capability }}
              </mat-chip>
            </mat-chip-set>
          </div>
          <div class="model-performance" *ngIf="currentModel.performance">
            <span class="performance-metric">
              <mat-icon>speed</mat-icon>
              {{ currentModel.performance.tokensPerSecond | number:'1.1-1' }} tokens/s
            </span>
            <span class="performance-metric">
              <mat-icon>timer</mat-icon>
              {{ currentModel.performance.averageResponseTime | number:'1.0-0' }}ms avg
            </span>
          </div>
        </div>

        <ng-template #noModelSelected>
          <div class="no-model-selected">
            <mat-icon>warning</mat-icon>
            <span>No model selected</span>
          </div>
        </ng-template>
      </div>

      <!-- Model Selector -->
      <div class="model-selector-section">
        <mat-select 
          [(value)]="selectedModelName"
          placeholder="Select a model"
          [disabled]="isModelSwitching"
          (selectionChange)="onModelSelectionChange($event.value)">
          
          <mat-option *ngFor="let model of availableModels; trackBy: trackByModelName" [value]="model.name">
            <div class="model-option">
              <div class="model-option-header">
                <span class="model-option-name">{{ model.displayName }}</span>
                <div class="model-option-actions">
                  <mat-icon
                    class="model-option-status"
                    [class]="'status-' + model.status.toLowerCase()">
                    {{ getStatusIcon(model.status) }}
                  </mat-icon>
                  <button
                    mat-icon-button
                    class="delete-model-btn"
                    (click)="deleteModel($event, model.name)"
                    [matTooltip]="'Remove ' + model.displayName">
                    <mat-icon class="delete-icon">delete</mat-icon>
                  </button>
                </div>
              </div>
              <div class="model-option-description">{{ model.description }}</div>
              <div class="model-option-size">{{ formatSize(model.size) }}</div>
            </div>
          </mat-option>
        </mat-select>

        <button
          mat-raised-button
          color="primary"
          [disabled]="!selectedModelName || isModelSwitching || selectedModelName === currentModel?.name"
          (click)="switchToSelectedModel()">

          <mat-spinner *ngIf="isModelSwitching" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!isModelSwitching">swap_horiz</mat-icon>
          {{ isModelSwitching ? 'Switching...' : 'Switch Model' }}
        </button>

        <button
          mat-icon-button
          color="accent"
          (click)="refreshModels()"
          matTooltip="Refresh model list">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions" *ngIf="currentModel">
        <button 
          mat-button 
          (click)="preloadModel(currentModel.name)"
          [disabled]="isModelSwitching"
          matTooltip="Preload model for faster responses">
          <mat-icon>flash_on</mat-icon>
          Preload
        </button>

        <button 
          mat-button 
          (click)="showModelDetails(currentModel)"
          matTooltip="View detailed model information">
          <mat-icon>info</mat-icon>
          Details
        </button>

        <button 
          mat-button 
          (click)="showPerformanceMetrics(currentModel)"
          matTooltip="View performance metrics">
          <mat-icon>analytics</mat-icon>
          Metrics
        </button>
      </div>

      <!-- Connection Status -->
      <div class="connection-status">
        <mat-icon 
          [class]="'connection-' + connectionStatus.toLowerCase()"
          [matTooltip]="'SignalR: ' + connectionStatus">
          {{ getConnectionIcon(connectionStatus) }}
        </mat-icon>
        <span class="connection-text">{{ connectionStatus }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./model-selector.component.scss']
})
export class ModelSelectorComponent implements OnInit, OnDestroy {
  @Input() userId: string = 'default-user';
  @Input() sessionId: string = 'default-session';
  @Output() modelChanged = new EventEmitter<OllamaModel>();
  @Output() modelSwitchError = new EventEmitter<string>();

  availableModels: OllamaModel[] = [];
  currentModel: OllamaModel | null = null;
  selectedModelName: string = '';
  isModelSwitching: boolean = false;
  connectionStatus: string = 'Disconnected';

  private destroy$ = new Subject<void>();

  constructor(
    private modelService: ModelService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.setupPeriodicRefresh();
    this.setupVisibilityListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPeriodicRefresh(): void {
    interval(5000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.modelService.getModels())
      )
      .subscribe(models => {
        this.cdr.detectChanges();
      });
  }

  private setupVisibilityListener(): void {
    const visibilityHandler = () => {
      if (!document.hidden) {
        this.modelService.getModels().subscribe();
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    this.destroy$.subscribe(() => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    });
  }

  private initializeComponent(): void {
    // Load available models (show all models from API - they are all installed)
    this.modelService.getModels()
      .pipe(takeUntil(this.destroy$))
      .subscribe(models => {
        // All models returned by the API are installed models
        this.availableModels = models;
      });

    // Get current model
    this.modelService.getCurrentModel()
      .pipe(takeUntil(this.destroy$))
      .subscribe(model => {
        this.currentModel = model;
        if (model) {
          this.selectedModelName = model.name;
        }
      });
  }

  private setupSubscriptions(): void {
    this.modelService.models$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (models) => {
          this.availableModels = models.map(m => ({ ...m }));
          this.cdr.markForCheck();
          this.cdr.detectChanges();

          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        }
      });

    // Subscribe to model changes
    this.modelService.currentModel$
      .pipe(takeUntil(this.destroy$))
      .subscribe(model => {
        this.currentModel = model;
        if (model) {
          this.selectedModelName = model.name;
          this.modelChanged.emit(model);
        }
      });

    // Subscribe to model events (pull completed, removed, etc.)
    this.modelService.modelEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log(`🔔 Model event received:`, event);

        // Refresh the models list when a model is added or removed
        if (event.type === 'ModelPullCompleted' || event.type === 'ModelRemoved') {
          console.log(`🔄 Refreshing models list due to ${event.type}`);
          this.modelService.getModels().subscribe(models => {
            console.log(`✅ Models refreshed via event: ${models.length} models`);
            // Directly update the array to ensure UI refresh
            this.availableModels = [...models];
            this.cdr.detectChanges();
          });
        }
      });

    // Subscribe to model switching state
    this.modelService.isModelSwitching$
      .pipe(takeUntil(this.destroy$))
      .subscribe(switching => {
        this.isModelSwitching = switching;
      });

    // Subscribe to SignalR connection state
    this.signalRService.connectionState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.connectionStatus = state;
      });

    // Subscribe to model events
    this.modelService.modelEvents$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleModelEvent(event);
      });
  }

  onModelSelectionChange(modelName: string): void {
    this.selectedModelName = modelName;
  }

  async switchToSelectedModel(): Promise<void> {
    if (!this.selectedModelName || this.isModelSwitching) {
      return;
    }

    try {
      const request: ModelSwitchRequest = {
        modelName: this.selectedModelName,
        userId: this.userId,
        sessionId: this.sessionId
      };

      const response = await this.modelService.switchModel(request).toPromise();
      
      if (response && !response.success) {
        this.modelSwitchError.emit(response.message);
      }
    } catch (error) {
      console.error('Error switching model:', error);
      this.modelSwitchError.emit('Failed to switch model. Please try again.');
    }
  }

  async preloadModel(modelName: string): Promise<void> {
    try {
      await this.modelService.preloadModel(modelName).toPromise();
    } catch (error) {
      console.error('Error preloading model:', error);
    }
  }

  showModelDetails(model: OllamaModel): void {
    // Emit event or open dialog to show model details
    console.log('Show model details:', model);
  }

  showPerformanceMetrics(model: OllamaModel): void {
    // Emit event or open dialog to show performance metrics
    console.log('Show performance metrics:', model);
  }

  refreshModels(): void {
    console.log('🔄 Manual refresh triggered');
    console.log('🔄 Current availableModels:', this.availableModels.map(m => m.name));

    this.modelService.getModels().subscribe(models => {
      console.log(`✅ Models refreshed manually: ${models.length} models`);
      console.log('✅ New models from API:', models.map(m => m.name));

      // Directly update the array
      this.availableModels = [...models];

      console.log('✅ Updated availableModels:', this.availableModels.map(m => m.name));

      // Force change detection
      this.cdr.detectChanges();
      this.cdr.markForCheck();
    });
  }

  async deleteModel(event: Event, modelName: string): Promise<void> {
    // Prevent the mat-select from opening/closing
    event.stopPropagation();
    event.preventDefault();

    const model = this.availableModels.find(m => m.name === modelName);
    const displayName = model?.displayName || modelName;

    if (!confirm(`Are you sure you want to remove ${displayName}?\n\nThis will permanently delete the model from your hard drive.`)) {
      return;
    }

    try {
      console.log(`🗑️ [Dropdown] Starting deletion of ${modelName}`);
      console.log(`📋 [Dropdown] Models before deletion:`, this.availableModels.map(m => m.name));

      // IMMEDIATELY remove from UI (optimistic update)
      console.log(`⚡ [Dropdown] Immediately removing ${modelName} from UI`);
      this.availableModels = this.availableModels.filter(m => m.name !== modelName);

      // If deleted model was selected, clear selection
      if (this.selectedModelName === modelName) {
        this.selectedModelName = '';
      }

      // If deleted model was current, clear current model
      if (this.currentModel?.name === modelName) {
        this.currentModel = null;
      }

      // Force immediate UI update
      this.cdr.detectChanges();
      console.log(`✅ [Dropdown] UI updated immediately. ${this.availableModels.length} models in dropdown`);

      // Now call API to actually delete from backend
      await this.modelService.removeModel(modelName).toPromise();
      console.log(`✅ [Dropdown] Model ${modelName} deleted from backend`);

      // Check filesystem directly to get accurate list
      console.log('📂 [Dropdown] Checking filesystem for actual models...');
      const modelsOnDisk = await this.modelService.getModelsFromDisk().toPromise() || [];
      console.log(`📂 [Dropdown] Found ${modelsOnDisk.length} models on disk:`, modelsOnDisk);

      // Filter availableModels to only include models that exist on disk
      this.availableModels = this.availableModels.filter(m => modelsOnDisk.includes(m.name));
      this.cdr.detectChanges();

      console.log(`✅ [Dropdown] Final model list: ${this.availableModels.length} models`);
      console.log(`✅ [Dropdown] Remaining models:`, this.availableModels.map(m => m.name).join(', '));

      // Show success message
      alert(`✅ Successfully removed ${displayName}!\n\n${this.availableModels.length} models remaining:\n${this.availableModels.map(m => m.displayName).join('\n')}`);

    } catch (error) {
      console.error('❌ [Dropdown] Error deleting model:', error);

      // On error, reload the full list from API to restore correct state
      console.log('🔄 [Dropdown] Error occurred, reloading models from API...');
      const models = await this.modelService.getModels().toPromise() || [];
      this.availableModels = [...models];
      this.cdr.detectChanges();

      alert(`❌ Failed to remove ${displayName}.\n\nError: ${error}\n\nThe model list has been refreshed.`);
    }
  }

  getStatusIcon(status: ModelStatus): string {
    switch (status) {
      case ModelStatus.Available: return 'check_circle';
      case ModelStatus.Loading: return 'hourglass_empty';
      case ModelStatus.Running: return 'play_circle';
      case ModelStatus.Error: return 'error';
      case ModelStatus.NotInstalled: return 'cloud_download';
      default: return 'help';
    }
  }

  getStatusTooltip(status: ModelStatus): string {
    switch (status) {
      case ModelStatus.Available: return 'Model is available and ready to use';
      case ModelStatus.Loading: return 'Model is currently loading';
      case ModelStatus.Running: return 'Model is actively running';
      case ModelStatus.Error: return 'Model encountered an error';
      case ModelStatus.NotInstalled: return 'Model is not installed locally';
      default: return 'Unknown status';
    }
  }

  getConnectionIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'connected': return 'wifi';
      case 'connecting': return 'wifi_tethering';
      case 'reconnecting': return 'sync';
      case 'disconnected': return 'wifi_off';
      default: return 'signal_wifi_off';
    }
  }

  getActiveCapabilities(capabilities: ModelCapabilities): string[] {
    const active: string[] = [];
    if (capabilities.codeAnalysis) active.push('Code Analysis');
    if (capabilities.codeGeneration) active.push('Code Generation');
    if (capabilities.documentation) active.push('Documentation');
    if (capabilities.chat) active.push('Chat');
    if (capabilities.debugging) active.push('Debugging');
    if (capabilities.codeReview) active.push('Code Review');
    return active;
  }

  formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  trackByModelName(index: number, model: OllamaModel): string {
    return model.name;
  }

  private handleModelEvent(event: any): void {
    switch (event.type) {
      case 'ModelSwitched':
        console.log('Model switched:', event.data);
        break;
      case 'ModelPerformanceUpdate':
        console.log('Performance updated:', event.data);
        break;
      case 'ModelStatusChanged':
        console.log('Status changed:', event.data);
        break;
      default:
        console.log('Model event:', event);
    }
  }
}
