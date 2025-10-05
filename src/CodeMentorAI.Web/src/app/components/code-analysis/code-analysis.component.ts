import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ModelService } from '../../services/model.service';
import { ModelFormatterService } from '../../services/model-formatter.service';

interface AnalysisResult {
  feedback?: string;
  summary?: string;
  details?: string;
  suggestions: string[];
  codeQuality?: number;
  timestamp?: Date;
  language?: string;
  modelUsed?: string;
  detectedLanguage?: string;
  languageMismatch?: boolean;
}

interface AvailableModel {
  name: string;
  displayName: string;
  size: string;
}

@Component({
  selector: 'app-code-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-analysis-container">
      <div class="header">
        <h2>🔍 Code Analysis & Feedback</h2>
        <p>Paste your code below and get intelligent feedback from AI</p>
      </div>

      <div class="analysis-section">
        <div class="input-section">
          <div class="input-header">
            <div class="header-left">
              <h3>📝 Your Code</h3>
              <p class="auto-detect-hint">Language will be automatically detected</p>
            </div>
            <div class="model-info-badge">
              <span class="model-icon">🤖</span>
              <span class="model-name">{{ currentModelDisplayName }}</span>
            </div>
          </div>
          
          <div class="textarea-wrapper">
            <textarea
              [(ngModel)]="codeInput"
              placeholder="Paste your code here... (supports large code snippets)"
              class="code-textarea"
              [disabled]="isAnalyzing"
            ></textarea>
          </div>
          
          <div class="analysis-options">
            <div class="option-group">
              <h4>🎯 Analysis Focus (Select One):</h4>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="codeQuality" [(ngModel)]="selectedFocus" />
                <span class="radio-text">🏗️ Code Quality & Best Practices</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="performance" [(ngModel)]="selectedFocus" />
                <span class="radio-text">⚡ Performance Optimization</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="security" [(ngModel)]="selectedFocus" />
                <span class="radio-text">🔒 Security Issues</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="bugs" [(ngModel)]="selectedFocus" />
                <span class="radio-text">🐛 Bug Detection</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="refactoring" [(ngModel)]="selectedFocus" />
                <span class="radio-text">🔧 Refactoring Suggestions</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="analysisFocus" value="explain" [(ngModel)]="selectedFocus" />
                <span class="radio-text">📖 Explain the Code</span>
              </label>
            </div>
          </div>
          
          <button 
            (click)="analyzeCode()" 
            [disabled]="!codeInput.trim() || isAnalyzing"
            class="analyze-btn"
          >
            <span *ngIf="!isAnalyzing">🔍 Analyze Code</span>
            <span *ngIf="isAnalyzing" class="analyzing-content">
              <span class="analysis-spinner"></span>
              Analyzing...
            </span>
          </button>
        </div>

        <div class="results-section" *ngIf="analysisResult || isAnalyzing">
          <div class="results-header">
            <h3>📊 Analysis Results</h3>
          </div>
          
          <!-- Loading State -->
          <div *ngIf="isAnalyzing" class="analysis-loading">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <p>🤖 Ollama AI is analyzing your code...</p>
              <small>Using real AI model - this may take a moment for large code snippets</small>
            </div>
          </div>
          
          <!-- Results -->
          <div *ngIf="analysisResult && !isAnalyzing" class="analysis-results">
            <div class="model-info" *ngIf="analysisResult.modelUsed">
              <small>🤖 Analyzed by: <strong>{{ analysisResult.modelUsed }}</strong></small>
            </div>

            <!-- Detected Language Info -->
            <div *ngIf="analysisResult.detectedLanguage" class="language-info">
              <small>🔍 Detected Language: <strong>{{ analysisResult.detectedLanguage }}</strong></small>
            </div>

            <!-- For Explain mode -->
            <div class="feedback-section" *ngIf="analysisResult.summary">
              <h4>{{ analysisResult.summary }}</h4>
              <div class="feedback-content">
                {{ displayedDetails || analysisResult.details }}
                <span *ngIf="isTyping" class="typing-cursor">▋</span>
              </div>
            </div>

            <!-- For regular analysis mode -->
            <div class="feedback-section" *ngIf="analysisResult.feedback">
              <h4>💬 AI Feedback</h4>
              <div class="feedback-content">
                {{ displayedFeedback || analysisResult.feedback }}
                <span *ngIf="isTyping" class="typing-cursor">▋</span>
              </div>
            </div>

            <div class="suggestions-section" *ngIf="analysisResult.suggestions && analysisResult.suggestions.length > 0">
              <h4>💡 Suggestions</h4>
              <ul class="suggestions-list">
                <li *ngFor="let suggestion of analysisResult.suggestions">{{ suggestion }}</li>
              </ul>
            </div>

            <div class="quality-score" *ngIf="analysisResult.codeQuality && analysisResult.codeQuality > 0">
              <h4>⭐ Code Quality Score</h4>
              <div class="score-display">
                <div class="score-bar">
                  <div class="score-fill" [style.width.%]="analysisResult.codeQuality"></div>
                </div>
                <span class="score-text">{{ analysisResult.codeQuality }}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .code-analysis-container {
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
      margin-bottom: 32px;
    }

    .header h2 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 28px;
    }

    .header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .analysis-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
      min-height: 600px;
      margin-bottom: 24px;
      overflow: hidden;
      box-sizing: border-box;
    }

    .input-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      height: fit-content;
      min-height: 600px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
    }

    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 16px;
    }

    .header-left {
      flex: 1;
    }

    .header-left h3 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .auto-detect-hint {
      margin: 0;
      color: #666;
      font-size: 13px;
      font-style: italic;
    }

    .model-info-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      white-space: nowrap;
    }

    .model-icon {
      font-size: 16px;
    }

    .model-name {
      color: white;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .language-info {
      padding: 8px 12px;
      background: #e3f2fd;
      border-left: 3px solid #2196F3;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .language-info small {
      color: #1976D2;
      font-size: 13px;
    }

    .textarea-wrapper {
      margin: 16px 0;
      width: 100%;
      box-sizing: border-box;
    }

    .code-textarea {
      width: 100%;
      height: 350px;
      padding: 16px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
      transition: border-color 0.3s;
      box-sizing: border-box;
      margin: 0;
    }

    .code-textarea:focus {
      outline: none;
      border-color: #007bff;
    }

    .code-textarea:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    .analysis-options {
      margin: 20px 0;
      flex-shrink: 0;
    }

    .option-group h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 16px;
    }

    .radio-label {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      transition: all 0.2s ease;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: #f8f9fa;
    }

    .radio-label:hover {
      background-color: #e3f2fd;
      border-color: #2196f3;
      transform: translateY(-1px);
    }

    .radio-label input[type="radio"] {
      margin-right: 12px;
      transform: scale(1.2);
      accent-color: #2196f3;
    }

    .radio-label input[type="radio"]:checked + .radio-text {
      color: #2196f3;
      font-weight: 600;
    }

    .radio-text {
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .analyze-btn {
      width: 100%;
      padding: 14px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    .analyze-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .analyze-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .analyzing-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .analysis-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .results-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      height: fit-content;
      min-height: 600px;
      margin-top: 24px;
    }

    .results-header h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .analysis-loading {
      text-align: center;
      padding: 40px 20px;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e3e3e3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .model-info {
      margin-bottom: 16px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 6px;
      border-left: 3px solid #2196f3;
    }

    .model-info small {
      color: #1565c0;
      font-size: 13px;
    }



    .feedback-section {
      margin-bottom: 24px;
    }

    .feedback-section h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .feedback-content {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #007bff;
      line-height: 1.6;
      white-space: pre-wrap;
      position: relative;
    }

    .typing-cursor {
      display: inline-block;
      color: #007bff;
      animation: blink 1s step-end infinite;
      margin-left: 2px;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .suggestions-section {
      margin-bottom: 24px;
    }

    .suggestions-section h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 20px;
    }

    .suggestions-list li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .quality-score h4 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .score-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .score-bar {
      flex: 1;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
      transition: width 0.5s ease;
    }

    .score-text {
      font-weight: 600;
      color: #333;
    }

    @media (max-width: 768px) {
      .analysis-section {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .code-textarea {
        height: 300px;
      }

      .input-section, .results-section {
        min-height: auto;
      }
    }
  `]
})
export class CodeAnalysisComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly modelService = inject(ModelService);
  private readonly modelFormatter = inject(ModelFormatterService);
  private readonly destroy$ = new Subject<void>();
  private readonly analysisCache = new Map<string, AnalysisResult>();
  private modelChangeListener: any;

  codeInput = '';
  isAnalyzing = false;
  analysisResult: AnalysisResult | null = null;
  isTyping = false;
  displayedFeedback = '';
  displayedDetails = '';

  selectedFocus: string = 'codeQuality'; // Default to code quality
  selectedModel = 'codellama:latest'; // Default to CodeLlama for code analysis
  currentModelDisplayName = 'CodeLlama';
  availableModels: AvailableModel[] = [
    { name: 'codellama:latest', displayName: 'CodeLlama', size: '3.8 GB' },
    { name: 'llama3.2:latest', displayName: 'Llama 3.2', size: '2.0 GB' },
    { name: 'mistral:latest', displayName: 'Mistral', size: '4.1 GB' },
    { name: 'deepseek-coder:latest', displayName: 'DeepSeek Coder', size: '6.7 GB' },
    { name: 'qwen2.5-coder:7b', displayName: 'Qwen 2.5 Coder', size: '4.7 GB' }
  ];

  ngOnInit(): void {
    this.loadAvailableModels();

    // Listen for model changes from sidebar - store reference for cleanup
    this.modelChangeListener = (event: any) => {
      console.log('🔄 Code Analysis component received model change:', event.detail);
      this.selectedModel = event.detail.selectedModel;
      this.currentModelDisplayName = event.detail.displayName;

      // Update the available models to include the new selection
      const existingModel = this.availableModels.find(m => m.name === this.selectedModel);
      if (!existingModel) {
        this.availableModels.push({
          name: this.selectedModel,
          displayName: event.detail.displayName,
          size: 'Unknown'
        });
      } else {
        existingModel.displayName = event.detail.displayName;
      }

      console.log('🎯 Code Analysis updated selectedModel to:', this.selectedModel);
      console.log('🎯 Code Analysis updated currentModelDisplayName to:', this.currentModelDisplayName);

      this.onModelChange();
      this.cdr.markForCheck();
    };

    window.addEventListener('modelChanged', this.modelChangeListener);

    // Try to get the current model from the parent component
    try {
      const event = new CustomEvent('requestCurrentModel');
      window.dispatchEvent(event);

      const globalModel = (window as any).currentSelectedModel;
      if (globalModel) {
        this.selectedModel = globalModel;
      }
    } catch (error) {
      // Use default model
    }
  }

  ngOnDestroy(): void {
    // Remove event listener
    if (this.modelChangeListener) {
      window.removeEventListener('modelChanged', this.modelChangeListener);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadAvailableModels() {
    try {
      const models = await this.modelService.getModels().pipe(
        takeUntil(this.destroy$)
      ).toPromise();

      if (models && models.length > 0) {
        this.availableModels = models.map(model => ({
          name: model.name,
          displayName: this.modelFormatter.formatModelName(model.name),
          size: this.modelFormatter.formatSize(model.size)
        }));

        // Set default model if current selection is not available
        if (!this.availableModels.find(m => m.name === this.selectedModel)) {
          // Prefer code-focused models for analysis
          const codeModel = this.availableModels.find(m =>
            m.name.includes('codellama') ||
            m.name.includes('coder') ||
            m.name.includes('deepseek')
          );
          this.selectedModel = codeModel?.name || this.availableModels[0]?.name || 'llama3.2:latest';
        }

        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Keep default models
    }
  }

  getModelDisplayName(): string {
    const model = this.availableModels.find(m => m.name === this.selectedModel);
    if (model) {
      return model.displayName;
    }

    if (this.selectedModel) {
      const formatted = this.modelFormatter.formatModelName(this.selectedModel);
      return formatted;
    }

    return 'AI Assistant';
  }

  onModelChange() {
    this.currentModelDisplayName = this.getModelDisplayName();
    console.log('🔄 Model changed to:', this.selectedModel, '(' + this.currentModelDisplayName + ')');

    // Clear cache when model changes since different models may give different results
    this.analysisCache.clear();
    this.cdr.markForCheck();
  }

  async typeText(text: string, target: 'feedback' | 'details', speed: number = 15): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      this.isTyping = true;

      const typeChar = () => {
        if (index < text.length) {
          if (target === 'feedback') {
            this.displayedFeedback += text[index];
          } else {
            this.displayedDetails += text[index];
          }
          index++;
          this.cdr.markForCheck();
          setTimeout(typeChar, speed);
        } else {
          this.isTyping = false;
          this.cdr.markForCheck();
          resolve();
        }
      };

      typeChar();
    });
  }

  async analyzeCode() {
    if (!this.codeInput.trim()) return;

    // Create cache key for this analysis (without language since it's auto-detected)
    const cacheKey = `${this.codeInput.slice(0, 100)}_${this.selectedFocus}`;

    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      console.log('🚀 Cache hit! Using cached analysis result');
      this.analysisResult = this.analysisCache.get(cacheKey)!;
      // For cached results, show immediately without typing animation
      this.displayedFeedback = this.analysisResult.feedback || '';
      this.displayedDetails = this.analysisResult.details || '';
      this.cdr.markForCheck();
      return;
    }

    this.isAnalyzing = true;
    this.analysisResult = null;
    this.displayedFeedback = '';
    this.displayedDetails = '';
    this.cdr.markForCheck();

    try {
      console.log('🔍 Starting code analysis...');
      console.log(`🎯 Focus: ${this.selectedFocus}`);
      console.log(`📄 Code length: ${this.codeInput.length} characters`);

      // Convert single focus to options object for analysis
      const options = {
        codeQuality: this.selectedFocus === 'codeQuality',
        performance: this.selectedFocus === 'performance',
        security: this.selectedFocus === 'security',
        bugs: this.selectedFocus === 'bugs',
        refactoring: this.selectedFocus === 'refactoring',
        explain: this.selectedFocus === 'explain'
      };

      // Call the backend API with real Ollama model using RxJS for better performance
      // Language is auto-detected by the backend
      const response = await this.http.post<AnalysisResult>('http://localhost:5000/api/codeanalysis', {
        code: this.codeInput,
        language: 'auto', // Backend will auto-detect the language
        model: this.selectedModel, // Use selected model
        options: options
      }).pipe(
        takeUntil(this.destroy$)
      ).toPromise();

      if (response) {
        this.analysisResult = response;

        // Stop analyzing state and start typing animation
        this.isAnalyzing = false;
        this.cdr.markForCheck();

        // Type the feedback with animation
        if (response.feedback) {
          await this.typeText(response.feedback, 'feedback', 10);
        }

        // Cache the result (limit cache size to prevent memory leaks)
        if (this.analysisCache.size >= 50) {
          const firstKey = this.analysisCache.keys().next().value;
          this.analysisCache.delete(firstKey);
        }
        this.analysisCache.set(cacheKey, response);

        console.log('✅ Analysis completed successfully with model:', response.modelUsed);
        console.log('📊 Quality Score:', response.codeQuality);
        console.log('💡 Suggestions:', response.suggestions?.length || 0);
      } else {
        throw new Error('No response received from backend');
      }

    } catch (error: any) {
      console.error('❌ Failed to get analysis from Ollama model:', error);

      // Extract error message and details
      const errorMessage = error?.error?.message || error?.message || error?.statusText || 'Unknown error';
      const errorReason = error?.error?.reason || '';
      const errorSuggestion = error?.error?.suggestion || '';

      // Check if it's a validation error (not valid code)
      if (errorMessage.includes('does not appear to be code') || error?.status === 400) {
        this.analysisResult = {
          feedback: `⚠️ **Invalid Input**\n\n${errorMessage}\n\n${errorReason ? `**Reason:** ${errorReason}\n\n` : ''}${errorSuggestion || 'Please provide actual source code for analysis.'}`,
          suggestions: [
            'Make sure you paste actual source code (not plain text)',
            'Code should contain programming syntax (functions, variables, etc.)',
            'Try pasting a complete code snippet with proper structure',
            'Examples: JavaScript functions, Python classes, C# methods, etc.'
          ],
          codeQuality: 0,
          timestamp: new Date(),
          modelUsed: 'Validation Failed'
        };
      } else {
        // Other errors (connection, model issues, etc.)
        this.analysisResult = {
          feedback: `❌ **Analysis Failed**\n\nUnable to connect to the Ollama model for code analysis. Please ensure:\n\n1. Ollama is running (http://localhost:11434)\n2. Backend API is running (http://localhost:5000)\n3. A compatible model is installed (e.g., llama3.2, codellama)\n\nError Details: ${errorMessage}`,
          suggestions: [
            'Check if Ollama Desktop is running',
            'Verify the backend API is accessible',
            'Ensure you have downloaded a compatible AI model',
            'Try refreshing the page and attempting again',
            'Check browser console for detailed error information'
          ],
          codeQuality: 0,
          timestamp: new Date(),
          modelUsed: 'Error - No Model Available'
        };
      }
      this.cdr.markForCheck();
    }

    this.isAnalyzing = false;
    this.cdr.markForCheck();
  }


}
