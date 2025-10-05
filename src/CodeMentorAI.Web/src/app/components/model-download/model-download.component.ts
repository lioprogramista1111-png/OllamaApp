import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModelService } from '../../services/model.service';

interface OllamaModel {
  name: string;
  description: string;
  size: string;
  tags: string[];
  popular: boolean;
}

interface DownloadProgress {
  modelName: string;
  status: 'downloading' | 'completed' | 'error';
  progress: number;
  message: string;
}

@Component({
  selector: 'app-model-download',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="model-download-container">
      <div class="header">
        <h2>🧠 Download Ollama Models</h2>
        <p>Browse and download AI models for your local Ollama instance</p>
      </div>

      <!-- URL Download -->
      <div class="url-download-section">
        <h3>🔗 Download from Ollama URL</h3>
        <p class="url-description">Paste any Ollama model URL to download it directly</p>

        <div class="url-input-container">
          <input
            type="text"
            [(ngModel)]="ollamaUrl"
            placeholder="Paste Ollama URL (e.g., https://ollama.com/library/gemma3:27b)"
            class="url-model-input"
            [disabled]="isDownloading"
          >
          <button
            (click)="downloadFromUrl()"
            [disabled]="!ollamaUrl.trim() || isDownloading"
            class="download-btn url"
          >
            <span *ngIf="!isDownloading">🔗 Download from URL</span>
            <span *ngIf="isDownloading" class="downloading-content">
              <span class="download-spinner"></span>
              Downloading...
            </span>
          </button>
        </div>
      </div>

      <!-- Download Progress -->
      <div *ngIf="downloadProgress.length > 0" class="progress-section">
        <h3>📊 Download Progress</h3>
        <div *ngFor="let progress of downloadProgress; trackBy: trackByProgressModelName" class="progress-item">
          <div class="progress-header">
            <span class="progress-model-name">{{ progress.modelName }}</span>
            <span class="progress-percentage">{{ progress.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="progress.progress"
              [class]="progress.status"
            ></div>
          </div>
          <div class="progress-message">{{ progress.message }}</div>
        </div>
      </div>

      <!-- Popular Models -->
      <div class="models-grid">
        <div *ngFor="let model of popularModels; trackBy: trackByModelName" class="model-card">
          <div class="model-header">
            <h3>{{ model.name }}</h3>
            <span class="model-size">{{ model.size }}</span>
          </div>
          
          <p class="model-description">{{ model.description }}</p>
          
          <div class="model-tags">
            <span *ngFor="let tag of model.tags; trackBy: trackByTag" class="tag">{{ tag }}</span>
          </div>
          
          <div class="model-actions">
            <button
              (click)="downloadModel(model.name)"
              [disabled]="isModelDownloading(model.name)"
              class="download-btn"
            >
              <span *ngIf="!isModelDownloading(model.name)">📥 Download</span>
              <span *ngIf="isModelDownloading(model.name)" class="downloading-content">
                <span class="download-spinner"></span>
                Downloading...
              </span>
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .model-download-container {
      padding: 24px;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 48px);
      background: #f8f9fa;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h2 {
      color: #333;
      margin-bottom: 8px;
      font-size: 28px;
    }

    .header p {
      color: #666;
      font-size: 16px;
    }

    .url-download-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }

    .url-download-section h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 20px;
    }

    .url-description {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .url-input-container {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .url-model-input {
      flex: 1;
      padding: 14px 18px;
      border: 2px solid #ddd;
      border-radius: 10px;
      font-size: 14px;
      font-family: monospace;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .url-model-input:focus {
      outline: none;
      border-color: #007bff;
      background: white;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .url-model-input:disabled {
      background: #f5f5f5;
      color: #999;
      cursor: not-allowed;
    }

    .download-progress-container {
      margin-top: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border-left: 4px solid #007bff;
    }

    .download-status {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      color: #333;
    }

    .download-icon {
      font-size: 20px;
    }

    .download-text {
      flex: 1;
      font-size: 16px;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e3e3e3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .progress-details {
      margin-left: 32px;
    }

    .progress-details p {
      margin: 4px 0;
      color: #666;
      font-size: 14px;
    }

    .downloading-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .download-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .download-btn:disabled .download-spinner {
      border: 2px solid rgba(0, 0, 0, 0.3);
      border-top: 2px solid #666;
    }

    .download-btn {
      padding: 12px 20px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s;
    }

    .download-btn:hover:not(:disabled) {
      background: #45a049;
    }

    .download-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .download-btn.custom {
      background: #ff9800;
    }

    .download-btn.custom:hover:not(:disabled) {
      background: #f57c00;
    }

    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .model-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .model-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .model-header h3 {
      color: #333;
      margin: 0;
      font-size: 18px;
    }

    .model-size {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .model-description {
      color: #666;
      margin-bottom: 15px;
      line-height: 1.4;
    }

    .model-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 15px;
    }

    .tag {
      background: #f5f5f5;
      color: #666;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }

    .progress-section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .progress-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }

    .progress-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-model-name {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .progress-percentage {
      font-weight: 600;
      color: #007bff;
      font-size: 14px;
    }

    .progress-message {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
      font-style: italic;
    }

    .progress-status.downloading {
      color: #ff9800;
    }

    .progress-status.completed {
      color: #4caf50;
    }

    .progress-status.error {
      color: #f44336;
    }

    .progress-bar {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 5px;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .progress-fill.downloading {
      background: #ff9800;
    }

    .progress-fill.completed {
      background: #4caf50;
    }

    .progress-fill.error {
      background: #f44336;
    }

    .progress-message {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class ModelDownloadComponent {
  ollamaUrl = ''; // URL property for Ollama downloads
  isDownloading = false;
  currentDownloadModel = ''; // Track currently downloading model
  downloadProgress: DownloadProgress[] = [];

  popularModels: OllamaModel[] = [
    {
      name: 'llama3.2',
      description: 'Meta\'s latest Llama model with improved reasoning and code generation capabilities.',
      size: '2.0 GB',
      tags: ['general', 'chat', 'reasoning'],
      popular: true
    },
    {
      name: 'codellama',
      description: 'Specialized for code generation, debugging, and programming assistance.',
      size: '3.8 GB',
      tags: ['code', 'programming', 'debugging'],
      popular: true
    },
    {
      name: 'mistral',
      description: 'High-performance model with excellent instruction following.',
      size: '4.1 GB',
      tags: ['general', 'chat', 'instruction'],
      popular: true
    },
    {
      name: 'phi3',
      description: 'Microsoft\'s efficient small language model with strong performance.',
      size: '2.3 GB',
      tags: ['general', 'efficient', 'microsoft'],
      popular: false
    }
  ];

  constructor(
    private http: HttpClient,
    private modelService: ModelService,
    private cdr: ChangeDetectorRef
  ) {
    // Listen to real-time progress updates
    this.modelService.modelEvents$.subscribe(event => {
      if (event.type === 'ModelPullProgress') {
        const modelName = event.data.modelName || event.data.ModelName;
        const status = event.data.status || event.data.Status;

        const progress = this.downloadProgress.find(p =>
          p.modelName === modelName && p.status === 'downloading'
        );

        if (progress) {
          // Parse Ollama progress status
          try {
            const statusData = JSON.parse(status);
            if (statusData.total && statusData.completed) {
              const percentage = Math.round((statusData.completed / statusData.total) * 100);
              progress.progress = percentage;
              progress.message = statusData.status || 'Downloading...';
            } else if (statusData.status) {
              progress.message = statusData.status;
            }
          } catch {
            // If not JSON, just use the status as message
            progress.message = status;
          }

          this.cdr.markForCheck();
        }
      }

      if (event.type === 'ModelPullCompleted') {
        const success = event.data.success || event.data.Success;
        const modelName = event.data.modelName || event.data.ModelName;

        const progress = this.downloadProgress.find(p =>
          p.modelName === modelName && p.status === 'downloading'
        );

        if (progress) {
          if (success) {
            progress.status = 'completed';
            progress.progress = 100;
            progress.message = 'Download completed successfully!';

            // Hide progress bar and re-enable button after delay
            setTimeout(() => {
              this.downloadProgress = this.downloadProgress.filter(p => p.modelName !== modelName);

              // Re-enable the download button if this was from URL download
              if (this.currentDownloadModel === modelName) {
                this.isDownloading = false;
                this.currentDownloadModel = '';
              }
            }, 2000);
          } else {
            progress.status = 'error';
            progress.message = 'Download failed!';

            // Re-enable button on error
            if (this.currentDownloadModel === modelName) {
              this.isDownloading = false;
              this.currentDownloadModel = '';
            }
          }

          this.modelService.getModels().subscribe();
          this.cdr.markForCheck();
        }
      }
    });
  }

  async downloadModel(modelName: string) {
    // Check if already downloading
    if (this.downloadProgress.some(p => p.modelName === modelName && p.status === 'downloading')) {
      console.log(`Model ${modelName} is already downloading`);
      return;
    }

    const progress: DownloadProgress = {
      modelName,
      status: 'downloading',
      progress: 0,
      message: 'Initializing download...'
    };

    this.downloadProgress.push(progress);

    try {
      const response = await fetch(`http://localhost:5000/api/models/${modelName}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Backend API not available');
      }

      // Progress updates will come via SignalR events
      // No need to simulate - real progress will be received
    } catch (error) {
      console.error('Failed to start download:', error);
      progress.status = 'error';
      progress.message = 'Failed to start download';

      // Re-enable button on error
      if (this.currentDownloadModel === modelName) {
        this.isDownloading = false;
        this.currentDownloadModel = '';
      }
    }
  }



  async downloadFromUrl() {
    if (!this.ollamaUrl.trim()) return;

    const modelName = this.extractModelNameFromUrl(this.ollamaUrl.trim());
    if (!modelName) {
      return;
    }

    this.isDownloading = true;
    this.currentDownloadModel = modelName;

    await this.downloadModel(modelName);

    // Clear the URL input
    this.ollamaUrl = '';

    // Don't reset isDownloading and currentDownloadModel here
    // They will be reset when ModelPullCompleted event is received
  }

  extractModelNameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      if (!urlObj.hostname.includes('ollama.com')) {
        return null;
      }

      let path = urlObj.pathname.replace(/^\//, '');

      if (path.startsWith('library/')) {
        path = path.replace('library/', '');
      }

      if (path && path.length > 0) {
        return path;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  isModelDownloading(modelName: string): boolean {
    return this.downloadProgress.some(p => p.modelName === modelName && p.status === 'downloading');
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'downloading': return '⏳ Downloading';
      case 'completed': return '✅ Completed';
      case 'error': return '❌ Error';
      default: return status;
    }
  }

  // TrackBy functions for performance optimization
  trackByModelName(index: number, model: OllamaModel): string {
    return model.name;
  }

  trackByProgressModelName(index: number, progress: DownloadProgress): string {
    return progress.modelName;
  }

  trackByTag(index: number, tag: string): string {
    return tag;
  }
}
