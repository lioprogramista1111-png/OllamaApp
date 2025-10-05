import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ModelFormatterService } from '../../services/model-formatter.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AvailableModel {
  name: string;
  displayName: string;
  size: string;
}

@Component({
  selector: 'app-simple-ollama-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>🤖 Ollama Chat - {{ currentModelDisplayName }}</h2>
        <div class="status" [class.connected]="isConnected">
          {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
        </div>
      </div>

      <div class="messages-container" #messagesContainer>
        <div *ngFor="let message of messages; let i = index; let last = last"
             class="message"
             [class.user]="message.role === 'user'"
             [class.assistant]="message.role === 'assistant'"
             [class.latest]="last"
             [id]="'message-' + i">
          <div class="message-content">
            <p>{{ message.content }}</p>
            <small>{{ message.timestamp | date:'short' }}</small>
          </div>
        </div>

        <div *ngIf="isLoading" class="message assistant">
          <div class="message-content">
            <div class="thinking-container">
              <div class="spinner"></div>
              <span class="thinking-text">Thinking...</span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-container">
        <input 
          type="text" 
          [(ngModel)]="currentMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Type your message here..."
          [disabled]="isLoading"
          class="message-input"
        >
        <button 
          (click)="sendMessage()" 
          [disabled]="isLoading || !currentMessage.trim()"
          class="send-button"
        >
          {{ isLoading ? '⏳' : '📤' }} Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #ddd;
      border-radius: 12px;
      background: white;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .chat-header {
      background: #2196F3;
      color: white;
      padding: 15px 20px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-header h2 {
      margin: 0;
      font-size: 18px;
    }

    .status {
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.2);
    }

    .status.connected {
      background: rgba(76,175,80,0.3);
    }

    .messages-container {
      height: 400px;
      overflow-y: auto;
      padding: 20px;
      background: #f9f9f9;
      scroll-behavior: smooth;
    }

    .message {
      margin-bottom: 15px;
      display: flex;
    }

    .message.user {
      justify-content: flex-end;
    }

    .message.assistant {
      justify-content: flex-start;
    }

    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .message.user .message-content {
      background: #2196F3;
      color: white;
    }

    .message.assistant .message-content {
      background: #e8f5e8;
      border: 1px solid #4caf50;
    }

    .message.latest {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-content strong {
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      opacity: 0.8;
    }

    .message-content p {
      margin: 0 0 5px 0;
      line-height: 1.4;
    }

    .message-content small {
      font-size: 10px;
      opacity: 0.7;
    }

    .input-container {
      padding: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 10px;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .message-input:focus {
      outline: none;
      border-color: #2196F3;
    }

    .send-button {
      padding: 12px 20px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    }

    .send-button:hover:not(:disabled) {
      background: #1976D2;
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .thinking-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2196F3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .thinking-text {
      color: #666;
      font-style: italic;
    }
  `]
})
export class SimpleOllamaChatComponent implements OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  isConnected = true;
  selectedModel = 'llama3.2:latest';
  currentModelDisplayName = 'Llama 3.2';
  availableModels: AvailableModel[] = [
    { name: 'llama3.2:latest', displayName: 'Llama 3.2', size: '2.0 GB' },
    { name: 'codellama:latest', displayName: 'CodeLlama', size: '3.8 GB' },
    { name: 'mistral:latest', displayName: 'Mistral', size: '4.1 GB' },
    { name: 'phi3:latest', displayName: 'Phi-3', size: '2.3 GB' }
  ];

  private modelChangeListener: ((event: any) => void) | null = null;
  private shouldScrollToBottom = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private modelFormatter: ModelFormatterService
  ) {
    console.log('🤖 Simple Ollama Chat Component loaded!');

    // Get initial model from sidebar if available
    this.getInitialModelFromSidebar();

    this.initializeChat();
    this.loadAvailableModels();

    // Listen for model changes from sidebar - store reference for cleanup
    this.modelChangeListener = (event: any) => {
      console.log('🔄 Chat component received model change:', event.detail);
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

      console.log('🎯 Chat component updated selectedModel to:', this.selectedModel);
      console.log('🎯 Chat component updated currentModelDisplayName to:', this.currentModelDisplayName);

      this.onModelChange();
      this.cdr.detectChanges();
    };

    window.addEventListener('modelChanged', this.modelChangeListener);
  }

  ngAfterViewChecked(): void {
    // Auto-scroll to bottom when new messages arrive
    if (this.shouldScrollToBottom) {
      this.scrollToBottomImmediate();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks
    if (this.modelChangeListener) {
      window.removeEventListener('modelChanged', this.modelChangeListener);
      this.modelChangeListener = null;
    }
  }

  getInitialModelFromSidebar() {
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

  initializeChat() {
    this.currentModelDisplayName = this.getModelDisplayName();

    this.messages = [
      {
        role: 'assistant',
        content: `Hello! How can I help you today?`,
        timestamp: new Date()
      }
    ];

    this.scrollToBottom();
  }

  async loadAvailableModels() {
    try {
      const response = await fetch('http://localhost:5000/api/models');
      if (response.ok) {
        const data = await response.json();
        this.availableModels = data.map((model: any) => ({
          name: model.name,
          displayName: this.modelFormatter.formatModelName(model.name),
          size: this.modelFormatter.formatSize(model.size)
        }));

        // Set default model if current selection is not available
        if (!this.availableModels.find(m => m.name === this.selectedModel)) {
          this.selectedModel = this.availableModels[0]?.name || 'llama3.2:latest';
        }

        this.cdr.markForCheck();
      }
    } catch (error) {
      console.log('Could not load models from backend, using defaults');
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

    this.messages.push({
      role: 'assistant',
      content: `🔄 **Model switched to ${this.currentModelDisplayName}** (${this.selectedModel})\n\nI'm now using a different AI model. My responses may have different characteristics, capabilities, and personality. How can I help you?`,
      timestamp: new Date()
    });
    this.scrollToBottom();
    this.cdr.markForCheck();
  }

  async refreshModels() {
    await this.loadAvailableModels();
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: this.currentMessage.trim(),
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.shouldScrollToBottom = true;

    const messageToSend = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;

    try {
      const response = await fetch('http://localhost:5000/api/chat/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.selectedModel,
          prompt: messageToSend,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response || 'I received your message but couldn\'t generate a response.',
          timestamp: new Date()
        };
        this.messages.push(assistantMessage);
        this.shouldScrollToBottom = true;
      } else {
        throw new Error('Backend API not available');
      }
    } catch (error) {
      const modelResponses: { [key: string]: string } = {
        'llama3.2:latest': `Hello! Responding to: "${messageToSend}". I'm Meta's latest model with improved reasoning capabilities. This is a mock response since the backend is not connected.`,
        'codellama:latest': `Hi! Responding to: "${messageToSend}". I specialize in code generation and programming assistance. This is a mock response since the backend is not connected.`,
        'mistral:latest': `Bonjour! Responding to: "${messageToSend}". I'm known for excellent instruction following and performance. This is a mock response since the backend is not connected.`,
        'phi3:latest': `Hello! Responding to: "${messageToSend}". I'm Microsoft's efficient small language model. This is a mock response since the backend is not connected.`
      };

      const defaultResponse = `Responding to: "${messageToSend}". This is a mock response since the backend is not connected.`;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: modelResponses[this.selectedModel] || defaultResponse,
        timestamp: new Date()
      };
      this.messages.push(assistantMessage);
      this.shouldScrollToBottom = true;
    }

    this.isLoading = false;
    this.cdr.markForCheck();
  }

  scrollToBottom() {
    // Use multiple timeouts to ensure scrolling works even with dynamic content
    setTimeout(() => {
      this.scrollToBottomImmediate();
    }, 50);

    // Second attempt to ensure we're at the bottom after content renders
    setTimeout(() => {
      this.scrollToBottomImmediate();
    }, 200);
  }

  private scrollToBottomImmediate() {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
