import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ModelService } from '../../services/model.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-model-dashboard',
  standalone: true,
  imports: [CommonModule, ConfirmationDialogComponent],
  template: `
    <div class="model-management-container">
      <div class="header">
        <h2>✅ Installed Models</h2>
        <p>Manage your downloaded Ollama models</p>
      </div>

      <!-- Installed Models -->
      <div class="installed-section">
        <div *ngIf="installedModels.length === 0" class="no-models">
          <p>No models installed yet. Download some models from the Download Models page!</p>
        </div>
        <div *ngFor="let model of installedModels" class="installed-model">
          <div class="installed-info">
            <span class="installed-name">{{ model.name }}</span>
            <span class="installed-size">{{ formatSize(model.size) }}</span>
          </div>
          <button (click)="showDeleteConfirmation(model.name)" class="delete-btn">🗑️ Remove</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <app-confirmation-dialog
      [isOpen]="showDialog"
      [title]="'Delete Model'"
      [message]="'Are you sure you want to remove ' + modelToDelete + '?'"
      [subMessage]="'This will permanently delete the model from your hard drive.'"
      [confirmText]="'Delete'"
      [cancelText]="'Cancel'"
      (confirmed)="confirmDelete()"
      (cancelled)="cancelDelete()">
    </app-confirmation-dialog>
  `,
  styles: [`
    .model-management-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .header h2 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
      font-size: 1.1rem;
    }

    .installed-section {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .installed-section h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .no-models {
      text-align: center;
      padding: 40px 20px;
      color: #999;
      font-size: 1.1rem;
    }

    .installed-model {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 12px;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .installed-model:hover {
      background: #f5f5f5;
      border-color: #d0d0d0;
      transform: translateX(5px);
    }

    .installed-model:last-child {
      margin-bottom: 0;
    }

    .installed-info {
      display: flex;
      align-items: center;
      gap: 20px;
      flex: 1;
    }

    .installed-name {
      font-weight: 600;
      color: #333;
      font-size: 1.1rem;
    }

    .installed-size {
      color: #666;
      font-size: 0.95rem;
      background: #e3f2fd;
      padding: 4px 12px;
      border-radius: 12px;
    }

    .delete-btn {
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .delete-btn:hover {
      background: #d32f2f;
      transform: scale(1.05);
    }

    .delete-btn:active {
      transform: scale(0.98);
    }

    .delete-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class ModelDashboardComponent implements OnInit {
  installedModels: any[] = [];
  showDialog = false;
  modelToDelete = '';

  constructor(
    private http: HttpClient,
    private modelService: ModelService
  ) {}

  ngOnInit(): void {
    this.loadInstalledModels();
  }

  async loadInstalledModels() {
    try {
      const response: any = await this.http.get('http://localhost:5000/api/models').toPromise();

      if (Array.isArray(response)) {
        this.installedModels = response;
      } else if (response && response.models) {
        this.installedModels = response.models;
      } else {
        this.installedModels = [];
      }
    } catch (error) {
      this.installedModels = [];
    }
  }

  showDeleteConfirmation(modelName: string) {
    this.modelToDelete = modelName;
    this.showDialog = true;
  }

  cancelDelete() {
    this.showDialog = false;
    this.modelToDelete = '';
  }

  async confirmDelete() {
    this.showDialog = false;

    if (!this.modelToDelete) return;

    try {
      this.installedModels = this.installedModels.filter((m: any) => m.name !== this.modelToDelete);
      await this.modelService.removeModel(this.modelToDelete).toPromise();
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.loadInstalledModels();
    } catch (error: any) {
      await this.loadInstalledModels();
    } finally {
      this.modelToDelete = '';
    }
  }

  formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
