import { Component, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

interface AnalysisResult {
  feedback: string;
  suggestions: string[];
  codeQuality: number;
  timestamp: Date;
  language?: string;
  modelUsed?: string;
  detectedLanguage?: string;
  languageMismatch?: boolean;
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
            <h3>📝 Your Code</h3>
            <div class="language-selector">
              <label>Language:</label>
              <select [(ngModel)]="selectedLanguage" class="language-dropdown">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="other">Other</option>
              </select>
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
              <p>🤖 Ollama AI is analyzing your {{ selectedLanguage }} code...</p>
              <small>Using real AI model - this may take a moment for large code snippets</small>
            </div>
          </div>
          
          <!-- Results -->
          <div *ngIf="analysisResult && !isAnalyzing" class="analysis-results">
            <div class="model-info" *ngIf="analysisResult.modelUsed">
              <small>🤖 Analyzed by: <strong>{{ analysisResult.modelUsed }}</strong></small>
            </div>

            <!-- Language Mismatch Warning -->
            <div *ngIf="analysisResult.languageMismatch" class="language-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-content">
                <strong>Language Mismatch Detected!</strong>
                <p>You selected <strong>{{ selectedLanguage }}</strong>, but the AI detected <strong>{{ analysisResult.detectedLanguage }}</strong>.
                Please verify your language selection is correct for more accurate analysis.</p>
              </div>
            </div>

            <div class="feedback-section">
              <h4>💬 AI Feedback</h4>
              <div class="feedback-content">{{ analysisResult.feedback }}</div>
            </div>
            
            <div class="suggestions-section" *ngIf="analysisResult.suggestions.length > 0">
              <h4>💡 Suggestions</h4>
              <ul class="suggestions-list">
                <li *ngFor="let suggestion of analysisResult.suggestions">{{ suggestion }}</li>
              </ul>
            </div>
            
            <div class="quality-score" *ngIf="analysisResult.codeQuality > 0">
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
      align-items: center;
      margin-bottom: 16px;
    }

    .input-header h3 {
      margin: 0;
      color: #333;
    }

    .language-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .language-dropdown {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
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

    .language-warning {
      margin-bottom: 16px;
      padding: 12px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      border-left: 4px solid #f39c12;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .warning-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .warning-content {
      flex: 1;
    }

    .warning-content strong {
      color: #d68910;
      font-size: 14px;
    }

    .warning-content p {
      margin: 4px 0 0 0;
      color: #856404;
      font-size: 13px;
      line-height: 1.4;
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
export class CodeAnalysisComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();
  private readonly analysisCache = new Map<string, AnalysisResult>();

  codeInput = '';
  selectedLanguage = 'javascript';
  isAnalyzing = false;
  analysisResult: AnalysisResult | null = null;

  selectedFocus: string = 'codeQuality'; // Default to code quality

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async analyzeCode() {
    if (!this.codeInput.trim()) return;

    // Create cache key for this analysis
    const cacheKey = `${this.codeInput.slice(0, 100)}_${this.selectedLanguage}_${this.selectedFocus}`;

    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      console.log('🚀 Cache hit! Using cached analysis result');
      this.analysisResult = this.analysisCache.get(cacheKey)!;
      return;
    }

    this.isAnalyzing = true;
    this.analysisResult = null;

    try {
      console.log('🔍 Starting code analysis...');
      console.log(`📝 Language: ${this.selectedLanguage}`);
      console.log(`🎯 Focus: ${this.selectedFocus}`);
      console.log(`📄 Code length: ${this.codeInput.length} characters`);

      // Handle "Explain the code" option differently
      if (this.selectedFocus === 'explain') {
        // For explain mode, send directly to chat/Ollama with explanation prompt
        const explainPrompt = `Please explain the following ${this.selectedLanguage} code in detail. Break down what it does, how it works, and any important concepts:\n\n${this.codeInput}`;

        const response = await this.http.post<any>('http://localhost:5000/api/chat', {
          message: explainPrompt,
          model: 'llama3.2:latest' // Use current model
        }).pipe(
          takeUntil(this.destroy$)
        ).toPromise();

        if (response) {
          // Format the explanation as an analysis result
          this.analysisResult = {
            summary: '📖 Code Explanation',
            details: response.response || response.message || 'Explanation generated.',
            suggestions: [],
            language: this.selectedLanguage,
            modelUsed: response.model || 'llama3.2:latest'
          };

          // Cache the result
          if (this.analysisCache.size >= 50) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
          }
          this.analysisCache.set(cacheKey, this.analysisResult);
        }
      } else {
        // Convert single focus to options object for regular analysis
        const options = {
          codeQuality: this.selectedFocus === 'codeQuality',
          performance: this.selectedFocus === 'performance',
          security: this.selectedFocus === 'security',
          bugs: this.selectedFocus === 'bugs',
          refactoring: this.selectedFocus === 'refactoring'
        };

        // Call the backend API with real Ollama model using RxJS for better performance
        const response = await this.http.post<AnalysisResult>('http://localhost:5000/api/codeanalysis', {
          code: this.codeInput,
          language: this.selectedLanguage,
          options: options
        }).pipe(
          takeUntil(this.destroy$)
        ).toPromise();

        if (response) {
          this.analysisResult = response;

          // Cache the result (limit cache size to prevent memory leaks)
          if (this.analysisCache.size >= 50) {
            const firstKey = this.analysisCache.keys().next().value;
            this.analysisCache.delete(firstKey);
          }
          this.analysisCache.set(cacheKey, response);

          console.log('✅ Analysis completed successfully with model:', response.modelUsed);
          console.log('📊 Quality Score:', response.codeQuality);
          console.log('💡 Suggestions:', response.suggestions.length);
        } else {
          throw new Error('No response received from backend');
        }
      }

    } catch (error) {
      console.error('❌ Failed to get analysis from Ollama model:', error);

      // Show error message instead of mock data
      this.analysisResult = {
        feedback: `❌ **Analysis Failed**\n\nUnable to connect to the Ollama model for code analysis. Please ensure:\n\n1. Ollama is running (http://localhost:11434)\n2. Backend API is running (http://localhost:5000)\n3. A compatible model is installed (e.g., llama3.2, codellama)\n\nError: ${error}`,
        suggestions: [
          'Check if Ollama Desktop is running',
          'Verify the backend API is accessible',
          'Ensure you have downloaded a compatible AI model',
          'Try refreshing the page and attempting again'
        ],
        codeQuality: 0,
        timestamp: new Date(),
        language: this.selectedLanguage,
        modelUsed: 'Error - No Model Available'
      };
    }
    
    this.isAnalyzing = false;
  }


}
