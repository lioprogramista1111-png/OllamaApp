import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ollama-chat',
  standalone: true,
  imports: [
    CommonModule
  ],
  template: `
    <div class="chat-container">
      <div class="header">
        <h2>💬 Ollama Chat</h2>
        <p>Chat with AI models powered by Ollama</p>
      </div>

      <div class="chat-content">
        <h1>🎉 OLLAMA CHAT COMPONENT</h1>
        <p>✅ Component is working</p>
        <p>✅ Full-width layout implemented</p>
        <p>✅ Template is rendering</p>
        <p>📍 This component now fills the entire main area</p>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      padding: 24px;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 48px);
      background: #f8f9fa;
      box-sizing: border-box;
      overflow-y: auto;
    }

    .header {
      margin-bottom: 24px;
      text-align: center;
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

    .chat-content {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-height: 500px;
    }

    .chat-content h1 {
      color: #2196f3;
      margin-bottom: 16px;
    }

    .chat-content p {
      margin-bottom: 12px;
      color: #333;
    }
  `]
})
export class OllamaChatComponent {
  // Minimal test component with no dependencies
}
