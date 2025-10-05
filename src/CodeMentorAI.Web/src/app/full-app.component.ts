import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SimpleOllamaChatComponent } from './components/ollama-chat/simple-ollama-chat.component';
import { ModelDownloadComponent } from './components/model-download/model-download.component';
import { CodeAnalysisComponent } from './components/code-analysis/code-analysis.component';
import { ModelDashboardComponent } from './components/model-dashboard/model-dashboard.component';
import { DocumentationComponent } from './components/documentation/documentation.component';
import { ModelService } from './services/model.service';
import { Subject, takeUntil } from 'rxjs';

interface AvailableModel {
  name: string;
  displayName: string;
  size: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, SimpleOllamaChatComponent, ModelDownloadComponent, CodeAnalysisComponent, ModelDashboardComponent, DocumentationComponent],
  providers: [ModelService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-container">
      <!-- Header -->
      <div class="app-toolbar">
        <button class="menu-button" (click)="toggleSidenav()">☰</button>
        <span class="app-title">CodeMentor AI</span>
        <span class="spacer"></span>
        <div class="user-info">👤 User</div>
      </div>

      <div class="app-content">
        <!-- Sidebar -->
        <div class="sidenav" [class.open]="sidenavOpen">
          <div class="nav-header">
            <h3>🤖 AI Assistant</h3>
            <p>{{ getSelectedModelDisplayName() }} Ready</p>
          </div>

          <!-- Model Selector -->
          <div class="model-selector-sidebar">
            <div class="model-selector-header">
              <span class="model-icon">🧠</span>
              <span>Active Model</span>
            </div>
            <div class="model-selector-content">
              <select
                [(ngModel)]="selectedModel"
                (change)="onModelChange()"
                class="model-dropdown-sidebar"
              >
                <option *ngFor="let model of availableModels; trackBy: trackByModelName" [value]="model.name">
                  {{ model.displayName }}
                </option>
              </select>
              <button (click)="refreshModels()" class="refresh-btn-sidebar" title="Refresh model list">
                🔄
              </button>
            </div>
            <div class="model-info">
              <small>{{ getSelectedModelInfo() }}</small>
            </div>
          </div>

          <!-- Navigation Menu -->
          <div class="nav-menu">
            <h4>Features</h4>
            
            <a class="nav-item" [class.active]="currentView === 'ollama-chat'" (click)="setView('ollama-chat')">
              <span class="nav-icon">💬</span>
              <span>Ollama Chat</span>
            </a>
            
            <a class="nav-item" [class.active]="currentView === 'code-analysis'" (click)="setView('code-analysis')">
              <span class="nav-icon">🔍</span>
              <span>Code Analysis</span>
            </a>
            
            <a class="nav-item" [class.active]="currentView === 'documentation'" (click)="setView('documentation')">
              <span class="nav-icon">📝</span>
              <span>Documentation</span>
            </a>

            <div class="nav-divider"></div>

            <h4>Management</h4>
            
            <a class="nav-item" [class.active]="currentView === 'model-download'" (click)="setView('model-download')">
              <span class="nav-icon">📥</span>
              <span>Download Models</span>
            </a>

            <a class="nav-item" [class.active]="currentView === 'models'" (click)="setView('models')">
              <span class="nav-icon">🧠</span>
              <span>Model Management</span>
            </a>

            <a class="nav-item" [class.active]="currentView === 'settings'" (click)="setView('settings')">
              <span class="nav-icon">⚙️</span>
              <span>Settings</span>
            </a>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content" [class.shifted]="sidenavOpen">
          <!-- Ollama Chat View -->
          <div *ngIf="currentView === 'ollama-chat'" class="view-container">
            <app-simple-ollama-chat></app-simple-ollama-chat>
          </div>

          <!-- Model Download View -->
          <div *ngIf="currentView === 'model-download'" class="view-container">
            <app-model-download></app-model-download>
          </div>

          <!-- Default Dashboard View -->
          <div *ngIf="currentView === 'dashboard'" class="view-container">
            <div class="welcome-section">
              <div class="welcome-icon">🤖</div>
              <h1>Welcome to CodeMentor AI</h1>
              <p>Select an AI model from the sidebar to get started with intelligent code assistance.</p>
              
              <div class="quick-actions">
                <div class="quick-action" (click)="setView('ollama-chat')">
                  <div class="action-icon">💬</div>
                  <h3>Interactive AI Chat</h3>
                  <p>Chat with Llama 3.2 for coding help</p>
                </div>
                
                <div class="quick-action" (click)="setView('code-analysis')">
                  <div class="action-icon">🔍</div>
                  <h3>Code Analysis & Generation</h3>
                  <p>Analyze and improve your code</p>
                </div>
                
                <div class="quick-action" (click)="setView('documentation')">
                  <div class="action-icon">📝</div>
                  <h3>Learning & Tutorials</h3>
                  <p>Learn coding with AI guidance</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Code Analysis View -->
          <div *ngIf="currentView === 'code-analysis'" class="view-container">
            <app-code-analysis></app-code-analysis>
          </div>

          <!-- Model Management View -->
          <div *ngIf="currentView === 'models'" class="view-container">
            <app-model-dashboard></app-model-dashboard>
          </div>

          <!-- Documentation View -->
          <div *ngIf="currentView === 'documentation'" class="view-container">
            <app-documentation></app-documentation>
          </div>

          <!-- Other Views (Placeholder) -->
          <div *ngIf="currentView !== 'ollama-chat' && currentView !== 'dashboard' && currentView !== 'model-download' && currentView !== 'code-analysis' && currentView !== 'models' && currentView !== 'documentation'" class="view-container">
            <div class="placeholder-view">
              <h2>{{ getViewTitle() }}</h2>
              <p>This feature is coming soon. For now, try the <strong>Ollama Chat</strong> to interact with Llama 3.2!</p>
              <button class="primary-button" (click)="setView('ollama-chat')">
                💬 Go to Ollama Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f5f5;
    }

    .app-toolbar {
      background: #1976d2;
      color: white;
      padding: 0 16px;
      height: 64px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .menu-button {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      margin-right: 16px;
    }

    .menu-button:hover {
      background: rgba(255,255,255,0.1);
    }

    .app-title {
      font-size: 20px;
      font-weight: 500;
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      font-size: 14px;
    }

    .app-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidenav {
      width: 280px;
      background: white;
      border-right: 1px solid #e0e0e0;
      transform: translateX(0);
      transition: transform 0.3s ease;
      overflow-y: auto;
      z-index: 999;
      position: fixed;
      height: calc(100vh - 64px);
      top: 64px;
      left: 0;
    }

    .sidenav.open {
      transform: translateX(0);
    }

    .nav-header {
      padding: 24px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .nav-header h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
    }

    .nav-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .model-selector-sidebar {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .model-selector-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-weight: bold;
      font-size: 14px;
    }

    .model-icon {
      font-size: 16px;
    }

    .model-selector-content {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .model-dropdown-sidebar {
      flex: 1;
      background: white;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 12px;
      min-width: 0;
    }

    .model-dropdown-sidebar:focus {
      outline: none;
      border-color: #64b5f6;
    }

    .refresh-btn-sidebar {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
      min-width: 32px;
    }

    .refresh-btn-sidebar:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .model-info {
      font-size: 11px;
      opacity: 0.7;
      text-align: center;
    }

    .nav-menu {
      padding: 16px 0;
    }

    .nav-menu h4 {
      padding: 8px 20px;
      margin: 16px 0 8px 0;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #333;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .nav-item:hover {
      background: #f5f5f5;
    }

    .nav-item.active {
      background: #e3f2fd;
      color: #1976d2;
      border-right: 3px solid #1976d2;
    }

    .nav-icon {
      margin-right: 12px;
      font-size: 16px;
    }

    .nav-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 16px 0;
    }

    .main-content {
      flex: 1;
      overflow: auto;
      margin-left: 280px;
      transition: margin-left 0.3s ease;
      height: calc(100vh - 60px);
    }

    .main-content.shifted {
      margin-left: 280px;
    }

    .view-container {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
    }

    .welcome-section {
      text-align: center;
      padding: 40px 20px;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 120px);
      background: #f8f9fa;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .welcome-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .welcome-section h1 {
      color: #333;
      margin-bottom: 16px;
      font-size: 32px;
    }

    .welcome-section p {
      color: #666;
      font-size: 18px;
      margin-bottom: 40px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-top: 40px;
    }

    .quick-action {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .quick-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .action-icon {
      font-size: 32px;
      margin-bottom: 16px;
    }

    .quick-action h3 {
      color: #333;
      margin-bottom: 8px;
      font-size: 18px;
    }

    .quick-action p {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    .placeholder-view {
      text-align: center;
      padding: 60px 20px;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 120px);
      background: #f8f9fa;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .placeholder-view h2 {
      color: #333;
      margin-bottom: 16px;
    }

    .placeholder-view p {
      color: #666;
      margin-bottom: 32px;
      font-size: 16px;
    }

    .primary-button {
      background: #1976d2;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .primary-button:hover {
      background: #1565c0;
    }

    @media (max-width: 768px) {
      .sidenav {
        position: fixed;
        height: 100%;
        z-index: 1001;
      }

      .main-content.shifted {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'CodeMentor AI';
  sidenavOpen = true;
  currentView = 'dashboard';

  // Model switching properties
  selectedModel = 'llama3.2:latest';
  availableModels: AvailableModel[] = [
    { name: 'llama3.2:latest', displayName: 'Llama 3.2', size: '2.0 GB' },
    { name: 'codellama:latest', displayName: 'CodeLlama', size: '3.8 GB' },
    { name: 'mistral:latest', displayName: 'Mistral', size: '4.1 GB' },
    { name: 'phi3:latest', displayName: 'Phi-3', size: '2.3 GB' }
  ];

  private destroy$ = new Subject<void>();
  private modelService = inject(ModelService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    (window as any).currentSelectedModel = this.selectedModel;

    window.addEventListener('requestCurrentModel', () => {
      const event = new CustomEvent('modelChanged', {
        detail: {
          selectedModel: this.selectedModel,
          displayName: this.getSelectedModelDisplayName()
        }
      });
      window.dispatchEvent(event);
    });
  }

  ngOnInit() {
    this.modelService.models$
      .pipe(takeUntil(this.destroy$))
      .subscribe(models => {
        this.availableModels = models.map(model => ({
          name: model.name,
          displayName: this.formatModelName(model.name),
          size: this.formatSize(model.size)
        }));

        if (!this.availableModels.find(m => m.name === this.selectedModel)) {
          this.selectedModel = this.availableModels[0]?.name || 'llama3.2:latest';
        }

        this.cdr.markForCheck();
      });

    this.loadAvailableModels();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadAvailableModels() {
    this.modelService.getModels().subscribe();
  }

  formatModelName(modelName: string): string {
    // Convert model names to display names
    const nameMap: { [key: string]: string } = {
      'llama3.2:latest': 'Llama 3.2',
      'llama3.2': 'Llama 3.2',
      'codellama:latest': 'CodeLlama',
      'codellama': 'CodeLlama',
      'mistral:latest': 'Mistral',
      'mistral': 'Mistral',
      'phi3:latest': 'Phi-3',
      'phi3': 'Phi-3',
      'deepseek-r1:latest': 'Deepseek-R1',
      'deepseek-r1': 'Deepseek-R1',
      'deepseek-r1:14b': 'Deepseek-R1 14B',
      'deepseek-coder:latest': 'Deepseek Coder',
      'deepseek-coder': 'Deepseek Coder'
    };

    if (nameMap[modelName]) {
      return nameMap[modelName];
    }

    // Handle special cases for formatting
    const baseName = modelName.split(':')[0];
    if (baseName.includes('deepseek')) {
      return baseName.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }

    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
  }

  formatSize(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  }

  getSelectedModelInfo(): string {
    const model = this.availableModels.find(m => m.name === this.selectedModel);
    return model ? `${model.size}` : 'Unknown';
  }

  onModelChange() {
    console.log(`🔄 Global model changed to: ${this.selectedModel}`);
    console.log(`🎯 Display name: ${this.getSelectedModelDisplayName()}`);

    // Update global model state
    (window as any).currentSelectedModel = this.selectedModel;

    // Broadcast model change to chat component if it exists
    const event = new CustomEvent('modelChanged', {
      detail: {
        selectedModel: this.selectedModel,
        displayName: this.getSelectedModelDisplayName()
      }
    });
    window.dispatchEvent(event);
  }

  getSelectedModelDisplayName(): string {
    const model = this.availableModels.find(m => m.name === this.selectedModel);
    return model ? model.displayName : 'AI Assistant';
  }

  async refreshModels() {
    console.log('🔄 Manually refreshing models...');
    this.modelService.refreshModels().subscribe();
  }

  toggleSidenav() {
    this.sidenavOpen = !this.sidenavOpen;
  }

  setView(view: string) {
    this.currentView = view;

    if (window.innerWidth <= 768) {
      this.sidenavOpen = false;
    }
  }

  getViewTitle(): string {
    const titles: { [key: string]: string } = {
      'code-analysis': '🔍 Code Analysis & Generation',
      'documentation': '📝 Documentation Generator',
      'model-download': '📥 Download Models',
      'models': '🧠 Model Management',
      'settings': '⚙️ Settings'
    };
    return titles[this.currentView] || 'Feature';
  }

  // TrackBy function for performance optimization
  trackByModelName(index: number, model: AvailableModel): string {
    return model.name;
  }
}
